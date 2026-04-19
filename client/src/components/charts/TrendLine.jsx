import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function TrendLine({ data, dataKey = 'detections', xKey = 'week' }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
        <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: '1px solid rgba(15, 23, 42, 0.06)',
            boxShadow: '0 6px 20px rgba(2, 6, 23, 0.08)',
          }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#1a7a4a"
          strokeWidth={3}
          dot={{ r: 4, fill: '#1a7a4a' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
