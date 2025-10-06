import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'Quản lý phòng theo thời gian thực',
    description:
      'Theo dõi trạng thái phòng, lượt thuê và tình trạng vệ sinh với giao diện SSR siêu nhanh.'
  },
  {
    title: 'Hồ sơ khách hàng chi tiết',
    description:
      'Lưu trữ giấy tờ tuỳ thân, sở thích, lịch sử ở và mối quan hệ của khách chỉ trong vài thao tác.'
  },
  {
    title: 'Theo dõi ca làm việc chính xác',
    description:
      'Chốt ca, chuyển ca và tổng hợp doanh thu tự động để không bỏ sót giao dịch nào.'
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-16 px-6 py-24">
      <section className="space-y-6 text-center">
        <span className="rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Motel Management Platform
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Nâng cấp hệ thống quản lý nhà nghỉ với Next.js 14 + shadcn/ui
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Bắt đầu kiến trúc mới dựa trên server components, mở rộng cơ sở dữ liệu và cải thiện luồng ca làm
          việc. Đây là trang giới thiệu giúp bạn định hướng trước khi triển khai các module nghiệp vụ chi
          tiết.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild>
            <Link href="/rooms">
              Bắt đầu với bảng phòng
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/docs/architecture">Xem tài liệu kiến trúc</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-xl border bg-card p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
