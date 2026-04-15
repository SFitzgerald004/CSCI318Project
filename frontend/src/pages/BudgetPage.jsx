import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getTrip } from '../services/tripService'
import { getAllocation, createAllocation, getSavings, createSavings } from '../services/budgetService'
import BudgetChart from '../components/BudgetChart'
import SavingsProgress from '../components/SavingsProgress'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const ICONS = { flights: '✈️', hotel: '🏨', food: '🍽️', activities: '🎯', transport: '🚗', misc: '📦' }
const KEYS = ['flights', 'hotel', 'food', 'activities', 'transport', 'misc']

export default function BudgetPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [allocation, setAllocation] = useState(null)
  const [savings, setSavings] = useState(null)
  const [amountSaved, setAmountSaved] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    Promise.all([
      getTrip(id),
      getAllocation(id).catch(() => null),
      getSavings(id).catch(() => null),
    ])
      .then(([t, a, s]) => { setTrip(t); setAllocation(a); setSavings(s) })
      .catch(() => toast.error('Failed to load budget data'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const a = await createAllocation(id)
      setAllocation(a)
      toast.success('Budget generated!')
    } catch {
      toast.error('Failed to generate budget')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSavings(e) {
    e.preventDefault()
    try {
      const s = await createSavings(id, Number(amountSaved))
      setSavings(s)
      toast.success('Savings plan updated!')
    } catch {
      toast.error('Failed to update savings plan')
    }
  }

  if (loading) return <LoadingSpinner />
  if (!trip) return <p className="text-gray-500">Trip not found.</p>

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1f]">Budget Breakdown</h1>
      <p className="text-sm text-gray-500 mt-1">${trip.total_budget.toLocaleString()} total · {trip.trip_purpose}</p>

      {!allocation ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📊</p>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">No budget yet</h2>
          <p className="text-sm text-gray-500 mt-1">Generate a smart budget allocation based on your trip details</p>
          <button onClick={handleGenerate} disabled={generating}
            className="mt-4 bg-[#0071e3] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50">
            {generating ? 'Generating...' : 'Generate Budget'}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            {/* Pie Chart */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">Allocation</h2>
              <BudgetChart allocation={allocation} />
            </div>

            {/* Amounts List */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#1d1d1f]">Amounts</h2>
                <button onClick={handleGenerate} disabled={generating}
                  className="text-xs text-[#0071e3] hover:underline disabled:opacity-50">
                  {generating ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>
              <div className="space-y-3">
                {KEYS.map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{ICONS[key]} {key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <span className="text-sm font-semibold text-[#1d1d1f]">${allocation[`${key}_budget`]}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#1d1d1f]">Total</span>
                  <span className="text-base font-semibold text-[#0071e3]">${trip.total_budget.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Plan */}
          <div className="bg-white rounded-xl p-5 shadow-sm mt-4">
            <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4">Savings Plan</h2>
            {savings ? (
              <SavingsProgress savings={savings} totalBudget={trip.total_budget} />
            ) : (
              <p className="text-sm text-gray-500 mb-3">Track how much you've saved toward this trip.</p>
            )}
            <form onSubmit={handleSavings} className="mt-4 flex gap-3">
              <input type="number" min="0" placeholder="Amount saved so far" value={amountSaved}
                onChange={(e) => setAmountSaved(e.target.value)} required
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" />
              <button type="submit" className="bg-[#1d1d1f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors">
                {savings ? 'Update' : 'Create'} Plan
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
