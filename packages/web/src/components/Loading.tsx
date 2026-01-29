export function Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-background-tertiary border-t-primary animate-spin"></div>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-background-tertiary rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-background-tertiary rounded w-24 mb-2"></div>
          <div className="h-3 bg-background-tertiary rounded w-32"></div>
        </div>
        <div className="text-right">
          <div className="h-4 bg-background-tertiary rounded w-16 mb-2"></div>
          <div className="h-3 bg-background-tertiary rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th className="w-24"></th>
            <th></th>
            <th className="w-32"></th>
            <th className="w-24"></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td>
                <div className="h-4 bg-background-tertiary rounded w-16"></div>
              </td>
              <td>
                <div className="h-4 bg-background-tertiary rounded w-48"></div>
              </td>
              <td>
                <div className="h-4 bg-background-tertiary rounded w-24"></div>
              </td>
              <td>
                <div className="h-4 bg-background-tertiary rounded w-16"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
