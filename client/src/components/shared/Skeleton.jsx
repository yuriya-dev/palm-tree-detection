import clsx from 'clsx'

export default function Skeleton({ className }) {
  return <div className={clsx('skeleton-shimmer rounded-md', className)} />
}

export function StatGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32" />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  )
}
