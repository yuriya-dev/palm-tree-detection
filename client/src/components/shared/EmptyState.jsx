import { createElement } from 'react'
import { Inbox } from 'lucide-react'
import Button from '../ui/Button'

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  const iconNode = createElement(Icon, { size: 20 })

  return (
    <div className="card flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-500">
        {iconNode}
      </div>
      <h3 className="mt-4 font-display text-2xl text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {actionLabel && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
