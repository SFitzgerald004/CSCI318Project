import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/trips')
    } catch (err) {
      setError(err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF0E8 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#2D3561' }}>TripBudget</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-2xl p-7 shadow-md">
          {error && (
            <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-lg px-3 py-2 text-center">{error}</p>
          )}
          <form onSubmit={handleSubmit}>
            <label className="block mb-4">
              <span className="text-sm font-semibold text-gray-600">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1.5 w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4ECDC4]"
                placeholder="you@example.com" />
            </label>
            <label className="block mb-6">
              <span className="text-sm font-semibold text-gray-600">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="mt-1.5 w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4ECDC4]"
                placeholder="••••••••" />
            </label>
            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#800020' }}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-gray-500 text-sm mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold" style={{ color: '#4ECDC4' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
