import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, checkRole, PHARMACY_ROLES } from '../middlewares/auth.js';

const router = express.Router();
router.use(verifyToken);

// --- PRESCRIPTIONS FOR PHARMACIST ---

// Get all prescriptions for dispensing
router.get('/prescriptions', checkRole(PHARMACY_ROLES), async (req, res) => {
  try {
    const { status } = req.query; // PENDING, APPROVED, REJECTED
    let where = {
      prescriptionItems: { some: {} } // Chỉ lấy các hồ sơ bệnh án có thuốc
    };
    if (status) {
      where.prescriptionStatus = status;
    }
    const records = await prisma.medicalRecord.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
        prescriptionItems: {
          include: { drug: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(records);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- INVENTORY LOGS ---

// Log a new import and update stock
router.post('/import', checkRole(PHARMACY_ROLES), async (req, res) => {
  try {
    const { drugId, quantity, notes, expiryDate } = req.body;
    if (!drugId || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({ error: "Thông tin nhập kho không hợp lệ" });
    }
    const drug = await prisma.drug.findUnique({ where: { id: Number(drugId) } });
    if (!drug) return res.status(404).json({ error: "Không tìm thấy thuốc" });

    const updateData = {
      inStock: { increment: Number(quantity) }
    };
    if (expiryDate) {
      updateData.expiryDate = new Date(expiryDate);
    }

    const updatedDrug = await prisma.drug.update({
      where: { id: Number(drugId) },
      data: updateData
    });

    const log = await prisma.inventoryLog.create({
      data: {
        drugId: Number(drugId),
        type: 'IMPORT',
        quantity: Number(quantity),
        notes: notes || 'Nhập kho bổ sung'
      }
    });

    res.status(201).json({ drug: updatedDrug, log });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get all inventory logs
router.get('/inventory-logs', checkRole(PHARMACY_ROLES), async (req, res) => {
  try {
    const logs = await prisma.inventoryLog.findMany({
      include: { drug: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get inventory dashboard metrics/reports
router.get('/reports/inventory', checkRole(PHARMACY_ROLES), async (req, res) => {
  try {
    const drugs = await prisma.drug.findMany();
    
    let totalValue = 0;
    let lowStockCount = 0;
    let expiredOrSoonCount = 0;
    
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    drugs.forEach(d => {
      totalValue += d.price * d.inStock;
      if (d.inStock <= 10) {
        lowStockCount++;
      }
      if (d.expiryDate) {
        const exp = new Date(d.expiryDate);
        if (exp <= threeMonthsFromNow) {
          expiredOrSoonCount++;
        }
      }
    });

    const dispensedLogs = await prisma.inventoryLog.findMany({
      where: {
        type: { in: ['EXPORT', 'DISPENSE'] }
      }
    });
    const totalDispensedQty = dispensedLogs.reduce((acc, curr) => acc + curr.quantity, 0);

    res.json({
      totalValue,
      lowStockCount,
      expiredOrSoonCount,
      totalDispensedQty,
      totalDrugsCount: drugs.length
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- DRUG INTERACTIONS ---

router.get('/interactions', async (req, res) => {
  try {
    const interactions = await prisma.drugInteraction.findMany({
      include: { drugA: true, drugB: true }
    });
    res.json(interactions);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/interactions', checkRole(PHARMACY_ROLES), async (req, res) => {
  try {
    const { drugAId, drugBId, severity, description } = req.body;
    if (drugAId === drugBId) return res.status(400).json({ error: "Hai loại thuốc phải khác nhau" });
    
    const minId = Math.min(Number(drugAId), Number(drugBId));
    const maxId = Math.max(Number(drugAId), Number(drugBId));

    const interaction = await prisma.drugInteraction.create({
      data: { drugAId: minId, drugBId: maxId, severity, description }
    });
    res.status(201).json(interaction);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/interactions/:id', checkRole(PHARMACY_ROLES), async (req, res) => {
  try {
    await prisma.drugInteraction.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- DRUGS CRUD ---

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ingredient: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    const drugs = await prisma.drug.findMany({ 
      where,
      orderBy: { name: 'asc' } 
    });
    res.json(drugs);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', checkRole(PHARMACY_ROLES), async (req, res) => {
  try {
    const { name, ingredient, usage, price, inStock, specialty, code, registrationNo, concentration, route, expiryDate } = req.body;
    const drug = await prisma.drug.create({
      data: { 
        name, 
        ingredient, 
        usage, 
        price: Number(price), 
        inStock: Number(inStock), 
        specialty,
        code,
        registrationNo,
        concentration,
        route,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      }
    });
    res.status(201).json(drug);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', checkRole(PHARMACY_ROLES), async (req, res) => {
  try {
    const { name, ingredient, usage, price, inStock, specialty, code, registrationNo, concentration, route, expiryDate } = req.body;
    const drug = await prisma.drug.update({
      where: { id: Number(req.params.id) },
      data: { 
        name, 
        ingredient, 
        usage, 
        price: Number(price), 
        inStock: Number(inStock), 
        specialty,
        code,
        registrationNo,
        concentration,
        route,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      }
    });
    res.json(drug);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.patch('/:id', checkRole(PHARMACY_ROLES), async (req, res) => {
  try {
    const { name, ingredient, usage, price, inStock, specialty, code, registrationNo, concentration, route, expiryDate } = req.body;
    let data = {};
    if (name !== undefined) data.name = name;
    if (ingredient !== undefined) data.ingredient = ingredient;
    if (usage !== undefined) data.usage = usage;
    if (price !== undefined) data.price = Number(price);
    if (inStock !== undefined) data.inStock = Number(inStock);
    if (specialty !== undefined) data.specialty = specialty;
    if (code !== undefined) data.code = code;
    if (registrationNo !== undefined) data.registrationNo = registrationNo;
    if (concentration !== undefined) data.concentration = concentration;
    if (route !== undefined) data.route = route;
    if (expiryDate !== undefined) data.expiryDate = expiryDate ? new Date(expiryDate) : null;

    const drug = await prisma.drug.update({
      where: { id: Number(req.params.id) },
      data
    });
    res.json(drug);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', checkRole(PHARMACY_ROLES), async (req, res) => {
  try {
    await prisma.drug.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
