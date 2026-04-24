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
const COLORS = ['#800020', '#4ECDC4', '#2D3561', '#A18CD1', '#F093FB', '#96FBC4']

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
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2D3561' }}>Budget Breakdown</h1>
        <p className="text-gray-500 mt-1 text-sm">${trip.total_budget.toLocaleString()} total · {trip.trip_purpose}</p>
      </div>

      {!allocation ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-2">No budget generated yet</p>
          <p className="text-gray-400 text-sm mb-6">Generate a smart allocation based on your trip details</p>
          <button onClick={handleGenerate} disabled={generating}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#800020' }}>
            {generating ? 'Generating...' : 'Generate Budget'}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold mb-4" style={{ color: '#2D3561' }}>Allocation Chart</h2>
              <BudgetChart allocation={allocation} />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold" style={{ color: '#2D3561' }}>Category Amounts</h2>
                <button onClick={handleGenerate} disabled={generating}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 disabled:opacity-50">
                  {generating ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>
              <div className="space-y-3">
                {KEYS.map((key, i) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ICONS[key]}</span>
                      <span className="text-sm font-semibold capitalize" style={{ color: '#2D3561' }}>{key}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: COLORS[i] }}>${allocation[`${key}_budget`]}</p>
                      <p className="text-xs text-gray-400">{allocation[`${key}_pct`]}%</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100">
                  <span className="font-bold" style={{ color: '#2D3561' }}>Total</span>
                  <span className="font-bold text-lg" style={{ color: '#800020' }}>${trip.total_budget.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold mb-4" style={{ color: '#2D3561' }}>Savings Plan</h2>
            {savings
              ? <SavingsProgress savings={savings} totalBudget={trip.total_budget} />
              : <p className="text-sm text-gray-500 mb-3">Track how much you have saved toward this trip.</p>
            }
            <form onSubmit={handleSavings} className="mt-4 flex gap-3">
              <input type="number" min="0" placeholder="Amount saved so far ($)" value={amountSaved}
                onChange={(e) => setAmountSaved(e.target.value)}
                className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4ECDC4]" />
              <button type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#2D3561' }}>
                {savings ? 'Update' : 'Create'} Plan
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
