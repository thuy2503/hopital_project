import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  // 1. Tạo Admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password,
      name: 'Hệ thống Quản trị',
      role: 'ADMIN',
      email: 'admin@medpro.com'
    },
  });

  // 2. Tạo Bác sĩ
  const doctor = await prisma.user.upsert({
    where: { username: 'doctor1' },
    update: {},
    create: {
      username: 'doctor1',
      password,
      name: 'BS. Nguyễn Văn A',
      role: 'DOCTOR',
      specialty: 'Nội tổng quát',
      email: 'doctor1@medpro.com'
    },
  });

  // 3. Tạo Bệnh nhân & Profile
  const patientUser = await prisma.user.upsert({
    where: { username: 'patient1' },
    update: {},
    create: {
      username: 'patient1',
      password,
      name: 'Trần Thị B',
      role: 'PATIENT',
      email: 'patient1@gmail.com'
    },
  });

  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      fullName: 'Trần Thị B',
      dob: new Date('1995-05-15'),
      gender: 'Nữ',
      phone: '0901234567',
      address: '123 Đường Lê Lợi, TP.HCM',
      email: 'patient1@gmail.com'
    },
  });

  // 4. Tạo Điều dưỡng (NURSE)
  const nurse = await prisma.user.upsert({
    where: { username: 'nurse1' },
    update: {},
    create: {
      username: 'nurse1',
      password,
      name: 'ĐD. Nguyễn Thị Mai',
      role: 'NURSE',
      email: 'nurse1@medpro.com'
    },
  });

  // 5. Tạo Dược sĩ (PHARMACIST)
  const pharmacist = await prisma.user.upsert({
    where: { username: 'pharmacist1' },
    update: {},
    create: {
      username: 'pharmacist1',
      password,
      name: 'DS. Lê Hoàng Nam',
      role: 'PHARMACIST',
      email: 'pharmacist1@medpro.com'
    },
  });

  // 6. Tạo Kế toán (ACCOUNTANT)
  const accountant = await prisma.user.upsert({
    where: { username: 'accountant1' },
    update: {},
    create: {
      username: 'accountant1',
      password,
      name: 'KT. Trần Minh Tâm',
      role: 'ACCOUNTANT',
      email: 'accountant1@medpro.com'
    },
  });

  console.log(' Đã tạo các tài khoản mặc định:');
  console.log('- Admin: username: admin / pass: 123456');
  console.log('- Doctor: username: doctor1 / pass: 123456');
  console.log('- Patient: username: patient1 / pass: 123456');
  console.log('- Nurse: username: nurse1 / pass: 123456');
  console.log('- Pharmacist: username: pharmacist1 / pass: 123456');
  console.log('- Accountant: username: accountant1 / pass: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
