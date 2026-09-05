import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, password: hashedPassword, name, role } });
    res.status(201).json({ message: 'Success' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, name: true, role: true, specialty: true }
    });
    res.json(user);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE Account (Patient)
router.delete('/me', verifyToken, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ success: true, message: "Tài khoản của bạn đã được xóa thành công." });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// SIMULATED SOCIAL LOGIN (Google, Facebook, Twitter)
router.post('/social', async (req, res) => {
  try {
    const { email, name, provider, socialId } = req.body;
    
    // Find or create user
    let user = await prisma.user.findUnique({ where: { username: email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: email,
          name: name,
          password: 'SOCIAL_LOGIN_NOPASS', // Mock password
          role: 'PATIENT' // Default to patient for social login
        }
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/register-patient', async (req, res) => {
  try {
    const { username, password, fullName, dob, phone, gender } = req.body;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ 
      data: { username, password: hashedPassword, name: fullName, role: 'PATIENT' } 
    });
    
    await prisma.patient.create({
      data: {
        userId: user.id,
        fullName,
        dob: new Date(dob),
        gender,
        phone,
        address: '',
      }
    });

    res.status(201).json({ message: 'Success' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
