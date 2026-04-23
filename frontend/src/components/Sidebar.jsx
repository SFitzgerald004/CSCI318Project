import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  Squares2X2Icon,
  CalculatorIcon,
  SparklesIcon,
  BookmarkIcon,
  PaperAirplaneIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/useAuth';
import Button from './ui/Button';

export default function Sidebar({ tripName }) {
  const { id } = useParams();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const isActive = (path) => location.pathname === path;
  const linkClass = (path) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
      isActive(path)
        ? 'bg-apple-blue text-white font-medium'
        : 'text-white/60 hover:text-white hover:bg-white/5'
    }`;

  const sidebarContent = (
    <>
      <Link to="/trips" className="flex items-center gap-2 text-white type-tile-heading mb-6">
        <PaperAirplaneIcon className="w-5 h-5" />
        TripBudget
      </Link>

      {id ? (
        <>
          <Link to="/trips" className="flex items-center gap-1 text-white/60 text-sm mb-4 hover:text-white">
            <ArrowLeftIcon className="w-4 h-4" /> All Trips
          </Link>
          <p className="px-3 text-xs uppercase tracking-wider text-white/40 mb-2">
            {tripName || 'Trip'}
          </p>
          <nav className="flex flex-col gap-1">
            <Link to={`/trips/${id}`} className={linkClass(`/trips/${id}`)}>
              <Squares2X2Icon className="w-4 h-4" /> Overview
            </Link>
            <Link to={`/trips/${id}/budget`} className={linkClass(`/trips/${id}/budget`)}>
              <CalculatorIcon className="w-4 h-4" /> Budget
            </Link>
            <Link to={`/trips/${id}/ai`} className={linkClass(`/trips/${id}/ai`)}>
              <SparklesIcon className="w-4 h-4" /> AI Advisor
            </Link>
            <Link to={`/trips/${id}/recommendations`} className={linkClass(`/trips/${id}/recommendations`)}>
              <BookmarkIcon className="w-4 h-4" /> Recommendations
            </Link>
          </nav>
        </>
      ) : (
        <nav className="flex flex-col gap-1">
          <Link to="/trips" className={linkClass('/trips')}>
            <Squares2X2Icon className="w-4 h-4" /> My Trips
          </Link>
        </nav>
      )}

      <div className="mt-auto pt-4 border-t border-white/10">
        <p className="text-white/40 text-xs truncate">{user?.email}</p>
        <Button variant="ghost" size="sm" onClick={logout} className="mt-2 !px-0 !text-white/50 hover:!text-white">
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden bg-black/80 backdrop-blur-xl text-white p-2 rounded-lg"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 md:z-0
          w-56 min-h-screen flex flex-col p-5 flex-shrink-0
          bg-black/80 backdrop-blur-xl
          transition-transform duration-250 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ backdropFilter: 'saturate(180%) blur(20px)' }}
      >
        {mobileOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="md:hidden absolute top-4 right-4 text-white/60 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
        {sidebarContent}
      </aside>
    </>
  );
}
