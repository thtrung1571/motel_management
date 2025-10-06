import Link from 'next/link';

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/rooms', label: 'Phòng' },
  { href: '/customers', label: 'Khách hàng' },
  { href: '/inventory', label: 'Kho' },
  { href: '/shifts', label: 'Ca làm việc' },
  { href: '/maintenance', label: 'Bảo trì' }
];

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r bg-card/50 p-6 md:flex">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Motel Admin</p>
          <h1 className="text-2xl font-bold">Điều hành</h1>
        </div>
        <nav className="space-y-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Bảng điều khiển</p>
            <h2 className="text-lg font-semibold">Tổng quan</h2>
          </div>
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="/docs/architecture">
            Kiến trúc hệ thống
          </Link>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
