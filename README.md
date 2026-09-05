# 🏥 MedPro Saigon - Electronic Medical Record (EMR) System

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

MedPro Saigon** là hệ thống quản lý bệnh án điện tử (EMR) hiện đại, được thiết kế chuyên biệt cho các phòng khám đa khoa. Hệ thống giúp tối ưu hóa quy trình khám chữa bệnh, quản lý kho dược phẩm, báo cáo doanh thu và tăng cường tương tác với bệnh nhân qua nền tảng số.

---

 Tính năng nổi bật

 Phân hệ Bác sĩ (Doctor Suite)
*   Quản lý Bệnh án (EMR): Lập hồ sơ khám và tạo bệnh án, chẩn đoán, kê đơn thuốc và hướng dẫn điều trị trực tuyến.
*   Cài đặt Cá nhân: Tự cấu hình lịch làm việc, giới hạn số lượng bệnh nhân và thời gian khám.
*   Quản lý Lịch hẹn: Chấp nhận/Hủy phiếu hẹn và theo dõi danh sách bệnh nhân chờ khám theo thời gian thực.
*   Blog Sức khỏe: Viết và chia sẻ các bài viết kiến thức y khoa, tư vấn sức khỏe cho cộng đồng.

Quản lý Kho & Dịch vụ (Inventory & Services)
*   Kho Dược phẩm: Theo dõi tồn kho, đơn vị, giá nhập/xuất. Tự động trừ kho khi bác sĩ kê đơn.
*   Danh mục Dịch vụ: Quản lý các gói xét nghiệm, siêu âm, X-quang với giá niêm yết rõ ràng.

Báo cáo & Thống kê (Reports & Analytics)
*   Doanh thu & Tài chính: Biểu đồ tăng trưởng doanh thu theo tháng/năm, thống kê số tiền thu từ thuốc và dịch vụ.
*   Báo cáo Dược phẩm: Thống kê các loại thuốc tiêu thụ nhiều nhất để lên kế hoạch nhập hàng.
*   Thống kê Bệnh nhân: Theo dõi mật độ bệnh nhân theo từng chuyên khoa và mốc thời gian.
  
Phân hệ Bệnh nhân (Patient Portal)
*   Đặt lịch trực tuyến: Chọn bác sĩ, chuyên khoa và thời gian khám thuận tiện.
*   Tra cứu Thông tin: Tìm kiếm thuốc, dịch vụ và thông tin bác sĩ dễ dàng.
*   Đánh giá & Phản hồi: Gửi đánh giá 5 sao và ý kiến đóng góp cho bác sĩ/phòng khám.
*   Gói chăm sóc thường niên: Đăng ký các gói kiểm tra sức khỏe định kỳ (Annual Health Care).

---
 Bảo mật & Công nghệ

*   Xác thực: JWT (JSON Web Token) với cơ chế phân quyền RBAC (Admin, Doctor, Staff, Patient).
*   Social Login: Tích hợp đăng nhập nhanh qua Google, Facebook, Twitter (Simulated).
*   Lớp phòng thủ Backend: Sử dụng `helmet` (Security Headers) và `express-rate-limit` để chống Brute-force/DoS.
*   Đa ngôn ngữ: Hỗ trợ hoàn toàn Tiếng Việt và Tiếng Anh (i18next).

---

 Hướng dẫn Cài đặt & Khởi chạy

1. Yêu cầu hệ thống
-   Node.js (v16.0.0 trở lên)
-   npm hoặc yarn
-   Trình duyệt hiện đại (Chrome, Edge, Safari...)

 2. Cài đặt Backend
```bash
cd backend
npm install
cp .env.example .env # Cấu hình DATABASE_URL và JWT_SECRET
npx prisma generate
npx prisma db push # Hoặc npx prisma migrate dev
npm run dev
```

3. Cài đặt Frontend
```bash
cd frontend
npm install
npm run dev
```

---

 Triển khai (Deployment)
Hệ thống sẵn sàng để triển khai trên các nền tảng Cloud:
*   **Backend:** [Render.com](https://render.com/) (Hỗ trợ file `render.yaml` có sẵn).
*   **Frontend:** [Vercel.com](https://vercel.com/) (Phát triển với Vite).
*   **Database:** PostgreSQL (Neon.tech) hoặc SQLite (Local).

---

Giấy phép
Dự án được phát hành với mục đích học tập và tham khảo. Mọi đóng góp xin vui lòng tạo Pull Request hoặc Issue trên GitHub.

**MedPro Saigon - Vì sức khỏe cộng đồng.**
