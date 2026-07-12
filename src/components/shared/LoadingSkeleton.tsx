export function StationCardSkeleton() {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="skeleton w-full h-40 rounded-xl" />
      <div className="skeleton w-3/4 h-4" />
      <div className="skeleton w-1/2 h-3" />
      <div className="flex gap-2">
        <div className="skeleton w-16 h-6 rounded-full" />
        <div className="skeleton w-16 h-6 rounded-full" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-2">
      <div className="skeleton w-8 h-8 rounded-lg" />
      <div className="skeleton w-16 h-8" />
      <div className="skeleton w-24 h-3" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
