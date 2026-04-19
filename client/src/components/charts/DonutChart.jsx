import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const CHART_COLORS = ['#16a34a', '#d97706', '#dc2626', '#0284c7', '#64748b']

export default function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={54}
            outerRadius={78}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid rgba(15, 23, 42, 0.06)',
              boxShadow: '0 6px 20px rgba(2, 6, 23, 0.08)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
        <p className="font-display text-2xl text-slate-900">{total}</p>
      </div>
    </div>
  )
}
