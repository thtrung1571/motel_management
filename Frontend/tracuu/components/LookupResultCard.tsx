import { LookupResult } from "../lib/search";
import {
  IdentificationIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";
import { CalendarCheck2, MapPin, NotebookPen, Users } from "lucide-react";

const formatDate = (value: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
};

const formatCurrency = (value: number | null) => {
  if (value == null) {
    return "—";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
};

export function LookupResultCard({ result }: { result: LookupResult }) {
  if (!result.record) {
    return (
      <div className="mt-8 w-full max-w-xl rounded-3xl border border-slate-800/60 bg-slate-900/60 p-8 text-center shadow-lg">
        <h2 className="text-lg font-semibold text-slate-100">Không tìm thấy thông tin</h2>
        <p className="mt-2 text-sm text-slate-400">
          Vui lòng kiểm tra lại biển số, tên hoặc CCCD và thử lại.
        </p>
      </div>
    );
  }

  const { record } = result;

  return (
    <div className="mt-8 w-full max-w-xl rounded-3xl border border-slate-700/60 bg-slate-900/80 p-8 text-slate-100 shadow-xl">
      <p className="text-sm uppercase tracking-widest text-primary/80">Thông tin khách hàng</p>
      <h2 className="mt-2 text-3xl font-semibold">{record.fullName || "Không rõ tên"}</h2>
      <dl className="mt-6 space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <IdentificationIcon className="h-5 w-5 text-primary" />
          <div>
            <dt className="font-medium text-slate-300">Biển số</dt>
            <dd className="text-lg font-semibold">{record.carNumber}</dd>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <UserCircleIcon className="h-5 w-5 text-primary" />
          <div>
            <dt className="font-medium text-slate-300">CCCD</dt>
            <dd className="text-lg font-semibold tracking-wider">
              {record.cccd || "—"}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <dt className="font-medium text-slate-300">Số lần ghé</dt>
            <dd className="text-lg font-semibold">{record.visitCount}</dd>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CalendarCheck2 className="h-5 w-5 text-primary" />
          <div>
            <dt className="font-medium text-slate-300">Lần ghé gần nhất</dt>
            <dd className="text-lg font-semibold">
              {formatDate(record.lastVisit)}
            </dd>
          </div>
        </div>
        {record.placeLiving && (
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <dt className="font-medium text-slate-300">Địa chỉ</dt>
              <dd className="text-lg font-semibold">{record.placeLiving}</dd>
            </div>
          </div>
        )}
        {record.note && (
          <div className="flex items-center gap-3">
            <NotebookPen className="h-5 w-5 text-primary" />
            <div>
              <dt className="font-medium text-slate-300">Ghi chú</dt>
              <dd className="text-base text-slate-200">{record.note}</dd>
            </div>
          </div>
        )}
      </dl>

      {record.rentalHistory.length > 0 && (
        <div className="mt-8 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Lịch sử 5 lượt gần nhất
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {record.rentalHistory.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-1 rounded-xl bg-slate-900/60 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-200">
                  <span className="font-semibold">{formatDate(entry.date)}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {entry.roomNumber ? `Phòng ${entry.roomNumber}` : "—"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>Giờ trả: {entry.checkOutTime || "—"}</span>
                  <span>Loại: {entry.rentType || "—"}</span>
                  <span>Thanh toán: {formatCurrency(entry.totalAmount)}</span>
                </div>
                {entry.note && (
                  <p className="text-xs text-slate-400">Ghi chú: {entry.note}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
