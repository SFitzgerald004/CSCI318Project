import { useEffect, useState } from 'react';

export default function SavingsProgress({ savings, totalBudget, plan }) {
  // Support both prop APIs: legacy (savings + totalBudget) and new (plan)
  const amountSaved = plan ? plan.amount_saved : savings?.amount_saved ?? 0;
  const total = plan ? plan.total_budget : totalBudget ?? 0;

  const targetPct = total > 0
    ? Math.min(100, Math.round((amountSaved / total) * 100))
    : 0;

  const [fillPct, setFillPct] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setFillPct(targetPct), 50);
    return () => clearTimeout(timer);
  }, [targetPct]);

  if (!plan && savings) {
    // Legacy layout — preserves existing tests (no animation delay so tests read synchronous width)
    return (
      <div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'per month', value: savings.monthly_savings_needed },
            { label: 'bi-weekly', value: savings.biweekly_savings_needed },
            { label: 'per week', value: savings.weekly_savings_needed },
          ].map((s) => (
            <div key={s.label} className="text-center bg-surface-light rounded-lg p-3">
              <p className="type-sub-heading text-text-primary">${s.value}</p>
              <p className="type-caption text-text-secondary mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between type-caption text-text-secondary mb-1.5">
            <span>${amountSaved} saved</span>
            <span>${total} goal</span>
          </div>
          <div className="bg-surface-light rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#0071e3] h-full rounded-full transition-[width] duration-[600ms] ease-out"
              style={{ width: `${targetPct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // New compact layout
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="type-caption text-text-secondary">Saved so far</span>
        <span className="type-body-emphasis">
          ${amountSaved.toLocaleString()} / ${total.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 h-2 bg-surface-light rounded-full overflow-hidden">
        <div
          className="h-full bg-apple-blue rounded-full transition-[width] duration-[600ms] ease-out"
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <p className="type-caption text-text-tertiary mt-1">{Math.round(targetPct)}% of goal</p>
    </div>
  );
}
