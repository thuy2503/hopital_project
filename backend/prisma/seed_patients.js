import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const patientsData = [
  {
    fullName: 'Nguyễn Văn Minh',
    dob: new Date('1988-03-12'),
    gender: 'Nam',
    phone: '0903123456',
    address: '45 Nguyễn Huệ, Quận 1, TP. HCM',
    email: 'vanminh.nguyen@gmail.com',
    healthInsurance: 'DN4012345678901',
    bloodType: 'O+',
    idCard: '079088012345'
  },
  {
    fullName: 'Trần Thị Thanh Vân',
    dob: new Date('1995-07-24'),
    gender: 'Nữ',
    phone: '0918234567',
    address: '789 Điện Biên Phủ, Quận Bình Thạnh, TP. HCM',
    email: 'thanhvan.tran@gmail.com',
    healthInsurance: 'HS4023456789012',
    bloodType: 'A+',
    idCard: '079095012345'
  },
  {
    fullName: 'Lê Hoàng Hải',
    dob: new Date('2000-11-05'),
    gender: 'Nam',
    phone: '0989345678',
    address: '12 Lê Lợi, Quận Hải Châu, Đà Nẵng',
    email: 'hoanghai.le@gmail.com',
    healthInsurance: 'GD4034567890123',
    bloodType: 'B+',
    idCard: '048000012345'
  },
  {
    fullName: 'Phạm Thị Tuyết Mai',
    dob: new Date('1975-05-18'),
    gender: 'Nữ',
    phone: '0977456789',
    address: '34 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
    email: 'tuyetmai.pham@gmail.com',
    healthInsurance: '', // Không dùng BHYT
    bloodType: 'AB+',
    idCard: '001075012345'
  },
  {
    fullName: 'Vũ Minh Tuấn',
    dob: new Date('1992-09-30'),
    gender: 'Nam',
    phone: '0933567890',
    address: '56 Nguyễn Văn Cừ, Quận Ninh Kiều, Cần Thơ',
    email: 'minhtuan.vu@gmail.com',
    healthInsurance: 'CN4045678901234',
    bloodType: 'O-',
    idCard: '092092012345'
  },
  {
    fullName: 'Hoàng Kim Chi',
    dob: new Date('1983-02-14'),
    gender: 'Nữ',
    phone: '0944678901',
    address: '88 Lạch Tray, Quận Ngô Quyền, Hải Phòng',
    email: 'kimchi.hoang@gmail.com',
    healthInsurance: 'DN4056789012345',
    bloodType: 'A-',
    idCard: '031083012345'
  },
  {
    fullName: 'Đỗ Anh Đức',
    dob: new Date('1968-12-28'),
    gender: 'Nam',
    phone: '0908789012',
    address: '102 Hùng Vương, TP. Nha Trang, Khánh Hòa',
    email: 'anhduc.do@gmail.com',
    healthInsurance: '', // Không dùng BHYT
    bloodType: 'O+',
    idCard: '056068012345'
  },
  {
    fullName: 'Phan Ngọc Ánh',
    dob: new Date('1999-08-08'),
    gender: 'Nữ',
    phone: '0919890123',
    address: '15 Trần Hưng Đạo, TP. Quy Nhơn, Bình Định',
    email: 'ngocanh.phan@gmail.com',
    healthInsurance: 'HS4067890123456',
    bloodType: 'B-',
    idCard: '052099012345'
  },
  {
    fullName: 'Bùi Quang Huy',
    dob: new Date('1980-04-20'),
    gender: 'Nam',
    phone: '0988901234',
    address: '234 Cách Mạng Tháng 8, Quận 3, TP. HCM',
    email: 'quanghuy.bui@gmail.com',
    healthInsurance: 'GD4078901234567',
    bloodType: 'AB-',
    idCard: '079080012345'
  },
  {
    fullName: 'Nguyễn Thu Trang',
    dob: new Date('1996-10-10'),
    gender: 'Nữ',
    phone: '0966012345',
    address: '67 Trần Phú, Quận Ba Đình, Hà Nội',
    email: 'thutrang.nguyen@gmail.com',
    healthInsurance: '', // Không dùng BHYT
    bloodType: 'O+',
    idCard: '001096012345'
  }
];

async function main() {
  console.log('Đang khởi tạo dữ liệu bệnh nhân...');
  
  for (const patient of patientsData) {
    await prisma.patient.upsert({
      where: { email: patient.email },
      update: {},
      create: patient
    });
  }

  console.log('Đã tạo thành công 10 bệnh nhân mẫu vào cơ sở dữ liệu!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
