import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function DetectionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="detectionGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a7a4a" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: 'rgba(34, 197, 94, 0.08)' }}
          contentStyle={{
            borderRadius: 10,
            border: '1px solid rgba(15, 23, 42, 0.06)',
            boxShadow: '0 6px 20px rgba(2, 6, 23, 0.08)',
          }}
        />
        <Bar dataKey="trees" fill="url(#detectionGradient)" radius={[8, 8, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}
