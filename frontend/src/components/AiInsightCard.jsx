const CARD_GRADIENTS = [
  'linear-gradient(135deg, #800020, #FFE66D)',
  'linear-gradient(135deg, #4ECDC4, #44A08D)',
  'linear-gradient(135deg, #A18CD1, #FBC2EB)',
  'linear-gradient(135deg, #F093FB, #F5576C)',
  'linear-gradient(135deg, #96FBC4, #F9F586)',
]

let cardIndex = 0

export default function AiInsightCard({ icon, title, description, onClick, loading }) {
  const gradient = CARD_GRADIENTS[cardIndex++ % CARD_GRADIENTS.length]

  return (
    <button onClick={onClick} disabled={loading}
      className="rounded-2xl p-4 text-left w-full transition-all card-hover disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden relative"
      style={{ background: gradient }}>
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.5)', transform: 'translate(30%,-30%)' }} />
      <div className="text-2xl mb-2">{loading ? '⏳' : icon}</div>
      <h3 className="text-sm font-800 text-white">{title}</h3>
      <p className="text-xs text-white/80 mt-1 font-600">{loading ? 'Thinking...' : description}</p>
    </button>
  )
}
