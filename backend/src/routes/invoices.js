import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, FINANCE_ROLES } from '../middlewares/auth.js';

const router = express.Router();
router.use(verifyToken);

// Danh sách hoá đơn
router.get('/', async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (p) where.patientId = p.id;
    }
    const invoices = await prisma.invoice.findMany({
      where,
      include: { patient: true, record: { include: { doctor: true, prescriptionItems: { include: { drug: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Cập nhật trạng thái thanh toán
router.put('/:id/pay', async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return res.status(404).json({ error: "Không tìm thấy hóa đơn" });

    // Nếu là bệnh nhân, kiểm tra xem hóa đơn có thuộc về họ không
    if (req.user.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (!p || invoice.patientId !== p.id) {
        return res.status(403).json({ error: "Không có quyền thanh toán hóa đơn này" });
      }
    } else if (!FINANCE_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: "Không có quyền thực hiện" });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID', paymentDate: new Date() }
    });
    res.json(updatedInvoice);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
