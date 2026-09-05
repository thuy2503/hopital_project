import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const doctors = [
    {
      username: 'doctor_san',
      password: await bcrypt.hash('123456', 10),
      email: 'doctor_san@medpro.com',
      role: 'DOCTOR',
      name: 'BS. Lê Thị B',
      specialty: 'Sản phụ khoa',
      schedule: 'Thứ 2, Thứ 4, Thứ 6: 08:00 - 17:00',
      consultationFee: 250000,
      isAcceptingPatients: true
    },
    {
      username: 'doctor_nhi',
      password: await bcrypt.hash('123456', 10),
      email: 'doctor_nhi@medpro.com',
      role: 'DOCTOR',
      name: 'BS. Phạm Văn C',
      specialty: 'Nhi khoa',
      schedule: 'Thứ 3, Thứ 5, Thứ 7: 08:00 - 17:00',
      consultationFee: 200000,
      isAcceptingPatients: true
    },
    {
      username: 'doctor_dalieu',
      password: await bcrypt.hash('123456', 10),
      email: 'doctor_dalieu@medpro.com',
      role: 'DOCTOR',
      name: 'BS.CK1 Hoàng Thị D',
      specialty: 'Da liễu',
      schedule: 'Thứ 2 đến Thứ 6: 13:00 - 20:00',
      consultationFee: 300000,
      isAcceptingPatients: true
    },
    {
      username: 'doctor_ngoai',
      password: await bcrypt.hash('123456', 10),
      email: 'doctor_ngoai@medpro.com',
      role: 'DOCTOR',
      name: 'ThS.BS. Trần Văn E',
      specialty: 'Ngoại khoa',
      schedule: 'Thứ 7, Chủ nhật: 08:00 - 12:00',
      consultationFee: 400000,
      isAcceptingPatients: false
    },
    {
      username: 'doctor_noi',
      password: await bcrypt.hash('123456', 10),
      email: 'doctor_noi@medpro.com',
      role: 'DOCTOR',
      name: 'BS.CK2 Đinh Quang F',
      specialty: 'Nội tổng quát',
      schedule: 'Thứ 2, Thứ 3, Thứ 4: Sáng',
      consultationFee: 200000,
      isAcceptingPatients: true
    }
  ];

  for (const doc of doctors) {
    const existing = await prisma.user.findFirst({ where: { username: doc.username } });
    if (!existing) {
      await prisma.user.create({ data: doc });
      console.log(`Added doctor: ${doc.name}`);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: doc.name,
          specialty: doc.specialty,
          schedule: doc.schedule,
          consultationFee: doc.consultationFee,
          isAcceptingPatients: doc.isAcceptingPatients
        }
      });
      console.log(`Updated doctor: ${doc.name}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
