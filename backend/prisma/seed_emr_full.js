import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const mockSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const mockXraySvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzEwMTAxMCIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmaWxsPSIjNTVmZmZmIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NSUNSTy1QQUNTIFgtUkFZIFNIMDEwMjMzPC90ZXh0Pjwvc3ZnPg==';

async function main() {
  const password = await bcrypt.hash('123456', 10);

  console.log('🧹 Đang dọn dẹp dữ liệu cũ...');
  await prisma.prescriptionItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.medicalRecordHistory.deleteMany();
  await prisma.labTest.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.drug.deleteMany();
  await prisma.user.deleteMany({
    where: {
      username: {
        in: ['admin', 'doctor1', 'doctor_san', 'doctor_nhi', 'doctor_dalieu', 'doctor_ngoai', 'doctor_noi', 'patient1', 'patient2', 'patient3', 'nurse1', 'pharmacist1', 'accountant1']
      }
    }
  });

  console.log('👤 Đang khởi tạo tài khoản nhân viên y tế và quản trị...');

  // 1. Tạo các tài khoản vai trò hệ thống
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password,
      name: 'Hệ thống Quản trị',
      role: 'ADMIN',
      email: 'admin@medpro.com'
    }
  });

  const nurse = await prisma.user.create({
    data: {
      username: 'nurse1',
      password,
      name: 'ĐD. Nguyễn Thị Mai',
      role: 'NURSE',
      email: 'nurse1@medpro.com'
    }
  });

  const pharmacist = await prisma.user.create({
    data: {
      username: 'pharmacist1',
      password,
      name: 'DS. Lê Hoàng Nam',
      role: 'PHARMACIST',
      email: 'pharmacist1@medpro.com'
    }
  });

  const accountant = await prisma.user.create({
    data: {
      username: 'accountant1',
      password,
      name: 'KT. Trần Minh Tâm',
      role: 'ACCOUNTANT',
      email: 'accountant1@medpro.com'
    }
  });

  // 2. Tạo Bác sĩ theo các chuyên khoa
  const drA = await prisma.user.create({
    data: {
      username: 'doctor1',
      password,
      name: 'BS. Nguyễn Văn A',
      role: 'DOCTOR',
      specialty: 'Nội tổng quát',
      email: 'doctor1@medpro.com',
      consultationFee: 200000
    }
  });

  const drB = await prisma.user.create({
    data: {
      username: 'doctor_san',
      password,
      name: 'BS. Lê Thị B',
      role: 'DOCTOR',
      specialty: 'Sản phụ khoa',
      email: 'doctor_san@medpro.com',
      consultationFee: 250000
    }
  });

  const drC = await prisma.user.create({
    data: {
      username: 'doctor_nhi',
      password,
      name: 'BS. Phạm Văn C',
      role: 'DOCTOR',
      specialty: 'Nhi khoa',
      email: 'doctor_nhi@medpro.com',
      consultationFee: 200000
    }
  });

  const drD = await prisma.user.create({
    data: {
      username: 'doctor_dalieu',
      password,
      name: 'BS. Hoàng Thị D',
      role: 'DOCTOR',
      specialty: 'Da liễu',
      email: 'doctor_dalieu@medpro.com',
      consultationFee: 300000
    }
  });

  console.log('Đang tạo danh mục thuốc Bộ Y tế phân loại theo chuyên khoa...');
  const drugsData = [
    // Nội tổng quát
    { name: 'Paracetamol 500mg', ingredient: 'Paracetamol', usage: 'Uống 1 viên khi sốt trên 38.5 độ, cách 4-6 giờ', unit: 'Viên', price: 1500, inStock: 500, specialty: 'Nội tổng quát', code: 'T001', registrationNo: 'VD-12345-20', concentration: '500mg', route: 'Đường uống', expiryDate: new Date('2028-12-31') },
    { name: 'Amoxicillin 500mg', ingredient: 'Amoxicillin', usage: 'Uống ngày 2 lần, mỗi lần 1 viên sau ăn sáng/tối', unit: 'Viên', price: 3000, inStock: 300, specialty: 'Nội tổng quát', code: 'T002', registrationNo: 'VD-12346-20', concentration: '500mg', route: 'Đường uống', expiryDate: new Date('2028-06-30') },
    { name: 'Panadol Extra', ingredient: 'Paracetamol, Caffeine', usage: 'Uống 1 viên khi đau đầu', unit: 'Viên', price: 2500, inStock: 400, specialty: 'Nội tổng quát', code: 'T003', registrationNo: 'VD-12347-21', concentration: '500mg/65mg', route: 'Đường uống', expiryDate: new Date('2029-01-15') },
    
    // Tim mạch
    { name: 'Amlodipine 5mg', ingredient: 'Amlodipine', usage: 'Uống 1 viên buổi sáng sau ăn', unit: 'Viên', price: 4500, inStock: 200, specialty: 'Tim mạch', code: 'T004', registrationNo: 'VD-22345-19', concentration: '5mg', route: 'Đường uống', expiryDate: new Date('2027-10-20') },
    { name: 'Losartan 50mg', ingredient: 'Losartan potassium', usage: 'Uống 1 viên buổi sáng', unit: 'Viên', price: 6000, inStock: 150, specialty: 'Tim mạch', code: 'T005', registrationNo: 'VD-22346-19', concentration: '50mg', route: 'Đường uống', expiryDate: new Date('2027-05-18') },
    { name: 'Atorvastatin 20mg', ingredient: 'Atorvastatin', usage: 'Uống 1 viên buổi tối trước đi ngủ', unit: 'Viên', price: 8000, inStock: 180, specialty: 'Tim mạch', code: 'T006', registrationNo: 'VD-22347-20', concentration: '20mg', route: 'Đường uống', expiryDate: new Date('2028-02-28') },

    // Nhi khoa
    { name: 'Hapacol 150mg (sủi)', ingredient: 'Paracetamol', usage: 'Hòa tan 1 gói với nước ấm, uống khi bé sốt', unit: 'Gói', price: 2000, inStock: 200, specialty: 'Nhi khoa', code: 'T007', registrationNo: 'VD-32345-21', concentration: '150mg', route: 'Đường uống', expiryDate: new Date('2028-11-12') },
    { name: 'Siro Zinc Baby 100ml', ingredient: 'Kẽm gluconat', usage: 'Uống 5ml mỗi ngày sau ăn', unit: 'Chai', price: 85000, inStock: 50, specialty: 'Nhi khoa', code: 'T008', registrationNo: 'VD-32346-22', concentration: '100ml', route: 'Đường uống', expiryDate: new Date('2027-08-08') },

    // Da liễu
    { name: 'Thuốc mỡ Fucidin H 15g', ingredient: 'Fusidic acid, Hydrocortisone', usage: 'Thoa lớp mỏng lên vùng da tổn thương ngày 2 lần', unit: 'Tuýp', price: 95000, inStock: 40, specialty: 'Da liễu', code: 'T009', registrationNo: 'VN-42345-20', concentration: '15g', route: 'Bôi ngoài da', expiryDate: new Date('2027-03-15') }
  ];

  const createdDrugs = [];
  for (const d of drugsData) {
    const drug = await prisma.drug.create({ data: d });
    createdDrugs.push(drug);
  }

  console.log('👥 Đang tạo hồ sơ quản lý bệnh nhân (Hồ sơ đầy đủ thông tin: CCCD, Dị ứng, Nhóm máu, Người liên hệ)...');

  // Bệnh nhân 1: Nguyễn Văn Minh
  const uP1 = await prisma.user.create({
    data: {
      username: 'patient1',
      password,
      name: 'Nguyễn Văn Minh',
      role: 'PATIENT',
      email: 'vanminh.nguyen@gmail.com'
    }
  });

  const p1 = await prisma.patient.create({
    data: {
      userId: uP1.id,
      fullName: 'Nguyễn Văn Minh',
      dob: new Date('1988-03-12'),
      gender: 'Nam',
      idCard: '079088012345',
      healthInsurance: 'DN4012345678901',
      phone: '0903123456',
      address: '45 Nguyễn Huệ, Quận 1, TP. HCM',
      email: 'vanminh.nguyen@gmail.com',
      bloodType: 'O+',
      history: 'Dị ứng thuốc nhóm Penicillin. Có tiền sử hen phế quản nhẹ từ nhỏ.',
      emergencyContact: 'Trần Thị Thảo (Vợ) - 0908123456'
    }
  });

  // Bệnh nhân 2: Trần Thị Thanh Vân
  const uP2 = await prisma.user.create({
    data: {
      username: 'patient2',
      password,
      name: 'Trần Thị Thanh Vân',
      role: 'PATIENT',
      email: 'thanhvan.tran@gmail.com'
    }
  });

  const p2 = await prisma.patient.create({
    data: {
      userId: uP2.id,
      fullName: 'Trần Thị Thanh Vân',
      dob: new Date('1995-07-24'),
      gender: 'Nữ',
      idCard: '079095012345',
      healthInsurance: 'HS4023456789012',
      phone: '0918234567',
      address: '789 Điện Biên Phủ, Quận Bình Thạnh, TP. HCM',
      email: 'thanhvan.tran@gmail.com',
      bloodType: 'AB+',
      history: 'Không phát hiện dị ứng thức ăn hay thuốc. Có tiền sử viêm loét dạ dày.',
      emergencyContact: 'Nguyễn Văn Hùng (Chồng) - 0919345678'
    }
  });

  // Bệnh nhân 3: Lê Hoàng Hải
  const uP3 = await prisma.user.create({
    data: {
      username: 'patient3',
      password,
      name: 'Lê Hoàng Hải',
      role: 'PATIENT',
      email: 'hoanghai.le@gmail.com'
    }
  });

  const p3 = await prisma.patient.create({
    data: {
      userId: uP3.id,
      fullName: 'Lê Hoàng Hải',
      dob: new Date('2000-11-05'),
      gender: 'Nam',
      idCard: '048000012345',
      healthInsurance: 'GD4034567890123',
      phone: '0989345678',
      address: '12 Lê Lợi, Quận Hải Châu, Đà Nẵng',
      email: 'hoanghai.le@gmail.com',
      bloodType: 'B+',
      history: 'Dị ứng phấn hoa và bụi nhà. Không dị ứng thuốc.',
      emergencyContact: 'Lê Hoàng Lâm (Bố) - 0989000111'
    }
  });

  console.log('🩺 Đang tạo các bệnh án mẫu (Lịch sử khám chữa bệnh, chẩn đoán ICD-10, chữ ký số)...');

  // Bệnh án 1: Bệnh nhân Nguyễn Văn Minh khám Nội tổng quát
  const record1 = await prisma.medicalRecord.create({
    data: {
      patientId: p1.id,
      doctorId: drA.id,
      symptoms: 'Ho khan kéo dài, sốt nhẹ vào chiều tối, tức ngực nhẹ khi ho nhiều.',
      diagnosis: 'Viêm phế quản cấp tính, nghi do thay đổi thời tiết',
      icd10Code: 'J20.9',
      prescription: 'Kê đơn kháng sinh Amoxicillin phối hợp Paracetamol giảm đau hạ sốt.',
      notes: 'Bệnh nhân có tiền sử Hen phế quản nhưng hiện tại phổi nghe không có rít. Nhắc nhở kiêng nước đá, nghỉ ngơi.',
      bloodPressure: '120/80 mmHg',
      heartRate: 78,
      temperature: 37.8,
      weight: 68.5,
      prescriptionStatus: 'APPROVED',
      doctorSignature: mockSignature,
      createdAt: new Date('2026-05-10T09:00:00Z')
    }
  });

  // Chi tiết đơn thuốc cho bệnh án 1
  const amox = createdDrugs.find(d => d.name === 'Amoxicillin 500mg');
  const para = createdDrugs.find(d => d.name === 'Paracetamol 500mg');

  await prisma.prescriptionItem.create({
    data: {
      recordId: record1.id,
      drugId: amox.id,
      quantity: 14,
      instructions: 'Uống sáng 1 viên, tối 1 viên sau khi ăn',
      price: amox.price
    }
  });

  await prisma.prescriptionItem.create({
    data: {
      recordId: record1.id,
      drugId: para.id,
      quantity: 10,
      instructions: 'Uống 1 viên khi sốt trên 38.5 độ, cách ít nhất 4 giờ',
      price: para.price
    }
  });

  // Hóa đơn bệnh án 1
  await prisma.invoice.create({
    data: {
      patientId: p1.id,
      recordId: record1.id,
      totalAmount: (amox.price * 14) + (para.price * 10) + drA.consultationFee,
      status: 'PAID',
      paymentDate: new Date('2026-05-10T10:00:00Z'),
      createdAt: new Date('2026-05-10T09:00:00Z')
    }
  });

  // Cận lâm sàng bệnh án 1: Chụp X-quang phổi
  await prisma.labTest.create({
    data: {
      patientId: p1.id,
      doctorId: drA.id,
      recordId: record1.id,
      testName: 'Chụp X-quang phổi thẳng',
      result: 'Hình ảnh rốn phổi đậm nhẹ hai bên. Không thấy tổn thương nhu mô phổi tiến triển.',
      notes: 'Phù hợp với viêm phế quản cấp, chưa có tổn thương nhu mô phổi đông đặc.',
      status: 'COMPLETED',
      fileUrl: mockXraySvg,
      createdAt: new Date('2026-05-10T09:15:00Z')
    }
  });


  // Bệnh án 2: Bệnh nhân Trần Thị Thanh Vân khám Da liễu
  const record2 = await prisma.medicalRecord.create({
    data: {
      patientId: p2.id,
      doctorId: drD.id,
      symptoms: 'Da vùng cánh tay xuất hiện các dát đỏ, ngứa ngáy nhiều về đêm, có bong vảy nhẹ.',
      diagnosis: 'Viêm da tiếp xúc dị ứng',
      icd10Code: 'L23.9',
      prescription: 'Thoa kem mỡ kháng viêm ngoài da và dùng thuốc dị ứng đường uống.',
      notes: 'Bệnh nhân hạn chế tiếp xúc hóa chất tẩy rửa mạnh. Thoa mỏng thuốc bôi tránh lạm dụng.',
      bloodPressure: '110/70 mmHg',
      heartRate: 72,
      temperature: 36.6,
      weight: 52.0,
      prescriptionStatus: 'APPROVED',
      doctorSignature: mockSignature,
      createdAt: new Date('2026-05-15T14:30:00Z')
    }
  });

  const fucidin = createdDrugs.find(d => d.name === 'Thuốc mỡ Fucidin H 15g');
  await prisma.prescriptionItem.create({
    data: {
      recordId: record2.id,
      drugId: fucidin.id,
      quantity: 1,
      instructions: 'Thoa một lớp mỏng lên vùng da bệnh 2 lần/ngày (sáng, tối)',
      price: fucidin.price
    }
  });

  await prisma.invoice.create({
    data: {
      patientId: p2.id,
      recordId: record2.id,
      totalAmount: fucidin.price + drD.consultationFee,
      status: 'PAID',
      paymentDate: new Date('2026-05-15T15:00:00Z'),
      createdAt: new Date('2026-05-15T14:30:00Z')
    }
  });


  // Bệnh án 3: Bệnh nhân Lê Hoàng Hải khám Tim mạch (Có bệnh án cũ để đối chiếu)
  const record3_old = await prisma.medicalRecord.create({
    data: {
      patientId: p3.id,
      doctorId: drA.id,
      symptoms: 'Hơi nhói ngực trái khi vận động mạnh, hồi hộp trống ngực.',
      diagnosis: 'Tăng huyết áp vô căn độ I',
      icd10Code: 'I10',
      prescription: 'Kê đơn thuốc hạ áp uống hàng ngày.',
      notes: 'Theo dõi huyết áp tại nhà 2 lần/ngày.',
      bloodPressure: '140/90 mmHg',
      heartRate: 85,
      temperature: 36.8,
      weight: 75.0,
      prescriptionStatus: 'APPROVED',
      doctorSignature: mockSignature,
      createdAt: new Date('2026-04-01T08:30:00Z')
    }
  });

  // Bệnh án tái khám (Hiện tại)
  const record3_new = await prisma.medicalRecord.create({
    data: {
      patientId: p3.id,
      doctorId: drA.id,
      symptoms: 'Khám định kỳ, huyết áp ổn định hơn, đỡ nhói ngực.',
      diagnosis: 'Tăng huyết áp vô căn ổn định',
      icd10Code: 'I10',
      prescription: 'Duy trì thuốc hạ huyết áp buổi sáng.',
      notes: 'Huyết áp đã cải thiện rõ rệt so với tháng trước (140/90 -> 125/80). Tiếp tục hạn chế ăn mặn, tập thể dục nhẹ nhàng.',
      bloodPressure: '125/80 mmHg',
      heartRate: 74,
      temperature: 36.5,
      weight: 74.2,
      prescriptionStatus: 'APPROVED',
      doctorSignature: mockSignature,
      createdAt: new Date('2026-05-20T08:30:00Z')
    }
  });

  const losartan = createdDrugs.find(d => d.name === 'Losartan 50mg');
  await prisma.prescriptionItem.create({
    data: {
      recordId: record3_new.id,
      drugId: losartan.id,
      quantity: 30,
      instructions: 'Uống 1 viên vào lúc 8h sáng hàng ngày sau ăn',
      price: losartan.price
    }
  });

  await prisma.invoice.create({
    data: {
      patientId: p3.id,
      recordId: record3_new.id,
      totalAmount: (losartan.price * 30) + drA.consultationFee,
      status: 'PAID',
      paymentDate: new Date('2026-05-20T09:10:00Z'),
      createdAt: new Date('2026-05-20T08:30:00Z')
    }
  });

  // Cận lâm sàng so sánh (Xét nghiệm máu - Sinh hóa) cho Hải
  await prisma.labTest.create({
    data: {
      patientId: p3.id,
      doctorId: drA.id,
      recordId: record3_old.id,
      testName: 'Đo Cholesterol toàn phần',
      result: '5.8 mmol/L (Ngưỡng cao)',
      notes: 'Cần kết hợp chế độ ăn giảm mỡ động vật.',
      status: 'COMPLETED',
      createdAt: new Date('2026-04-01T08:45:00Z')
    }
  });

  await prisma.labTest.create({
    data: {
      patientId: p3.id,
      doctorId: drA.id,
      recordId: record3_new.id,
      testName: 'Đo Cholesterol toàn phần',
      result: '5.1 mmol/L (Bình thường)',
      notes: 'Đã có tiến triển tốt nhờ kiểm soát chế độ ăn uống.',
      status: 'COMPLETED',
      createdAt: new Date('2026-05-20T08:45:00Z')
    }
  });

  // 3. Tạo các Lịch hẹn khám (Appointments) mẫu để tiếp đón
  await prisma.appointment.create({
    data: {
      patientId: p1.id,
      doctorId: drA.id,
      date: new Date('2026-05-22T08:00:00Z'),
      status: 'CONFIRMED',
      reason: 'Tái khám viêm phế quản',
      type: 'OFFLINE',
      timeSlot: '08:00 - 08:30',
      queueNumber: 1,
      roomNumber: 'Phòng 101 - Nội tổng quát'
    }
  });

  await prisma.appointment.create({
    data: {
      patientId: p2.id,
      doctorId: drD.id,
      date: new Date('2026-05-22T09:30:00Z'),
      status: 'CONFIRMED',
      reason: 'Khám mẩn ngứa da tay',
      type: 'OFFLINE',
      timeSlot: '09:30 - 10:00',
      queueNumber: 2,
      roomNumber: 'Phòng 104 - Da liễu'
    }
  });

  console.log('Hệ thống dữ liệu bệnh án điện tử (EMR) mẫu đã được nạp thành công!');
}

main()
  .catch(e => {
    console.error(' Lỗi khởi tạo EMR mẫu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
