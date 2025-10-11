import { LookupResult } from "../lib/search";
import { IdentificationIcon, UserCircleIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { CalendarCheck2 } from "lucide-react";

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
      <h2 className="mt-2 text-3xl font-semibold">{record.fullName}</h2>
      <dl className="mt-6 space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <IdentificationIcon className="h-5 w-5 text-primary" />
          <div>
            <dt className="font-medium text-slate-300">Biển số</dt>
            <dd className="text-lg font-semibold">{record.plateNumber}</dd>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <UserCircleIcon className="h-5 w-5 text-primary" />
          <div>
            <dt className="font-medium text-slate-300">CCCD</dt>
            <dd className="text-lg font-semibold tracking-wider">{record.cccd}</dd>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PhoneIcon className="h-5 w-5 text-primary" />
          <div>
            <dt className="font-medium text-slate-300">Liên hệ</dt>
            <dd className="text-lg font-semibold">{record.phone}</dd>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CalendarCheck2 className="h-5 w-5 text-primary" />
          <div>
            <dt className="font-medium text-slate-300">Lần ghé gần nhất</dt>
            <dd className="text-lg font-semibold">{new Date(record.lastVisit).toLocaleDateString("vi-VN")}</dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
