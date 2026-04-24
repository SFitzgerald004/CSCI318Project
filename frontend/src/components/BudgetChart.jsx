import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#0071e3', '#34c759', '#ff9f0a', '#ff375f', '#af52de', '#8e8e93']
const LABELS = ['Flights', 'Hotel', 'Food', 'Activities', 'Transport', 'Misc']
const KEYS = ['flights', 'hotel', 'food', 'activities', 'transport', 'misc']

export default function BudgetChart({ allocation }) {
  const data = KEYS.map((key, i) => ({
    name: LABELS[i],
    value: allocation[`${key}_pct`],
    amount: allocation[`${key}_budget`],
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Pie>
          <Tooltip formatter={(value, name, props) => [`$${props.payload.amount} (${value}%)`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i] }} />
            {d.name} {d.value}%
          </div>
        ))}
      </div>
    </div>
  )
}
