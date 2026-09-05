import express from 'express';
import { prisma } from '../index.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.use(verifyToken);

/**
 * Láy lịch sử tin nhắn giữa hai người dùng
 */
router.get('/history/:otherUserId', async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const otherUserId = Number(req.params.otherUserId);

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      include: {
        sender: { select: { name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Lấy danh sách liên hệ (Bác sĩ hoặc Bệnh nhân tùy theo Role)
 */
router.get('/contacts', async (req, res) => {
  try {
    const currentRole = req.user.role;
    let contacts = [];

    if (currentRole === 'PATIENT') {
      // Bệnh nhân thấy danh sách bác sĩ
      contacts = await prisma.user.findMany({
        where: { role: 'DOCTOR' },
        select: { id: true, name: true, specialty: true, imageUrl: true }
      });
    } else if (currentRole === 'DOCTOR' || currentRole === 'STAFF') {
      // Bác sĩ/Nhân viên thấy danh sách bệnh nhân
      contacts = await prisma.user.findMany({
        where: { role: 'PATIENT' },
        select: { id: true, name: true, imageUrl: true }
      });
    }

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
