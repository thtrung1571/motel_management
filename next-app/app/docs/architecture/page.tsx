import Link from 'next/link';

const roadmapSteps = [
  {
    title: 'Thiết lập nền tảng Next.js 14',
    status: 'done',
    description: 'Khởi tạo dự án với TailwindCSS, shadcn/ui cơ bản và cấu hình TypeScript.'
  },
  {
    title: 'Thiết kế schema cơ sở dữ liệu mới',
    status: 'in-progress',
    description: 'Định nghĩa Prisma schema bao quát phòng, khách, ca làm việc, kho và bảo trì.'
  },
  {
    title: 'Triển khai module phòng và check-in',
    status: 'pending',
    description: 'Xây dựng server actions cho phòng, trạng thái và quy trình nhận phòng.'
  }
];

export default function ArchitecturePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 py-12">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Tài liệu kiến trúc</p>
        <h1 className="text-3xl font-semibold">Lộ trình tái kiến trúc hệ thống nhà nghỉ</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Tài liệu này cập nhật tiến trình và quyết định kiến trúc quan trọng khi di chuyển sang nền tảng Next.js.
          Mỗi giai đoạn được đồng bộ với kế hoạch triển khai bạn đã phê duyệt.
        </p>
      </header>

      <section className="grid gap-4">
        {roadmapSteps.map((step) => (
          <article key={step.title} className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{step.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
              <span className="text-xs font-semibold uppercase text-primary">{step.status}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border bg-muted/40 p-6 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">Nguồn lực tham khảo</h2>
        <ul className="list-disc space-y-2 pl-4">
          <li>
            <Link className="text-primary underline" href="https://nextjs.org/docs/app">
              Next.js App Router Documentation
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="https://ui.shadcn.com">
              shadcn/ui Component Library
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="https://www.prisma.io/docs">
              Prisma ORM Guides
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
