# Shift Tracking Improvements

This document summarises the issues observed in the legacy implementation and how the new data model
addresses them.

## Legacy pain points

- **Không có chuỗi bàn giao rõ ràng**: mô hình cũ chỉ lưu `isOpen` nên khi 2 nhân viên cùng thao tác dễ bị
  tình trạng mở nhiều ca đồng thời.
- **Thiếu log chi tiết**: việc tính doanh thu theo ca chỉ dựa vào hook check-in/out nên khó truy vết sau khi
  điều chỉnh thủ công.
- **Không chuyển công nợ giữa ca**: các phòng chưa thanh toán khi kết ca không được liên kết tới ca tiếp theo,
  gây lệch số liệu.

## Thiết kế mới

- `Shift` có tự tham chiếu `previousShiftId`/`nextShiftId` đảm bảo chuỗi bàn giao rõ ràng, đồng thời trường
  `status` phân biệt 3 trạng thái `OPEN`, `PENDING_HANDOVER`, `CLOSED` để khóa thao tác song song.
- `ShiftTransaction` chuẩn hóa toàn bộ phát sinh tiền (tiền phòng, đồ uống, hoàn tiền, điều chỉnh). Mỗi lần
  check-in/out sẽ ghi log cụ thể giúp đối chiếu.
- `ShiftActivityLog` lưu lại sự kiện quan trọng (mở ca, chuyển phòng, bổ sung đồ uống, bàn giao) với payload dạng
  JSON để truy vết sau này.
- `Rental` có khóa ngoại `shiftOpenedId` và `shiftClosedId` giúp thống kê phòng còn nợ: khi kết ca, các phòng
  chưa checkout vẫn gắn với shift đang mở, và tự động chuyển sang ca kế tiếp khi nhận bàn giao.
- `InventoryLedgerEntry` đính kèm `shiftId` nên có thể tổng hợp tồn kho theo từng ca.

## Bước tiếp theo

1. Viết service handle mở/kết ca dựa trên schema mới (server actions kết hợp optimistic UI).
2. Thiết lập migration seed tạo ca đầu tiên và logic bàn giao.
3. Kết nối UI dashboard để hiển thị cảnh báo phòng chưa thanh toán trước khi cho phép đóng ca.
