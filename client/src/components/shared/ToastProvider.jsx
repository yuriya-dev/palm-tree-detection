import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

const listeners = new Set()
let toastId = 0

const ToastContext = createContext(null)

const TOAST_TYPES = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  error: {
    icon: AlertTriangle,
    className: 'border-rose-200 bg-rose-50 text-rose-900',
  },
  info: {
    icon: Info,
    className: 'border-sky-200 bg-sky-50 text-sky-900',
  },
}

const emitToast = (type, message) => {
  const payload = {
    id: ++toastId,
    type,
    message,
  }

  listeners.forEach((listener) => listener(payload))
  return payload.id
}

export const toast = {
  success: (message) => emitToast('success', message),
  error: (message) => emitToast('error', message),
  info: (message) => emitToast('info', message),
}

function ToastItem({ toastItem, onDismiss }) {
  const config = TOAST_TYPES[toastItem.type] || TOAST_TYPES.info
  const Icon = config.icon

  return (
    <div
      className={`pointer-events-auto flex min-w-[280px] items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg transition-all duration-200 ${config.className}`}
      role="status"
      aria-live="polite"
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm font-medium leading-5">{toastItem.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toastItem.id)}
        className="rounded-full p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
        aria-label="Dismiss toast"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handleToast = (nextToast) => {
      setToasts((currentToasts) => [...currentToasts, nextToast])

      window.setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter((item) => item.id !== nextToast.id))
      }, 3200)
    }

    listeners.add(handleToast)
    return () => {
      listeners.delete(handleToast)
    }
  }, [])

  const contextValue = useMemo(() => ({ toast }), [])

  const dismissToast = (id) => {
    setToasts((currentToasts) => currentToasts.filter((item) => item.id !== id))
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
        {toasts.map((toastItem) => (
          <ToastItem key={toastItem.id} toastItem={toastItem} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context) {
    return context.toast
  }

  return toast
}