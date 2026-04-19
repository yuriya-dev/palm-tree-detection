import clsx from 'clsx'

export default function Input({ label, id, className, ...props }) {
  return (
    <label className="block space-y-2">
      {label && <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>}
      <input
        id={id}
        className={clsx(
          'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
          className,
        )}
        {...props}
      />
    </label>
  )
}
