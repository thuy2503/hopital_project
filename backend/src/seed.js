import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Dr. Admin',
      role: 'ADMIN',
    },
  });

  const patient1 = await prisma.patient.create({
    data: {
      fullName: 'Bùi Thị B',
      dob: new Date('1990-05-15'),
      gender: 'Nữ',
      phone: '0987654321',
      address: 'Hà Nội',
    }
  });

  const patient2 = await prisma.patient.create({
    data: {
      fullName: 'Trần Văn C',
      dob: new Date('1985-10-20'),
      gender: 'Nam',
      phone: '0912345678',
      address: 'Hồ Chí Minh',
    }
  });

  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: user.id,
      date: new Date(Date.now() + 86400000), // tomorrow
      reason: 'Khám tổng quát',
    }
  });

  console.log('Seeded database successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
