import express from 'express';
import { prisma } from '../index.js';
import bcrypt from 'bcryptjs';
import { verifyToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

// Public route for Landing Page
router.get('/', async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, name: true, specialty: true, imageUrl: true }
    });
    res.json(doctors);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin Create Doctor
router.post('/', verifyToken, checkRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { username, password, name, specialty, imageUrl } = req.body;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const doctor = await prisma.user.create({
      data: { username, password: hashedPassword, name, role: 'DOCTOR', specialty, imageUrl }
    });
    res.status(201).json(doctor);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin Update Doctor
router.put('/:id', verifyToken, checkRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialty, imageUrl, password } = req.body;
    let data = { name, specialty, imageUrl };
    if (password && password.trim() !== '') {
      data.password = await bcrypt.hash(password, 10);
    }
    const doctor = await prisma.user.update({
      where: { id: Number(id) },
      data
    });
    res.json(doctor);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin Delete Doctor
router.delete('/:id', verifyToken, checkRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PRIVATE ROUTES FOR LOGGED-IN DOCTOR
router.get('/profile', verifyToken, checkRole(['DOCTOR']), async (req, res) => {
  try {
    const doctor = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, name: true, specialty: true, imageUrl: true, maxPatients: true, schedule: true }
    });
    res.json(doctor);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/profile', verifyToken, checkRole(['DOCTOR']), async (req, res) => {
  try {
    const { name, specialty, imageUrl } = req.body;
    const doctor = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, specialty, imageUrl }
    });
    res.json(doctor);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/settings/max-patients', verifyToken, checkRole(['DOCTOR']), async (req, res) => {
  try {
    const { maxPatients } = req.body;
    const doctor = await prisma.user.update({
      where: { id: req.user.id },
      data: { maxPatients: Number(maxPatients) }
    });
    res.json({ success: true, maxPatients: doctor.maxPatients });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/settings/schedule', verifyToken, checkRole(['DOCTOR']), async (req, res) => {
  try {
    const { schedule } = req.body;
    const doctor = await prisma.user.update({
      where: { id: req.user.id },
      data: { schedule }
    });
    res.json({ success: true, schedule: doctor.schedule });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
