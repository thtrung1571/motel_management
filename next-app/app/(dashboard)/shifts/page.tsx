import Link from 'next/link';

export default function ShiftsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ca làm việc</h1>
      <p className="text-sm text-muted-foreground">
        Khu vực này sẽ triển khai luồng mở/kết ca mới với handover rõ ràng và log chi tiết cho từng giao dịch.
      </p>
      <p className="text-sm text-muted-foreground">
        Xem thêm tài liệu: <Link className="text-primary underline" href="/docs/shift-tracking">Shift Tracking Improvements</Link>.
      </p>
    </div>
  );
}
