import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, checkRole, CLINICAL_ROLES, STAFF_ROLES } from '../middlewares/auth.js';
import { notifyMedicalResult } from '../services/notificationService.js';
import { z } from 'zod';

const router = express.Router();
router.use(verifyToken);

const recordSchema = z.object({
  patientId: z.coerce.number(),
  doctorId: z.coerce.number().optional(),
  symptoms: z.string().optional(),
  diagnosis: z.string().min(1, "Chẩn đoán không được để trống"),
  icd10Code: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
  bloodPressure: z.string().optional(),
  heartRate: z.coerce.number().optional(),
  temperature: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  doctorSignature: z.string().optional(),
  ignoreInteractions: z.boolean().optional(),
  items: z.array(z.object({
    drugId: z.coerce.number(),
    quantity: z.coerce.number().min(1),
    instructions: z.string().optional(),
    price: z.coerce.number()
  })).optional(),
  services: z.array(z.object({
    id: z.coerce.number(),
    name: z.string(),
    price: z.coerce.number()
  })).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string()
  })).optional()
});

const updateRecordSchema = z.object({
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  icd10Code: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
  bloodPressure: z.string().optional(),
  heartRate: z.coerce.number().optional(),
  temperature: z.coerce.number().optional(),
  weight: z.coerce.number().optional()
});

router.get('/', async (req, res) => {
  try {
    const { search, patientId, doctorId, startDate, endDate, status } = req.query;
    let where = {};
    
    if (req.user.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (p) {
        where.patientId = p.id;
        where.prescriptionStatus = 'APPROVED';
      } else {
        return res.json([]); // No profile = no records
      }
    } else {
       if (patientId) where.patientId = Number(patientId);
       if (doctorId) where.doctorId = Number(doctorId);
    }

    if (search) {
      where.OR = [
        { diagnosis: { contains: search } },
        { patient: { fullName: { contains: search } } }
      ];
    }
    
    if (status) {
      where.prescriptionStatus = status;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const records = await prisma.medicalRecord.findMany({
      where,
      include: { 
        patient: { select: { fullName: true, phone: true } }, 
        doctor: { select: { name: true, specialty: true } }, 
        invoice: true, 
        prescriptionItems: { include: { drug: true } },
        histories: { orderBy: { createdAt: 'desc' } },
        labTests: true,
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: Number(req.params.id) },
      include: { 
        patient: true, 
        doctor: { select: { name: true, specialty: true } }, 
        invoice: true, 
        prescriptionItems: { include: { drug: true } },
        histories: { orderBy: { createdAt: 'desc' } },
        labTests: true,
        attachments: true
      }
    });

    if (!record) return res.status(404).json({ error: "Record not found" });

    if (req.user.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (!p || record.patientId !== p.id) return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const validatedData = recordSchema.parse(req.body);
     const { patientId, doctorId, symptoms, diagnosis, icd10Code, prescription, notes, bloodPressure, heartRate, temperature, weight, items, services, ignoreInteractions, doctorSignature, attachments } = validatedData;
    
    // Check stock
    if (items && items.length > 0) {
      for (const item of items) {
        const drug = await prisma.drug.findUnique({ where: { id: item.drugId } });
        if (!drug) return res.status(404).json({ error: `Drug ${item.drugId} not found` });
        if (drug.inStock < item.quantity) {
          return res.status(400).json({ error: `Thuốc ${drug.name} không đủ số lượng tồn kho (Còn: ${drug.inStock})` });
        }
      }
    }

    // Check Drug Interactions
    if (items && items.length > 1 && !ignoreInteractions) {
      const drugIds = items.map(i => i.drugId);
      const interactions = await prisma.drugInteraction.findMany({
        where: {
          OR: [
            { drugAId: { in: drugIds }, drugBId: { in: drugIds } }
          ]
        },
        include: { drugA: true, drugB: true }
      });
      
      if (interactions.length > 0) {
        return res.status(400).json({
          error: "Phát hiện tương tác thuốc nguy hiểm!",
          interactions: interactions.map(i => `${i.drugA.name} + ${i.drugB.name}: ${i.description}`)
        });
      }
    }

    const record = await prisma.medicalRecord.create({
      data: { 
        patientId, 
        doctorId: doctorId || req.user.id, 
        symptoms,
        diagnosis, 
        icd10Code,
        prescription: prescription || '', 
        notes,
        bloodPressure,
        heartRate,
        temperature,
        weight,
        doctorSignature,
        prescriptionStatus: 'PENDING',
        prescriptionItems: items && items.length > 0 ? {
          create: items.map(item => ({
            drugId: item.drugId,
            quantity: item.quantity,
            instructions: item.instructions || '',
            price: item.price
          }))
        } : undefined,
        labTests: services && services.length > 0 ? {
          create: services.map(srv => ({
            patientId,
            doctorId: doctorId || req.user.id,
            testName: srv.name,
            status: 'PENDING'
          }))
        } : undefined,
        attachments: attachments && attachments.length > 0 ? {
          create: attachments.map(att => ({
            name: att.name,
            type: att.type,
            url: att.url
          }))
        } : undefined
      },
      include: { prescriptionItems: true, labTests: true, attachments: true }
    });
    
    let drugsTotal = 0;
    if (items && items.length > 0) {
      for (const item of items) {
        drugsTotal += (item.price * item.quantity);
      }
    }
    
    let servicesTotal = 0;
    if (services && services.length > 0) {
      for (const srv of services) {
        servicesTotal += srv.price;
      }
    }
    
    const fullPatient = await prisma.patient.findUnique({ where: { id: patientId } });
    const hasInsurance = fullPatient && fullPatient.healthInsurance && fullPatient.healthInsurance.trim() !== '';
    const rawTotal = 200000 + drugsTotal + servicesTotal;
    const totalAmount = hasInsurance ? Math.round(rawTotal * 0.2) : rawTotal;

    await prisma.invoice.create({
      data: { patientId, recordId: record.id, totalAmount }
    });
    
    if (fullPatient) {
      notifyMedicalResult(fullPatient, record);
    }
    
    res.status(201).json(record);
  } catch (error) { 
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message }); 
  }
});

router.patch('/:id/approve', checkRole(STAFF_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.medicalRecord.findUnique({
      where: { id: Number(id) },
      include: { prescriptionItems: true }
    });
    
    if (!record) return res.status(404).json({ error: "Record not found" });
    if (record.prescriptionStatus === 'APPROVED') return res.status(400).json({ error: "Đơn thuốc này đã được duyệt" });

    // Check stock again before approving
    for (const item of record.prescriptionItems) {
      const drug = await prisma.drug.findUnique({ where: { id: item.drugId } });
      if (drug.inStock < item.quantity) {
        return res.status(400).json({ error: `Thuốc ${drug.name} không đủ tồn kho để duyệt (Còn: ${drug.inStock}, Cần: ${item.quantity})` });
      }
    }

    // Deduct stock and log transaction
    for (const item of record.prescriptionItems) {
      await prisma.drug.update({
        where: { id: item.drugId },
        data: { inStock: { decrement: item.quantity } }
      });

      await prisma.inventoryLog.create({
        data: {
          drugId: item.drugId,
          type: 'DISPENSE',
          quantity: item.quantity,
          notes: `Cấp phát thuốc tự động theo bệnh án điện tử #${record.id}`
        }
      });
    }

    const updated = await prisma.medicalRecord.update({
      where: { id: Number(id) },
      data: { prescriptionStatus: 'APPROVED' }
    });

    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.patch('/:id/reject', checkRole(STAFF_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const record = await prisma.medicalRecord.findUnique({ where: { id: Number(id) } });
    
    if (!record) return res.status(404).json({ error: "Record not found" });
    if (record.prescriptionStatus === 'APPROVED') return res.status(400).json({ error: "Không thể từ chối đơn thuốc đã duyệt" });

    const updated = await prisma.medicalRecord.update({
      where: { id: Number(id) },
      data: { 
        prescriptionStatus: 'REJECTED',
        notes: reason ? `${record.notes || ''}\n\n[TỪ CHỐI]: ${reason}` : record.notes
      }
    });

    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.patch('/:id', checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateRecordSchema.parse(req.body);
    
    const oldRecord = await prisma.medicalRecord.findUnique({ where: { id: Number(id) } });
    if (!oldRecord) return res.status(404).json({ error: "Record not found" });

    await prisma.medicalRecordHistory.create({
      data: {
        recordId: oldRecord.id,
        changedById: req.user.id,
        previousDiagnosis: oldRecord.diagnosis,
        previousNotes: oldRecord.notes
      }
    });

    const record = await prisma.medicalRecord.update({
      where: { id: Number(id) },
      data: validatedData
    });
    res.json(record);
  } catch (error) { 
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message }); 
  }
});

router.delete('/:id', checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.medicalRecord.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
