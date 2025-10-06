# Motel Management (Next.js)

Tái kiến trúc hệ thống quản lý nhà nghỉ dựa trên **Next.js 14**, **TailwindCSS** và **shadcn/ui**. Dự án mới
được xây dựng song song với mã nguồn cũ để từng bước di trú chức năng.

## Mục tiêu giai đoạn này

- Thiết lập bộ khung Next.js 14 (App Router, TypeScript, TailwindCSS).
- Khởi tạo thư viện UI dùng chung (`shadcn` style) và layout dashboard cơ bản.
- Thiết kế lại cấu trúc cơ sở dữ liệu với Prisma để hỗ trợ mở rộng nghiệp vụ: phòng, khách hàng, ca làm việc,
  kho vật tư và bảo trì.

## Cấu trúc thư mục chính

```
next-app/
├── app/                 # Next.js App Router routes (SSR + RSC)
├── components/          # Thành phần UI dùng chung
├── lib/                 # Helpers (Prisma client, utils)
├── prisma/schema.prisma # Mô tả cơ sở dữ liệu mới
└── docs/                # Tài liệu kiến trúc & nghiệp vụ
```

## Thiết lập môi trường

1. Sao chép file `.env.example` thành `.env` và cập nhật biến `DATABASE_URL` tới MySQL mới.
2. Cài đặt dependencies (ở môi trường có quyền truy cập internet):

   ```bash
   pnpm install # hoặc npm install / yarn install
   pnpm prisma migrate dev
   pnpm dev
   ```

3. Kiểm tra các route mẫu:
   - `/` – Trang giới thiệu roadmap.
   - `/rooms` – Bản đồ phòng mẫu (mock data, sẽ kết nối thật trong bước kế tiếp).
   - `/docs/architecture` – Tài liệu kiến trúc & tiến độ.

## Ghi chú quan trọng

- Schema mới đã xử lý các vấn đề theo dõi ca làm việc (shift) bằng các bảng `Shift`, `ShiftTransaction`,
  `ShiftActivityLog` với quan hệ bàn giao `previousShift`/`nextShift`.
- Toàn bộ logic API sẽ được triển khai thông qua server actions và route handlers trong các pull request tiếp
  theo.
- Dự án cũ (`Frontend`/`backend`) vẫn giữ nguyên để đối chiếu nghiệp vụ trong giai đoạn chuyển đổi.
