# 🚀 Hướng Dẫn Triển Khai "0 VNĐ" - MedPro SG

Tài liệu này hướng dẫn bạn cách đưa website **medpro sg** lên mạng hoàn toàn miễn phí bằng Vercel, Render và Neon.

## 1. Cơ Sở Dữ Liệu (Neon.tech - Miễn phí)
- **Database**: PostgreSQL (Đã cấu hình xong).
- **Trạng thái**: Schema đã được đẩy lên Neon thành công.
- **Tài khoản mặc định**: 
  - Admin: `admin` / `123456`
  - Bác sĩ: `doctor1` / `123456`

---

## 2. Triển Khai Backend (Render.com - Miễn phí)
1. Đăng nhập [Render.com](https://render.com/) bằng GitHub.
2. Chọn **"New +"** -> **"Blueprint"**.
3. Kết nối với repository `hopital_project`.
4. Render sẽ tự động nhận diện file `render.yaml` mình đã tạo.
5. **Cấu hình**: Trong phần Environment Variables trên Render, hãy đảm bảo có:
   - `DATABASE_URL`: (Dùng link Neon bạn đã có).
   - `JWT_SECRET`: (Render sẽ tự tạo hoặc bạn nhập tùy ý).
6. Sau khi chạy xong, bạn sẽ có link: `https://medpro-sg-backend.onrender.com`.

---

## 3. Triển Khai Frontend (Vercel - Miễn phí)
1. Đăng nhập [Vercel.com](https://vercel.com/) bằng GitHub.
2. Chọn **"Add New"** -> **"Project"**.
3. Kết nối với repo `hopital_project`.
4. **Cấu hình cực kỳ quan trọng**:
   - **Root Directory**: Chọn `frontend`.
   - **Framework Preset**: Chọn `Vite`.
   - **Environment Variables**: Thêm một biến:
     - Key: `VITE_API_URL`
     - Value: (Dán link Backend từ Render vào đây, ví dụ: `https://medpro-sg-backend.onrender.com`).
5. Bấm **"Deploy"**.

---

## 4. Kiểm Tra & Sử Dụng
- Truy cập vào link Vercel cấp cho bạn.
- Đăng nhập bằng tài khoản `admin` / `123456` để kiểm tra toàn bộ hệ thống.

> [!TIP]
> Do dùng gói miễn phí của Render, lần truy cập đầu tiên trong ngày có thể mất 30-60 giây để khởi động Server. Sau đó trang web sẽ chạy rất nhanh.
