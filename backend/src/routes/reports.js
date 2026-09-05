import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, checkRole, FINANCE_ROLES } from '../middlewares/auth.js';

const router = express.Router();
router.use(verifyToken);
router.use(checkRole(FINANCE_ROLES));

// 1. Revenue Report
router.get('/revenue', async (req, res) => {
  try {
    const { month, year } = req.query;
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);

    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'PAID',
        paymentDate: { gte: start, lt: end }
      },
      select: { totalAmount: true }
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    res.json({ month, year, totalRevenue, invoiceCount: invoices.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Drug Usage Report
router.get('/drugs', async (req, res) => {
  try {
    const { month, year } = req.query;
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);

    const items = await prisma.prescriptionItem.findMany({
      where: {
        record: {
          createdAt: { gte: start, lt: end }
        }
      },
      include: { drug: { select: { name: true } } }
    });

    // Grouping manually for SQLite compatibility with Prisma
    const usage = items.reduce((acc, item) => {
      const drugName = item.drug.name;
      if (!acc[drugName]) {
        acc[drugName] = { name: drugName, totalQuantity: 0, totalAmount: 0 };
      }
      acc[drugName].totalQuantity += item.quantity;
      acc[drugName].totalAmount += (item.quantity * item.price);
      return acc;
    }, {});

    res.json(Object.values(usage));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Patient Statistics
router.get('/patients', async (req, res) => {
  try {
    const { period } = req.query; // e.g., 'monthly'
    const now = new Date();
    
    // Total patients
    const totalPatients = await prisma.patient.count();
    
    // New patients this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newPatients = await prisma.patient.count({
      where: { createdAt: { gte: startOfMonth } }
    });

    // Patients with appointments this month
    const activePatients = await prisma.appointment.groupBy({
      by: ['patientId'],
      where: { date: { gte: startOfMonth } },
    });

    res.json({
      totalPatients,
      newPatientsThisMonth: newPatients,
      activePatientsThisMonth: activePatients.length,
      period
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
