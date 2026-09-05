import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const specialtyDrugs = [
  // 1. Nội tổng quát
  { name: 'Paracetamol 500mg', ingredient: 'Paracetamol', usage: 'Uống 1 viên khi sốt trên 38.5 độ, cách 4-6 giờ', unit: 'Viên', price: 1500, inStock: 500, specialty: 'Nội tổng quát' },
  { name: 'Amoxicillin 500mg', ingredient: 'Amoxicillin', usage: 'Uống ngày 2 lần, mỗi lần 1 viên sau ăn sáng/tối', unit: 'Viên', price: 3000, inStock: 300, specialty: 'Nội tổng quát' },
  { name: 'Decolgen Forte', ingredient: 'Paracetamol, Phenylephrine, Chlorpheniramine', usage: 'Uống 1 viên/lần, ngày 3 lần sau ăn', unit: 'Viên', price: 2000, inStock: 250, specialty: 'Nội tổng quát' },
  { name: 'Panadol Extra', ingredient: 'Paracetamol, Caffeine', usage: 'Uống 1-2 viên/lần khi đau đầu, không quá 8 viên/ngày', unit: 'Viên', price: 2500, inStock: 400, specialty: 'Nội tổng quát' },

  // 2. Tim mạch
  { name: 'Amlodipine 5mg', ingredient: 'Amlodipine', usage: 'Uống 1 viên vào buổi sáng sau ăn', unit: 'Viên', price: 4500, inStock: 200, specialty: 'Tim mạch' },
  { name: 'Losartan 50mg', ingredient: 'Losartan potassium', usage: 'Uống 1 viên vào buổi sáng', unit: 'Viên', price: 6000, inStock: 150, specialty: 'Tim mạch' },
  { name: 'Atorvastatin 20mg', ingredient: 'Atorvastatin', usage: 'Uống 1 viên vào buổi tối trước khi đi ngủ', unit: 'Viên', price: 8000, inStock: 180, specialty: 'Tim mạch' },
  { name: 'Nitroglycerin 2.5mg', ingredient: 'Nitroglycerin', usage: 'Uống 1 viên/lần khi đau thắt ngực cấp', unit: 'Viên', price: 12000, inStock: 80, specialty: 'Tim mạch' },

  // 3. Tai Mũi Họng
  { name: 'Xịt mũi Otrivin 0.1%', ingredient: 'Xylometazoline hydrochloride', usage: 'Xịt mỗi bên mũi 1 lần, ngày 2-3 lần', unit: 'Chai', price: 55000, inStock: 50, specialty: 'Tai Mũi Họng' },
  { name: 'Alpha Chymotrypsin', ingredient: 'Chymotrypsin', usage: 'Uống 2 viên/lần, ngày 3-4 lần ngậm dưới lưỡi', unit: 'Viên', price: 3500, inStock: 350, specialty: 'Tai Mũi Họng' },
  { name: 'Loratadine 10mg', ingredient: 'Loratadine', usage: 'Uống 1 viên vào buổi tối sau ăn', unit: 'Viên', price: 1500, inStock: 300, specialty: 'Tai Mũi Họng' },

  // 4. Da liễu
  { name: 'Thuốc mỡ bôi Fucidin H 15g', ingredient: 'Fusidic acid, Hydrocortisone acetate', usage: 'Thoa một lớp mỏng lên vùng da tổn thương, ngày 2 lần', unit: 'Tuýp', price: 95000, inStock: 40, specialty: 'Da liễu' },
  { name: 'Sữa rửa mặt Cetaphil 125ml', ingredient: 'Water, Cetyl Alcohol, Propylene Glycol', usage: 'Dùng rửa mặt nhẹ nhàng sáng và tối', unit: 'Chai', price: 280000, inStock: 20, specialty: 'Da liễu' },
  { name: 'Kem bôi Eumovate 5g', ingredient: 'Clobetasone butyrate', usage: 'Thoa vùng da viêm ngứa ngày 1-2 lần', unit: 'Tuýp', price: 48000, inStock: 60, specialty: 'Da liễu' },

  // 5. Răng Hàm Mặt
  { name: 'Nước súc miệng Denticol 250ml', ingredient: 'Chlorhexidine gluconate', usage: 'Súc miệng với 15ml dung dịch trong 30 giây, ngày 2 lần', unit: 'Chai', price: 65000, inStock: 45, specialty: 'Răng Hàm Mặt' },
  { name: 'Ibuprofen 400mg', ingredient: 'Ibuprofen', usage: 'Uống 1 viên sau ăn khi đau nhức răng nhiều', unit: 'Viên', price: 2500, inStock: 250, specialty: 'Răng Hàm Mặt' },
  { name: 'Rodogyl', ingredient: 'Spiramycin, Metronidazole', usage: 'Uống ngày 2 lần, mỗi lần 2 viên sau ăn sáng/tối', unit: 'Viên', price: 4000, inStock: 150, specialty: 'Răng Hàm Mặt' },

  // 6. Nhi khoa
  { name: 'Hapacol 150mg (sủi)', ingredient: 'Paracetamol', usage: 'Hòa tan 1 gói với nước ấm, uống khi bé sốt trên 38.5 độ', unit: 'Gói', price: 2000, inStock: 200, specialty: 'Nhi khoa' },
  { name: 'Oresol Hydrate', ingredient: 'Glucose khan, Natri clorid, Kali clorid', usage: 'Hòa tan 1 gói trong 200ml nước đun sôi để nguội, uống bù nước', unit: 'Gói', price: 3000, inStock: 500, specialty: 'Nhi khoa' },
  { name: 'Siro Kẽm Zinc Baby 100ml', ingredient: 'Kẽm gluconat', usage: 'Uống 5ml mỗi ngày sau ăn sáng', unit: 'Chai', price: 85000, inStock: 35, specialty: 'Nhi khoa' }
];

async function main() {
  console.log(' Đang khởi tạo dữ liệu thuốc theo chuyên khoa...');

  for (const drug of specialtyDrugs) {
    // Upsert by name
    const existing = await prisma.drug.findFirst({
      where: { name: drug.name }
    });

    if (existing) {
      await prisma.drug.update({
        where: { id: existing.id },
        data: drug
      });
    } else {
      await prisma.drug.create({
        data: drug
      });
    }
  }

  console.log(' Đã nạp thành công danh mục thuốc phân theo chuyên khoa!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
