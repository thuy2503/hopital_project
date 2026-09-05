import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình transporter cho Email (Sử dụng Gmail hoặc dịch vụ khác từ .env)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Gửi Email thông báo
 * @param {string} to - Địa chỉ email người nhận
 * @param {string} subject - Tiêu đề email
 * @param {string} text - Nội dung văn bản
 * @param {string} html - Nội dung HTML (tùy chọn)
 */
export const sendEmail = async (to, subject, text, html) => {
  if (!to) {
    console.warn('⚠️ Cảnh báo: Không có email người nhận, bỏ qua gửi email.');
    return;
  }

  // Nếu chưa cấu hình .env thì chỉ log ra console (để demo)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`📧 [MOCK EMAIL] Gửi tới: ${to}`);
    console.log(`📝 Tiêu đề: ${subject}`);
    console.log(`📄 Nội dung: ${text}`);
    return { mock: true, success: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"MedPro Saigon" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('✅ Email đã được gửi:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email:', error);
    return { success: false, error };
  }
};

/**
 * Gửi SMS thông báo (Giả lập)
 * @param {string} phone - Số điện thoại người nhận
 * @param {string} message - Nội dung tin nhắn
 */
export const sendSMS = async (phone, message) => {
  if (!phone) {
    console.warn('⚠️ Cảnh báo: Không có số điện thoại người nhận, bỏ qua gửi SMS.');
    return;
  }

  // Hiện tại chỉ giả lập log ra console
  console.log(`📱 [MOCK SMS] Gửi tới: ${phone}`);
  console.log(`💬 Nội dung: ${message}`);
  return { mock: true, success: true };
};

/**
 * Thông báo xác nhận lịch hẹn
 */
export const notifyAppointmentConfirmation = async (patient, appointment, doctor) => {
  const dateStr = new Date(appointment.date).toLocaleString('vi-VN');
  const subject = 'Xác nhận lịch hẹn khám bệnh - MedPro Saigon';
  const message = `Chào ${patient.fullName},\n\nLịch hẹn của bạn với bác sĩ ${doctor.name} đã được xác nhận vào lúc ${dateStr}.\nLý do khám: ${appointment.reason || 'Khám tổng quát'}.\n\nVui lòng đến đúng giờ. Trân trọng!`;
  
  await sendEmail(patient.email, subject, message);
  await sendSMS(patient.phone, message);
};

/**
 * Thông báo nhắc lịch hẹn
 */
export const notifyAppointmentReminder = async (patient, appointment, doctor) => {
  const dateStr = new Date(appointment.date).toLocaleString('vi-VN');
  const subject = 'Nhắc lịch hẹn khám bệnh - MedPro Saigon';
  const message = `Chào ${patient.fullName},\n\nĐừng quên lịch hẹn khám bệnh của bạn vào ngày mai lúc ${dateStr} tại MedPro Saigon.\n\nHẹn gặp lại bạn!`;
  
  await sendEmail(patient.email, subject, message);
  await sendSMS(patient.phone, message);
};

/**
 * Thông báo kết quả khám bệnh
 */
export const notifyMedicalResult = async (patient, record) => {
  const subject = 'Kết quả khám bệnh mới - MedPro Saigon';
  const message = `Chào ${patient.fullName},\n\nKết quả khám bệnh mới của bạn vào ngày ${new Date(record.createdAt).toLocaleDateString('vi-VN')} đã có trên hệ thống.\nChẩn đoán: ${record.diagnosis}\n\nVui lòng đăng nhập vào hệ thống để xem chi tiết đơn thuốc và lời dặn của bác sĩ.`;
  
  await sendEmail(patient.email, subject, message);
  await sendSMS(patient.phone, message);
};
