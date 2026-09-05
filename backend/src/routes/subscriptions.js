import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

// Get available annual services/subscriptions
router.get('/available', async (req, res) => {
  res.json([
    { id: 1, name: 'Gói Khám Tổng Quát Hàng Năm', description: 'Bao gồm xét nghiệm máu, siêu âm, X-quang và tư vấn bác sĩ.', price: 2500000 },
    { id: 2, name: 'Gói Chăm Sóc Sức Khỏe Gia Đình', description: 'Ưu đãi cho 4 thành viên, kiểm tra định kỳ 6 tháng/lần.', price: 8000000 },
    { id: 3, name: 'Gói Tầm Soát Ung Thư Sớm', description: 'Sử dụng các công nghệ xét nghiệm chuyên sâu.', price: 5000000 }
  ]);
});

// Enroll in a subscription (Patient)
router.post('/enroll', verifyToken, checkRole(['PATIENT']), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const sub = await prisma.subscription.create({
      data: {
        name,
        price,
        description,
        patientId: req.user.id
      }
    });
    res.status(201).json(sub);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// My subscriptions
router.get('/my', verifyToken, async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { patientId: req.user.id }
    });
    res.json(subs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
