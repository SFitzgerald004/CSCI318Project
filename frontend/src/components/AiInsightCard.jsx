export default function AiInsightCard({ icon, title, description, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left w-full disabled:opacity-50"
    >
      <div className="text-lg mb-1">{icon}</div>
      <h3 className="text-sm font-semibold text-[#1d1d1f]">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{loading ? 'Thinking...' : description}</p>
    </button>
  )
}
