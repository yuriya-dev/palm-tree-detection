import { X } from 'lucide-react'
import Button from './Button'

export default function Modal({ open, isOpen, title, children, onClose }) {
  const visible = open ?? isOpen

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-modal">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl text-slate-900">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
