const mockRooms = [
  { number: '100', floor: 1, status: 'available', hasLoveChair: true },
  { number: '101', floor: 1, status: 'occupied', hasLoveChair: false },
  { number: '102', floor: 1, status: 'dirty', hasLoveChair: false },
  { number: '103', floor: 1, status: 'maintenance', hasLoveChair: false }
];

const statusStyles: Record<string, string> = {
  available: 'border-emerald-600 bg-emerald-500/15 text-emerald-600',
  occupied: 'border-rose-600 bg-rose-500/15 text-rose-600',
  dirty: 'border-amber-500 bg-amber-500/15 text-amber-600',
  maintenance: 'border-orange-500 bg-orange-500/15 text-orange-600'
};

export default function RoomsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sơ đồ phòng</h1>
        <p className="text-sm text-muted-foreground">
          Module này sẽ được render bằng server components và dữ liệu thực tế trong các bước tiếp theo.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockRooms.map((room) => (
          <article
            key={room.number}
            className={`rounded-xl border-2 p-4 transition hover:shadow-md ${statusStyles[room.status]}`}
          >
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider">Phòng</p>
                <h2 className="text-xl font-bold">{room.number}</h2>
              </div>
              {room.hasLoveChair ? <span className="text-xs font-semibold">Ghế tình yêu</span> : null}
            </header>
            <dl className="mt-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tầng</dt>
                <dd className="font-medium">{room.floor}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Trạng thái</dt>
                <dd className="font-semibold uppercase">{room.status}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
