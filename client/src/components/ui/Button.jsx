import { createElement } from 'react'
import clsx from 'clsx'

const VARIANT_CLASS = {
  primary:
    'bg-gradient-to-r from-primary-900 to-primary-700 text-white shadow-sm hover:-translate-y-px hover:shadow-md',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

const SIZE_CLASS = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
}

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) {
  return createElement(
    Component,
    {
      className: clsx(
        'inline-flex items-center justify-center gap-2 rounded-button font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:pointer-events-none disabled:opacity-60',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      ),
      ...props,
    },
    children,
  )
}
