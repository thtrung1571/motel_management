import { SearchExperience } from "../components/SearchExperience";
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-wider text-slate-400 shadow-lg">
          <SparklesIcon className="h-4 w-4 text-primary" />
          <span>Tra cứu khách hàng trong tích tắc</span>
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-slate-100 md:text-5xl">Tra cứu thông tin xe & khách hàng</h1>
        <p className="mt-3 max-w-xl text-base text-slate-400">
          Nhập biển số, tên khách hàng hoặc số CCCD để kiểm tra nhanh dữ liệu đã lưu trong hệ thống.
        </p>
      </div>
      <SearchExperience />
      <p className="mt-12 text-xs text-slate-500">
        * Dành riêng cho môi trường nội bộ. Vui lòng không chia sẻ thông tin ngoài phạm vi cho phép.
      </p>
    </main>
  );
}
