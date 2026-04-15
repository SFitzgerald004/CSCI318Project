export default function LoadingSpinner({ inline = false }) {
  return (
    <div className={`flex items-center justify-center ${inline ? 'py-12' : 'min-h-screen'} bg-[#f5f5f7]`}>
      <div className="w-8 h-8 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
