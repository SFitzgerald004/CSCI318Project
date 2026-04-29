export default function LoadingSpinner({ inline = false }) {
  return (
    <div
      className={`flex items-center justify-center ${inline ? 'py-12' : 'min-h-screen'}`}
      style={{ background: 'var(--paper)' }}
    >
      <div
        className="animate-spin"
        style={{
          width: 32,
          height: 32,
          border: '2px solid var(--rule)',
          borderTopColor: 'var(--indigo)',
          borderRadius: '50%',
        }}
      />
    </div>
  )
}
