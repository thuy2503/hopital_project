import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

// Get all reviews (public)
router.get('/', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        author: { select: { name: true } },
        doctor: { select: { name: true } },
        service: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Post a review (Patient only)
router.post('/', verifyToken, checkRole(['PATIENT']), async (req, res) => {
  try {
    const { rating, comment, doctorId, serviceId } = req.body;
    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        authorId: req.user.id,
        doctorId: doctorId ? Number(doctorId) : null,
        serviceId: serviceId ? Number(serviceId) : null
      }
    });
    res.status(201).json(review);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
