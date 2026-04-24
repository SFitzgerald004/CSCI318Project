export default function LoadingSpinner({ inline = false }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${inline ? 'py-12' : 'min-h-screen'}`}
      style={{ background: inline ? 'transparent' : 'linear-gradient(135deg, #FFF9F0, #FFF0E8)' }}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-100" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-[#4ECDC4] animate-spin" />
      </div>
      <p className="text-sm font-700 text-gray-400">Loading your trip...</p>
    </div>
  )
}
