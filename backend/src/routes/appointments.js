import express from 'express';
import { prisma } from '../index.js';
import { verifyToken, checkRole, CLINICAL_ROLES } from '../middlewares/auth.js';
import { notifyAppointmentConfirmation, notifyAppointmentReminder } from '../services/notificationService.js';
import { broadcastNotification, sendNotificationToUser } from '../socket.js';
const router = express.Router();

// 1. PUBLIC DOCTOR LIST FOR APPOINTMENTS (can be used by guests or logged-in)
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, name: true, specialty: true, imageUrl: true, maxPatients: true, schedule: true }
    });
    res.json(doctors);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.use(verifyToken);

// 2. GENERAL APPOINTMENTS LIST (Admin/Staff/Doctor)
router.get('/', checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const where = req.user.role === 'DOCTOR' ? { doctorId: req.user.id } : {};
    const appts = await prisma.appointment.findMany({
      where,
      include: { patient: true, doctor: { select: { name: true, specialty: true } } },
      orderBy: { date: 'asc' }
    });
    res.json(appts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. PATIENT'S OWN APPOINTMENTS
router.get('/my-appointments', checkRole(['PATIENT']), async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });
    const appts = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: { doctor: { select: { name: true, specialty: true } } },
      orderBy: { date: 'desc' }
    });
    res.json(appts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. DOCTOR'S TODAY APPOINTMENTS
router.get('/doctor/today', checkRole(['DOCTOR']), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const appts = await prisma.appointment.findMany({
      where: {
        doctorId: req.user.id,
        date: { gte: startOfDay, lt: endOfDay }
      },
      include: { patient: true },
      orderBy: { date: 'asc' }
    });
    res.json(appts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { patientId, doctorId, date, reason, timeSlot, type } = req.body;
    const docId = Number(doctorId || req.user.id);
    const targetDate = new Date(date);
    
    // Create Date window for the whole day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // 1. Fetch Doctor Cap
    const doctor = await prisma.user.findUnique({ where: { id: docId } });
    if (!doctor) return res.status(404).json({ error: "Bác sĩ không tồn tại" });

    // 2. Overlap Check (Trùng lịch)
    if (timeSlot) {
      const duplicate = await prisma.appointment.findFirst({
        where: {
          doctorId: docId,
          date: { gte: startOfDay, lt: endOfDay },
          timeSlot,
          status: { not: 'CANCELLED' }
        }
      });
      if (duplicate) {
        return res.status(400).json({ error: `Bác sĩ đã có lịch hẹn vào khung giờ ${timeSlot} ngày ${targetDate.toLocaleDateString('vi-VN')}. Vui lòng chọn khung giờ khác.` });
      }
    }

    // 3. Count current bookings for that day
    const currentBookings = await prisma.appointment.count({
      where: {
        doctorId: docId,
        date: { gte: startOfDay, lt: endOfDay },
        status: { not: 'CANCELLED' }
      }
    });

    // 4. Prevent Overbooking
    if (currentBookings >= doctor.maxPatients) {
      return res.status(400).json({ error: `Bác sĩ đã đạt mức tối đa ${doctor.maxPatients} ca/ngày. Vui lòng chọn ngày khác.` });
    }

    const appt = await prisma.appointment.create({
      data: { 
        patientId: Number(patientId), 
        doctorId: docId, 
        date: targetDate, 
        reason,
        type: type || "OFFLINE",
        timeSlot
      },
      include: { patient: true, doctor: true }
    });

    // Gửi thông báo xác nhận
    notifyAppointmentConfirmation(appt.patient, appt, appt.doctor);
    broadcastNotification({
      title: 'Lịch hẹn mới',
      message: `Bệnh nhân ${appt.patient?.fullName || ''} vừa đăng ký lịch khám với BS. ${appt.doctor?.name || ''}`,
      type: 'APPOINTMENT'
    });

    res.status(201).json(appt);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.patch('/:id/status', checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { status } = req.body;
    const appt = await prisma.appointment.update({
      where: { id: Number(req.params.id) },
      data: { status },
      include: { patient: true, doctor: true }
    });

    // Nếu chuyển sang trạng thái CONFIRMED, gửi thông báo
    if (status === 'CONFIRMED') {
      notifyAppointmentConfirmation(appt.patient, appt, appt.doctor);
    }

    res.json(appt);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId, doctorId, date, reason, status, timeSlot, type } = req.body;
    const docId = Number(doctorId);
    const targetDate = new Date(date);

    // Create Date window for the whole day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Overlap Check (Trùng lịch) excluding this appointment itself
    if (timeSlot) {
      const duplicate = await prisma.appointment.findFirst({
        where: {
          id: { not: Number(id) },
          doctorId: docId,
          date: { gte: startOfDay, lt: endOfDay },
          timeSlot,
          status: { not: 'CANCELLED' }
        }
      });
      if (duplicate) {
        return res.status(400).json({ error: `Bác sĩ đã có lịch hẹn vào khung giờ ${timeSlot} ngày ${targetDate.toLocaleDateString('vi-VN')}. Vui lòng chọn khung giờ khác.` });
      }
    }

    const appt = await prisma.appointment.update({
      where: { id: Number(id) },
      data: { 
        patientId: Number(patientId), 
        doctorId: docId, 
        date: targetDate, 
        reason, 
        status,
        timeSlot,
        type: type || "OFFLINE"
      }
    });
    res.json(appt);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apptId = Number(id);
    const appt = await prisma.appointment.findUnique({ where: { id: apptId } });
    if (!appt) return res.status(404).json({ error: "Appointment not found" });

    // Allow deletion if Admin/Staff/Doctor OR if it's the Patient's own appointment
    let allowed = ['ADMIN', 'STAFF', 'NURSE', 'DOCTOR'].includes(req.user.role);
    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (patient && appt.patientId === patient.id) allowed = true;
    }

    if (!allowed) return res.status(403).json({ error: "Unauthorized to cancel this appointment" });

    await prisma.appointment.delete({ where: { id: apptId } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

const getRoomNumber = (specialty) => {
  switch (specialty?.toUpperCase()) {
    case 'TIM MẠCH':
    case 'CARDIOLOGY':
      return 'Phòng 101 - Khoa Tim mạch';
    case 'TAI MŨI HỌNG':
    case 'ENT':
      return 'Phòng 102 - Khoa Tai Mũi Họng';
    case 'DA LIỄU':
    case 'DERMATOLOGY':
      return 'Phòng 103 - Khoa Da liễu';
    case 'NHI KHOA':
    case 'PEDIATRICS':
      return 'Phòng 104 - Khoa Nhi';
    case 'RĂNG HÀM MẶT':
    case 'DENTISTRY':
      return 'Phòng 105 - Khoa Răng Hàm Mặt';
    default:
      return 'Phòng 100 - Khoa Đa khoa';
  }
};

router.patch('/:id/checkin', checkRole(CLINICAL_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await prisma.appointment.findUnique({
      where: { id: Number(id) },
      include: { doctor: true }
    });
    if (!appt) return res.status(404).json({ error: "Lịch hẹn không tồn tại" });

    // Calculate queue number for the doctor on that day
    const startOfDay = new Date(appt.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const checkedInCount = await prisma.appointment.count({
      where: {
        doctorId: appt.doctorId,
        date: { gte: startOfDay, lt: endOfDay },
        checkInTime: { not: null }
      }
    });

    const queueNumber = checkedInCount + 1;
    const roomNumber = getRoomNumber(appt.doctor.specialty);

    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: {
        status: 'CONFIRMED',
        checkInTime: new Date(),
        queueNumber,
        roomNumber
      },
      include: { patient: true, doctor: { select: { name: true, specialty: true } } }
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/sms-remind', async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await prisma.appointment.findUnique({
      where: { id: Number(id) },
      include: { patient: true, doctor: true }
    });
    if (!appt) return res.status(404).json({ error: "Lịch hẹn không tồn tại" });

    await notifyAppointmentReminder(appt.patient, appt, appt.doctor);
    res.json({ success: true, message: "Đã gửi SMS/Zalo nhắc lịch hẹn cho bệnh nhân thành công!" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
