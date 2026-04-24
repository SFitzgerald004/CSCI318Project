import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)
    try {
      await signup(email, password)
      navigate('/trips')
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-white mb-1">TripBudget</h1>
        <p className="text-gray-500 text-sm mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="bg-[#1d1d1f] rounded-xl p-7 text-left">
          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <label className="block mb-4">
            <span className="text-gray-500 text-xs">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1.5 w-full bg-[#272729] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              placeholder="you@example.com" />
          </label>

          <label className="block mb-4">
            <span className="text-gray-500 text-xs">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-1.5 w-full bg-[#272729] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              placeholder="••••••••" />
          </label>

          <label className="block mb-6">
            <span className="text-gray-500 text-xs">Confirm Password</span>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              className="mt-1.5 w-full bg-[#272729] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              placeholder="••••••••" />
          </label>

          <button type="submit" disabled={submitting}
            className="w-full bg-[#0071e3] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50">
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2997ff] hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
