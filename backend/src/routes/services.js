import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { name: 'asc' } });
    res.json(services);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin/Staff/Doctor: Add service
router.post('/', verifyToken, checkRole(['ADMIN', 'STAFF', 'DOCTOR']), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const service = await prisma.service.create({
      data: { name, description, price: Number(price) }
    });
    res.status(201).json(service);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin/Staff/Doctor: Update service
router.patch('/:id', verifyToken, checkRole(['ADMIN', 'STAFF', 'DOCTOR']), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const service = await prisma.service.update({
      where: { id: Number(req.params.id) },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? Number(price) : undefined
      }
    });
    res.json(service);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin/Staff/Doctor: Delete service
router.delete('/:id', verifyToken, checkRole(['ADMIN', 'STAFF', 'DOCTOR']), async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
