import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

// Get all posts (public)
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: { author: { select: { name: true, specialty: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create post (Doctor only)
router.post('/', verifyToken, checkRole(['DOCTOR']), async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: req.user.id
      }
    });
    res.status(201).json(post);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update post
router.patch('/:id', verifyToken, checkRole(['DOCTOR']), async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await prisma.post.update({
      where: { id: Number(req.params.id) },
      data: { title, content }
    });
    res.json(post);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete post
router.delete('/:id', verifyToken, checkRole(['DOCTOR', 'ADMIN']), async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
