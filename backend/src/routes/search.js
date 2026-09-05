import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, checkRole, CLINICAL_ROLES } from '../middlewares/auth.js';

const router = express.Router();

// Utility to remove accents for smart search
const removeAccents = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

// 1. Search Medicines (Public)
router.get('/medicines', async (req, res) => {
  try {
    const { search, unit } = req.query;
    let where = {};
    if (unit) {
      where.unit = unit;
    }
    
    // Check if searching by ID
    if (search && search.startsWith('#') && !isNaN(search.slice(1))) {
      where.id = parseInt(search.slice(1));
    }

    let medicines = await prisma.drug.findMany({ where, orderBy: { name: 'asc' } });
    
    // Smart Search
    if (search && !search.startsWith('#')) {
      const searchNorm = removeAccents(search);
      medicines = medicines.filter(m => 
        removeAccents(m.name).includes(searchNorm) || 
        (m.ingredient && removeAccents(m.ingredient).includes(searchNorm))
      );
    }
    res.json(medicines);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Search Doctors (Public)
router.get('/doctors', async (req, res) => {
  try {
    const { search, specialization, minPrice, maxPrice, workDay } = req.query;
    let where = { role: 'DOCTOR' };
    
    // Check if searching by ID
    if (search && search.startsWith('#') && !isNaN(search.slice(1))) {
      where.id = parseInt(search.slice(1));
    }
    
    if (specialization) {
      where.specialty = { contains: specialization, mode: 'insensitive' };
    }
    if (minPrice || maxPrice) {
      where.consultationFee = {};
      if (minPrice) where.consultationFee.gte = parseFloat(minPrice);
      if (maxPrice) where.consultationFee.lte = parseFloat(maxPrice);
    }

    let doctors = await prisma.user.findMany({
      where,
      select: { 
        id: true, name: true, specialty: true, imageUrl: true, maxPatients: true, 
        schedule: true, consultationFee: true, isAcceptingPatients: true,
        reviewsReceived: { select: { rating: true } }
      }
    });

    // Compute average rating
    doctors = doctors.map(doc => {
      const totalRatings = doc.reviewsReceived.length;
      const avgRating = totalRatings > 0 
        ? doc.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0;
      return { ...doc, averageRating: avgRating, totalReviews: totalRatings };
    });

    // Smart Search & WorkDay filter
    if ((search && !search.startsWith('#')) || workDay) {
      const searchNorm = search ? removeAccents(search) : '';
      const dayNorm = workDay ? removeAccents(workDay) : '';
      
      doctors = doctors.filter(d => {
        let matchSearch = true;
        let matchDay = true;
        
        if (searchNorm) {
          matchSearch = removeAccents(d.name).includes(searchNorm) || 
                        (d.specialty && removeAccents(d.specialty).includes(searchNorm));
        }
        if (dayNorm) {
          matchDay = d.schedule && removeAccents(d.schedule).includes(dayNorm);
        }
        return matchSearch && matchDay;
      });
    }
    
    res.json(doctors);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Search Patients (Doctor/Admin/Staff only)
router.get('/patients', verifyToken, checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { search, bloodType } = req.query;
    let where = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { phone: { contains: search } }
      ];
    }
    if (bloodType) {
      where.bloodType = bloodType;
    }
    const patients = await prisma.patient.findMany({ where, orderBy: { fullName: 'asc' } });
    res.json(patients);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. Search Records (Doctor/Admin/Staff only)
router.get('/records', verifyToken, checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { diagnosis, date } = req.query;
    let where = {};
    if (diagnosis) {
      where.diagnosis = { contains: diagnosis };
    }
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }
    const records = await prisma.medicalRecord.findMany({
      where,
      include: { patient: { select: { fullName: true } }, doctor: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
