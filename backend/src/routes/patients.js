import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, checkRole, CLINICAL_ROLES } from '../middlewares/auth.js';
const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'PATIENT') {
      let p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (!p) {
         const u = await prisma.user.findUnique({ where: { id: req.user.id } });
         p = await prisma.patient.create({
           data: { userId: u.id, fullName: u.name, dob: new Date(), gender: 'Khác', phone: '', address: ''}
         });
      }
      return res.json([p]);
    }
    const patients = await prisma.patient.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(patients);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { fullName, dob, gender, idCard, healthInsurance, phone, emergencyContact, address, history, email, bloodType } = req.body;
    const patient = await prisma.patient.create({
      data: { fullName, dob: new Date(dob), gender, idCard, healthInsurance, phone, emergencyContact, address, history, email, bloodType }
    });
    res.status(201).json(patient);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: Number(req.params.id) },
      include: { 
        records: { include: { doctor: true, prescriptionItems: { include: { drug: true } } }, orderBy: { createdAt: 'desc' } }, 
        appointments: { include: { doctor: true }, orderBy: { date: 'desc' } },
        labTests: { include: { doctor: true }, orderBy: { createdAt: 'desc' } }
      }
    });
    res.json(patient);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', verifyToken, checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, dob, gender, idCard, healthInsurance, phone, emergencyContact, address, history, email, bloodType } = req.body;
    const patient = await prisma.patient.update({
      where: { id: Number(id) },
      data: { fullName, dob: new Date(dob), gender, idCard, healthInsurance, phone, emergencyContact, address, history, email, bloodType }
    });
    res.json(patient);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', verifyToken, checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.patient.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
