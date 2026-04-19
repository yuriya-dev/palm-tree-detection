import clsx from 'clsx'

const VARIANT_CLASS = {
  neutral: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-cyan-50 text-cyan-700',
}

export default function Badge({ variant = 'neutral', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        VARIANT_CLASS[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
