import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const services = [
    { name: 'Siêu âm ổ bụng', duration: 15, price: 150000, description: 'Siêu âm kiểm tra các cơ quan trong ổ bụng' },
    { name: 'Chụp X-quang phổi', duration: 10, price: 120000, description: 'Chụp X-quang kiểm tra tình trạng phổi' },
    { name: 'Nội soi dạ dày', duration: 30, price: 500000, description: 'Nội soi chẩn đoán các bệnh lý dạ dày, tá tràng' }
  ];

  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.service.create({ data: s });
      console.log(`Added: ${s.name}`);
    } else {
      await prisma.service.update({ where: { id: existing.id }, data: s });
      console.log(`Updated: ${s.name}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
