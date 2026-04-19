import clsx from 'clsx'

export default function Card({ className, children }) {
  return <div className={clsx('card p-5', className)}>{children}</div>
}
