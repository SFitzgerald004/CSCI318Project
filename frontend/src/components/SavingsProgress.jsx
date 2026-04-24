export default function SavingsProgress({ savings, totalBudget }) {
  const pct = Math.min(100, Math.round((savings.amount_saved / totalBudget) * 100))

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: 'per month', value: savings.monthly_savings_needed },
          { label: 'bi-weekly', value: savings.biweekly_savings_needed },
          { label: 'per week', value: savings.weekly_savings_needed },
        ].map((s) => (
          <div key={s.label} className="text-center bg-[#f5f5f7] rounded-lg p-3">
            <p className="text-xl font-semibold text-[#1d1d1f]">${s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>${savings.amount_saved} saved</span>
          <span>${totalBudget} goal</span>
        </div>
        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="bg-[#0071e3] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
