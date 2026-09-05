import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, checkRole, CLINICAL_ROLES } from '../middlewares/auth.js';
import { z } from 'zod';
import { broadcastNotification, sendNotificationToUser } from '../socket.js';

const router = express.Router();
router.use(verifyToken);

const createLabTestSchema = z.object({
  patientId: z.coerce.number(),
  doctorId: z.coerce.number().optional(),
  recordId: z.coerce.number().optional().nullable(),
  testName: z.string().min(1, "Tên xét nghiệm không được để trống"),
  notes: z.string().optional().nullable()
});

const updateLabTestSchema = z.object({
  result: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["PENDING", "PENDING_APPROVAL", "COMPLETED"]).optional(),
  fileUrl: z.string().optional().nullable()
});

// GET lab tests with filters
router.get('/', async (req, res) => {
  try {
    const { patientId, doctorId, status, recordId } = req.query;
    let where = {};
    
    if (req.user.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (p) {
        where.patientId = p.id;
      } else {
        return res.json([]);
      }
    } else {
       if (patientId) where.patientId = Number(patientId);
       if (doctorId) where.doctorId = Number(doctorId);
    }

    if (status) {
      where.status = status;
    }
    if (recordId) {
      where.recordId = Number(recordId);
    }

    const labTests = await prisma.labTest.findMany({
      where,
      include: { 
        patient: { select: { fullName: true, phone: true } }, 
        doctor: { select: { name: true, specialty: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(labTests);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST to create a lab test order
router.post('/', checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const validatedData = createLabTestSchema.parse(req.body);
    const labTest = await prisma.labTest.create({
      data: {
        ...validatedData,
        doctorId: validatedData.doctorId || req.user.id,
        status: 'PENDING'
      }
    });
    res.status(201).json(labTest);
  } catch (error) { 
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message }); 
  }
});

// GET historical trend metrics for a specific patient (for charting)
router.get('/patient/:patientId/trends', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { testName } = req.query;
    
    let where = {
      patientId: Number(patientId),
      status: 'COMPLETED'
    };
    
    if (testName) {
      where.testName = { contains: testName, mode: 'insensitive' };
    }

    const trends = await prisma.labTest.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        testName: true,
        result: true,
        notes: true,
        createdAt: true
      }
    });

    res.json(trends);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// PATCH to update test results (used by lab technicians / staff)
router.patch('/:id', checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateLabTestSchema.parse(req.body);
    
    const labTest = await prisma.labTest.update({
      where: { id: Number(id) },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    });

    if (labTest.status === 'PENDING_APPROVAL') {
      broadcastNotification({
        title: 'Cận lâm sàng chờ duyệt',
        message: `KTV vừa hoàn tất kết quả xét nghiệm/chụp chiếu: ${labTest.testName}. Đang chờ Bác sĩ duyệt!`,
        type: 'LABTEST'
      });
    }

    res.json(labTest);
  } catch (error) { 
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message }); 
  }
});

// PATCH to approve a test result (used by doctors)
router.patch('/:id/approve', checkRole(['DOCTOR', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorNotes, result } = req.body;
    
    const labTest = await prisma.labTest.findUnique({ where: { id: Number(id) } });
    if (!labTest) return res.status(404).json({ error: "Không tìm thấy chỉ định xét nghiệm" });

    const updateData = {
      status: 'COMPLETED',
      updatedAt: new Date()
    };
    if (doctorNotes !== undefined) updateData.notes = doctorNotes;
    if (result !== undefined) updateData.result = result;

    const updated = await prisma.labTest.update({
      where: { id: Number(id) },
      data: updateData
    });

    broadcastNotification({
      title: 'Kết quả cận lâm sàng đã phê duyệt',
      message: `Bác sĩ đã phê duyệt và trả kết quả: ${updated.testName}`,
      type: 'LABTEST'
    });

    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE a lab test order
router.delete('/:id', checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.labTest.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
