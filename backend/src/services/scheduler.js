import cron from 'node-cron';
import { prisma } from '../index.js';
import { notifyAppointmentReminder } from './notificationService.js';

/**
 * Khởi tạo các công việc định kỳ (Cron Jobs)
 */
export const initScheduler = () => {
  // Chạy mỗi ngày vào lúc 8:00 sáng
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Đang chạy tác vụ kiểm tra lịch hẹn ngày mai...');
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);

      // Tìm các lịch hẹn vào ngày mai có trạng thái CONFIRMED
      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          date: {
            gte: tomorrow,
            lt: nextDay
          },
          status: 'CONFIRMED'
        },
        include: {
          patient: true,
          doctor: true
        }
      });

      console.log(`📌 Tìm thấy ${upcomingAppointments.length} lịch hẹn cần nhắc.`);

      for (const appt of upcomingAppointments) {
        await notifyAppointmentReminder(appt.patient, appt, appt.doctor);
      }
      
      console.log('✅ Đã hoàn thành gửi nhắc lịch hẹn.');
    } catch (error) {
      console.error('❌ Lỗi trong scheduler nhắc lịch:', error);
    }
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });

  console.log('🚀 Scheduler đã được khởi tạo (Nhắc lịch hàng ngày lúc 8:00 AM).');
};
