import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await signup(email, password);
      navigate('/trips');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use'
        ? 'Email already in use'
        : err.code === 'auth/weak-password'
        ? 'Password must be at least 6 characters'
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
        <p className="type-caption text-white/50 mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="bg-surface-dark-1 rounded-xl p-7 text-left">
          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <Input label="Email" type="email" value={email} onChange={setEmail}
            placeholder="you@example.com" required variant="dark" className="mb-4" />
          <Input label="Password" type="password" value={password} onChange={setPassword}
            placeholder="At least 6 characters" required variant="dark" className="mb-4" />
          <Input label="Confirm Password" type="password" value={confirmPassword}
            onChange={setConfirmPassword} placeholder="••••••••" required variant="dark" className="mb-6" />

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Creating account...' : 'Sign Up'}
          </Button>

          <p className="text-center text-white/50 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-link-dark hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
