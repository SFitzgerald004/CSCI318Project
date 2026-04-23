import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/trips');
    } catch (err) {
      setError(err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <PaperAirplaneIcon className="w-10 h-10 text-white mx-auto mb-2" />
        <h1 className="type-tile-heading text-white mb-1">TripBudget</h1>
        <p className="type-caption text-white/50 mb-8">Smart travel budget planning</p>

        <form onSubmit={handleSubmit} className="bg-surface-dark-1 rounded-xl p-7 text-left">
          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
            variant="dark"
            className="mb-4"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
            variant="dark"
            className="mb-6"
          />

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-center text-white/50 text-sm mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-link-dark hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
