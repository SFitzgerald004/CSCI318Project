# React Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React SPA frontend for the TripBudget Flask API with Firebase Auth, trip management, budget visualization, AI advisor, and recommendations.

**Architecture:** Vite + React app in a `frontend/` folder inside the existing Flask project. Firebase JS SDK handles client-side auth, axios with a Bearer token interceptor talks to the Flask API via Vite's dev proxy. Sidebar dashboard layout with React Router for page navigation.

**Tech Stack:** React, Vite, Tailwind CSS, React Router, Axios, Firebase JS SDK, Recharts, React Hot Toast, Heroicons

**Spec:** `docs/superpowers/specs/2026-04-15-react-frontend-design.md`

---

## File Map

### New files (frontend/)

| File | Responsibility |
|------|---------------|
| `frontend/package.json` | Dependencies and scripts |
| `frontend/vite.config.js` | Dev server config + API proxy |
| `frontend/index.html` | HTML entry point |
| `frontend/src/main.jsx` | React root mount |
| `frontend/src/App.jsx` | Router + layout structure |
| `frontend/src/index.css` | Tailwind directives + global styles |
| `frontend/src/config/firebase.js` | Firebase SDK init |
| `frontend/src/context/AuthContext.jsx` | Auth state provider |
| `frontend/src/services/api.js` | Axios instance + auth interceptor |
| `frontend/src/services/tripService.js` | Trip API calls |
| `frontend/src/services/budgetService.js` | Budget API calls |
| `frontend/src/services/aiService.js` | AI API calls |
| `frontend/src/services/recommendationService.js` | Recommendation API calls |
| `frontend/src/components/LoadingSpinner.jsx` | Spinner component |
| `frontend/src/components/ProtectedRoute.jsx` | Auth guard + sidebar layout wrapper |
| `frontend/src/components/Sidebar.jsx` | Sidebar navigation |
| `frontend/src/components/TripCard.jsx` | Trip card for grid |
| `frontend/src/components/BudgetChart.jsx` | Recharts pie chart |
| `frontend/src/components/SavingsProgress.jsx` | Savings plan display |
| `frontend/src/components/AiChatPanel.jsx` | AI chat history panel |
| `frontend/src/components/AiInsightCard.jsx` | Clickable AI action card |
| `frontend/src/components/RecommendationCard.jsx` | Recommendation display card |
| `frontend/src/pages/LoginPage.jsx` | Login form |
| `frontend/src/pages/SignupPage.jsx` | Signup form |
| `frontend/src/pages/TripsPage.jsx` | Trip list + create modal |
| `frontend/src/pages/TripDetailPage.jsx` | Trip overview |
| `frontend/src/pages/BudgetPage.jsx` | Budget allocation + savings |
| `frontend/src/pages/AiAdvisorPage.jsx` | AI insight cards + chat |
| `frontend/src/pages/RecommendationsPage.jsx` | Saved recommendations |

### Modified files (backend)

| File | Change |
|------|--------|
| `routes/trips.py` | Add `GET /api/trips/<trip_id>` route |

---

## Task 0: Add Backend GET Trip Route

**Files:**
- Modify: `routes/trips.py`

The frontend needs to fetch a single trip by ID. The backend model has `Trip.get(trip_id)` but no route exposes it.

- [ ] **Step 1: Add the route to `routes/trips.py`**

Add after the existing `create_trip` route:

```python
@trips_bp.route('/api/trips/<trip_id>', methods=['GET'])
@require_auth
def get_trip(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(trip), 200
```

- [ ] **Step 2: Verify the backend still starts**

Run: `cd /Users/heitindersingh/CSCI318Project && python -c "from app import create_app; app = create_app(); print('OK')"`

Expected: `OK` (or Firebase init error if no credentials configured locally — that's fine, the route is registered)

- [ ] **Step 3: Commit**

```bash
git add routes/trips.py
git commit -m "feat: add GET /api/trips/<trip_id> route for frontend"
```

---

## Task 1: Scaffold Vite + React Project

**Files:**
- Create: `frontend/package.json`, `frontend/vite.config.js`, `frontend/tailwind.config.js`, `frontend/index.html`, `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/index.css`

- [ ] **Step 1: Create Vite project and install dependencies**

```bash
cd /Users/heitindersingh/CSCI318Project
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-router-dom axios firebase recharts react-hot-toast @heroicons/react
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Configure Vite with API proxy**

Replace `frontend/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
```

- [ ] **Step 3: Set up Tailwind CSS**

Replace `frontend/src/index.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Set up minimal App.jsx**

Replace `frontend/src/App.jsx`:

```jsx
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="text-gray-900">
        <h1 className="text-2xl font-semibold p-8">TripBudget</h1>
        <p className="px-8 text-gray-500">App shell is working.</p>
      </div>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Update main.jsx**

Replace `frontend/src/main.jsx`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 6: Verify dev server starts**

Run: `cd /Users/heitindersingh/CSCI318Project/frontend && npm run dev`

Expected: Vite starts on http://localhost:5173, page shows "TripBudget" heading with Tailwind styling applied.

- [ ] **Step 7: Commit**

```bash
cd /Users/heitindersingh/CSCI318Project
git add frontend/
git commit -m "feat: scaffold Vite + React + Tailwind frontend"
```

---

## Task 2: Firebase Config + AuthContext

**Files:**
- Create: `frontend/src/config/firebase.js`, `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1: Create Firebase config**

Create `frontend/src/config/firebase.js`:

```js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
```

- [ ] **Step 2: Create `.env` file for Firebase keys**

Create `frontend/.env`:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Add `frontend/.env` to `.gitignore` if not already there.

- [ ] **Step 3: Create AuthContext**

Create `frontend/src/context/AuthContext.jsx`:

```jsx
import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../config/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    return signOut(auth)
  }

  async function getToken() {
    if (!user) return null
    return user.getIdToken()
  }

  const value = { user, loading, login, signup, logout, getToken }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

- [ ] **Step 4: Wrap App with AuthProvider**

Update `frontend/src/App.jsx`:

```jsx
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <div className="text-gray-900">
          <h1 className="text-2xl font-semibold p-8">TripBudget</h1>
          <p className="px-8 text-gray-500">Auth context ready.</p>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

- [ ] **Step 5: Verify dev server still starts without errors**

Run: `cd /Users/heitindersingh/CSCI318Project/frontend && npm run dev`

Expected: No console errors. Page loads. (Firebase will log a warning about missing config values — that's expected until real keys are added.)

- [ ] **Step 6: Commit**

```bash
cd /Users/heitindersingh/CSCI318Project
git add frontend/src/config/ frontend/src/context/ frontend/src/App.jsx
git commit -m "feat: add Firebase config and AuthContext"
```

---

## Task 3: API Service Layer

**Files:**
- Create: `frontend/src/services/api.js`, `frontend/src/services/tripService.js`, `frontend/src/services/budgetService.js`, `frontend/src/services/aiService.js`, `frontend/src/services/recommendationService.js`

- [ ] **Step 1: Create axios instance with auth interceptor**

Create `frontend/src/services/api.js`:

```js
import axios from 'axios'
import { auth } from '../config/firebase'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

- [ ] **Step 2: Create tripService.js**

Create `frontend/src/services/tripService.js`:

```js
import api from './api'

export async function getTrips() {
  const { data } = await api.get('/trips')
  return data
}

export async function getTrip(tripId) {
  const { data } = await api.get(`/trips/${tripId}`)
  return data
}

export async function createTrip(tripData) {
  const { data } = await api.post('/trips', tripData)
  return data
}
```

- [ ] **Step 3: Create budgetService.js**

Create `frontend/src/services/budgetService.js`:

```js
import api from './api'

export async function getAllocation(tripId) {
  const { data } = await api.get(`/budget/${tripId}/allocate`)
  return data
}

export async function createAllocation(tripId) {
  const { data } = await api.post(`/budget/${tripId}/allocate`)
  return data
}

export async function getSavings(tripId) {
  const { data } = await api.get(`/budget/${tripId}/savings`)
  return data
}

export async function createSavings(tripId, amountSaved) {
  const { data } = await api.post(`/budget/${tripId}/savings`, { amount_saved: amountSaved })
  return data
}
```

- [ ] **Step 4: Create aiService.js**

Create `frontend/src/services/aiService.js`:

```js
import api from './api'

export async function analyzeBudget(tripId) {
  const { data } = await api.post(`/ai/${tripId}/analyze`)
  return data
}

export async function getAiRecommendations(tripId, focus = 'overall') {
  const { data } = await api.post(`/ai/${tripId}/recommend`, { focus })
  return data
}
```

- [ ] **Step 5: Create recommendationService.js**

Create `frontend/src/services/recommendationService.js`:

```js
import api from './api'

export async function getRecommendations(tripId, category = null) {
  const params = category ? { category } : {}
  const { data } = await api.get(`/recommendations/${tripId}`, { params })
  return data
}

export async function createRecommendation(tripId, recData) {
  const { data } = await api.post(`/recommendations/${tripId}`, recData)
  return data
}

export async function deleteRecommendation(tripId, recId) {
  const { data } = await api.delete(`/recommendations/${tripId}/${recId}`)
  return data
}
```

- [ ] **Step 6: Commit**

```bash
cd /Users/heitindersingh/CSCI318Project
git add frontend/src/services/
git commit -m "feat: add API service layer with auth interceptor"
```

---

## Task 4: Shared Components — LoadingSpinner, ProtectedRoute, Sidebar

**Files:**
- Create: `frontend/src/components/LoadingSpinner.jsx`, `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/components/Sidebar.jsx`

- [ ] **Step 1: Create LoadingSpinner**

Create `frontend/src/components/LoadingSpinner.jsx`:

```jsx
export default function LoadingSpinner({ inline = false }) {
  return (
    <div className={`flex items-center justify-center ${inline ? 'py-12' : 'min-h-screen'} bg-[#f5f5f7]`}>
      <div className="w-8 h-8 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
```

- [ ] **Step 2: Create Sidebar**

Create `frontend/src/components/Sidebar.jsx`:

```jsx
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ tripName }) {
  const { id } = useParams()
  const location = useLocation()
  const { user, logout } = useAuth()

  const isActive = (path) => location.pathname === path

  const linkClass = (path) =>
    `block px-3 py-2 rounded-md text-sm transition-colors ${
      isActive(path)
        ? 'bg-[#0071e3] text-white font-medium'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`

  return (
    <aside className="w-56 bg-[#1d1d1f] min-h-screen flex flex-col p-5 flex-shrink-0">
      <Link to="/trips" className="text-white text-lg font-semibold mb-6">
        TripBudget
      </Link>

      {id ? (
        <>
          <Link to="/trips" className="text-gray-500 text-sm mb-4 hover:text-gray-300">
            ← All Trips
          </Link>
          <p className="px-3 text-xs uppercase tracking-wider text-gray-500 mb-2">
            {tripName || 'Trip'}
          </p>
          <nav className="flex flex-col gap-1">
            <Link to={`/trips/${id}`} className={linkClass(`/trips/${id}`)}>Overview</Link>
            <Link to={`/trips/${id}/budget`} className={linkClass(`/trips/${id}/budget`)}>Budget</Link>
            <Link to={`/trips/${id}/ai`} className={linkClass(`/trips/${id}/ai`)}>AI Advisor</Link>
            <Link to={`/trips/${id}/recommendations`} className={linkClass(`/trips/${id}/recommendations`)}>Recommendations</Link>
          </nav>
        </>
      ) : (
        <nav className="flex flex-col gap-1">
          <Link to="/trips" className={linkClass('/trips')}>My Trips</Link>
        </nav>
      )}

      <div className="mt-auto pt-4 border-t border-white/10">
        <p className="text-gray-500 text-xs truncate">{user?.email}</p>
        <button
          onClick={logout}
          className="text-gray-600 text-xs mt-2 hover:text-gray-400 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Create ProtectedRoute**

Create `frontend/src/components/ProtectedRoute.jsx`:

```jsx
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import LoadingSpinner from './LoadingSpinner'
import { useState, useEffect } from 'react'
import { getTrip } from '../services/tripService'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { id } = useParams()
  const [tripName, setTripName] = useState('')

  useEffect(() => {
    if (id && user) {
      getTrip(id)
        .then((trip) => setTripName(trip.destination))
        .catch(() => setTripName('Trip'))
    }
  }, [id, user])

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <Sidebar tripName={tripName} />
      <main className="flex-1 bg-[#f5f5f7] p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/heitindersingh/CSCI318Project
git add frontend/src/components/LoadingSpinner.jsx frontend/src/components/ProtectedRoute.jsx frontend/src/components/Sidebar.jsx
git commit -m "feat: add LoadingSpinner, ProtectedRoute, and Sidebar components"
```

---

## Task 5: Router Setup + Login/Signup Pages

**Files:**
- Create: `frontend/src/pages/LoginPage.jsx`, `frontend/src/pages/SignupPage.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create LoginPage**

Create `frontend/src/pages/LoginPage.jsx`:

```jsx
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
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-white mb-1">TripBudget</h1>
        <p className="text-gray-500 text-sm mb-8">Smart travel budget planning</p>

        <form onSubmit={handleSubmit} className="bg-[#1d1d1f] rounded-xl p-7 text-left">
          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <label className="block mb-4">
            <span className="text-gray-500 text-xs">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full bg-[#272729] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              placeholder="you@example.com"
            />
          </label>

          <label className="block mb-6">
            <span className="text-gray-500 text-xs">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1.5 w-full bg-[#272729] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#0071e3] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#2997ff] hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create SignupPage**

Create `frontend/src/pages/SignupPage.jsx`:

```jsx
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
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full bg-[#272729] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              placeholder="you@example.com"
            />
          </label>

          <label className="block mb-4">
            <span className="text-gray-500 text-xs">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1.5 w-full bg-[#272729] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              placeholder="••••••••"
            />
          </label>

          <label className="block mb-6">
            <span className="text-gray-500 text-xs">Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1.5 w-full bg-[#272729] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#0071e3] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50"
          >
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
```

- [ ] **Step 3: Create placeholder pages so imports don't break**

Create placeholder files for each page that isn't built yet. Each file follows this pattern:

`frontend/src/pages/TripsPage.jsx`:
```jsx
export default function TripsPage() {
  return <h1 className="text-2xl font-semibold text-[#1d1d1f]">My Trips</h1>
}
```

Repeat the same pattern for `TripDetailPage.jsx`, `BudgetPage.jsx`, `AiAdvisorPage.jsx`, `RecommendationsPage.jsx` — each with just an `<h1>` placeholder.

**Important:** These must exist before wiring up App.jsx in the next step, otherwise imports will fail.

- [ ] **Step 4: Set up router in App.jsx**

Replace `frontend/src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import BudgetPage from './pages/BudgetPage'
import AiAdvisorPage from './pages/AiAdvisorPage'
import RecommendationsPage from './pages/RecommendationsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/trips" element={<TripsPage />} />
          </Route>

          <Route path="/trips/:id" element={<ProtectedRoute />}>
            <Route index element={<TripDetailPage />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="ai" element={<AiAdvisorPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/trips" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

- [ ] **Step 5: Verify routing works**

Run: `cd /Users/heitindersingh/CSCI318Project/frontend && npm run dev`

Test: Navigate to `http://localhost:5173/login` — should see login form. Navigate to `/trips` — should redirect to `/login` (no auth). Navigate to `/signup` — should see signup form.

- [ ] **Step 6: Commit**

```bash
cd /Users/heitindersingh/CSCI318Project
git add frontend/src/
git commit -m "feat: add router, Login/Signup pages, and placeholder pages"
```

---

## Task 6: TripsPage + TripCard + Create Trip Modal

**Files:**
- Create: `frontend/src/components/TripCard.jsx`
- Modify: `frontend/src/pages/TripsPage.jsx`

- [ ] **Step 1: Create TripCard component**

Create `frontend/src/components/TripCard.jsx`:

```jsx
import { Link } from 'react-router-dom'

const PURPOSE_EMOJI = {
  vacation: '🌴',
  business: '💼',
  family: '👨‍👩‍👧‍👦',
  adventure: '🏔️',
}

export default function TripCard({ trip }) {
  const departure = new Date(trip.departure_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
  const returnDate = new Date(trip.return_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="text-2xl mb-2">
        {PURPOSE_EMOJI[trip.trip_purpose] || '✈️'}
      </div>
      <h3 className="text-sm font-semibold text-[#1d1d1f]">{trip.destination}</h3>
      <p className="text-xs text-gray-500 mt-1 capitalize">{trip.trip_purpose} · {trip.num_travelers} traveler{trip.num_travelers > 1 ? 's' : ''}</p>
      <p className="text-xs text-gray-500">{departure} – {returnDate}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-base font-semibold text-[#1d1d1f]">${trip.total_budget.toLocaleString()}</span>
        <span className="text-xs text-[#0071e3]">View →</span>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Build TripsPage with create trip modal**

Replace `frontend/src/pages/TripsPage.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { getTrips, createTrip } from '../services/tripService'
import TripCard from '../components/TripCard'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const TRIP_PURPOSES = ['vacation', 'business', 'family', 'adventure']
const FOOD_OPTIONS = ['fine_dining', 'street_food', 'budget_eats', 'local_cuisine']
const ACTIVITY_OPTIONS = ['museums', 'nightlife', 'beaches', 'hiking', 'attractions', 'shopping']
const HOTEL_OPTIONS = ['budget', 'mid_range', 'luxury']

const INITIAL_FORM = {
  destination: '', destination_country: '', total_budget: '',
  departure_date: '', return_date: '', trip_purpose: 'vacation',
  num_travelers: 1, food_prefs: [], activity_prefs: [], hotel_prefs: 'mid_range',
}

export default function TripsPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getTrips()
      .then(setTrips)
      .catch(() => toast.error('Failed to load trips'))
      .finally(() => setLoading(false))
  }, [])

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleArrayItem(field, item) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const newTrip = await createTrip({
        ...form,
        total_budget: Number(form.total_budget),
        num_travelers: Number(form.num_travelers),
      })
      setTrips((prev) => [...prev, newTrip])
      setShowModal(false)
      setForm(INITIAL_FORM)
      toast.success('Trip created!')
    } catch {
      toast.error('Failed to create trip')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">My Trips</h1>
          <p className="text-sm text-gray-500 mt-1">Plan and manage your travel budgets</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0071e3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors"
        >
          + New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">✈️</p>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">No trips yet</h2>
          <p className="text-sm text-gray-500 mt-1">Plan your first trip to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-[#0071e3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors"
          >
            Plan a Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {/* Create Trip Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#1d1d1f]">Plan a New Trip</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block">
                <span className="text-sm text-gray-600">Destination</span>
                <input type="text" required value={form.destination} onChange={(e) => updateForm('destination', e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" placeholder="Tokyo" />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Country</span>
                <input type="text" value={form.destination_country} onChange={(e) => updateForm('destination_country', e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" placeholder="Japan" />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-600">Total Budget ($)</span>
                  <input type="number" required min="1" value={form.total_budget} onChange={(e) => updateForm('total_budget', e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" placeholder="3500" />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-600">Travelers</span>
                  <input type="number" min="1" value={form.num_travelers} onChange={(e) => updateForm('num_travelers', e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-600">Departure</span>
                  <input type="date" required value={form.departure_date} onChange={(e) => updateForm('departure_date', e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-600">Return</span>
                  <input type="date" required value={form.return_date} onChange={(e) => updateForm('return_date', e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-gray-600">Trip Purpose</span>
                <select value={form.trip_purpose} onChange={(e) => updateForm('trip_purpose', e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3] capitalize">
                  {TRIP_PURPOSES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Hotel Preference</span>
                <select value={form.hotel_prefs} onChange={(e) => updateForm('hotel_prefs', e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]">
                  {HOTEL_OPTIONS.map((h) => <option key={h} value={h}>{h.replace('_', ' ')}</option>)}
                </select>
              </label>

              <fieldset>
                <legend className="text-sm text-gray-600 mb-2">Food Preferences</legend>
                <div className="flex flex-wrap gap-2">
                  {FOOD_OPTIONS.map((f) => (
                    <button key={f} type="button" onClick={() => toggleArrayItem('food_prefs', f)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        form.food_prefs.includes(f) ? 'bg-[#0071e3] text-white border-[#0071e3]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}>
                      {f.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm text-gray-600 mb-2">Activity Preferences</legend>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.map((a) => (
                    <button key={a} type="button" onClick={() => toggleArrayItem('activity_prefs', a)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        form.activity_prefs.includes(a) ? 'bg-[#0071e3] text-white border-[#0071e3]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}>
                      {a.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#0071e3] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50 mt-2">
                {submitting ? 'Creating...' : 'Create Trip'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify trips page renders**

Run dev server and navigate to `/trips` (while authenticated or temporarily bypass ProtectedRoute for testing).

- [ ] **Step 4: Commit**

```bash
cd /Users/heitindersingh/CSCI318Project
git add frontend/src/components/TripCard.jsx frontend/src/pages/TripsPage.jsx
git commit -m "feat: add TripsPage with trip cards and create trip modal"
```

---

## Task 7: TripDetailPage (Overview)

**Files:**
- Modify: `frontend/src/pages/TripDetailPage.jsx`

- [ ] **Step 1: Build TripDetailPage**

Replace `frontend/src/pages/TripDetailPage.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip } from '../services/tripService'
import { getAllocation } from '../services/budgetService'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function TripDetailPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [hasBudget, setHasBudget] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTrip(id),
      getAllocation(id).catch(() => null),
    ])
      .then(([tripData, allocation]) => {
        setTrip(tripData)
        setHasBudget(!!allocation)
      })
      .catch(() => toast.error('Failed to load trip'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!trip) return <p className="text-gray-500">Trip not found.</p>

  const departure = new Date(trip.departure_date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
  })
  const returnDate = new Date(trip.return_date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1f]">{trip.destination}</h1>
      <p className="text-sm text-gray-500 mt-1 capitalize">{trip.trip_purpose} · {trip.num_travelers} traveler{trip.num_travelers > 1 ? 's' : ''}</p>

      {/* Trip Info */}
      <div className="bg-white rounded-xl p-5 shadow-sm mt-6">
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4">Trip Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Destination</span><p className="font-medium text-[#1d1d1f]">{trip.destination}{trip.destination_country ? `, ${trip.destination_country}` : ''}</p></div>
          <div><span className="text-gray-500">Budget</span><p className="font-medium text-[#1d1d1f]">${trip.total_budget.toLocaleString()}</p></div>
          <div><span className="text-gray-500">Departure</span><p className="font-medium text-[#1d1d1f]">{departure}</p></div>
          <div><span className="text-gray-500">Return</span><p className="font-medium text-[#1d1d1f]">{returnDate}</p></div>
          {trip.hotel_prefs && <div><span className="text-gray-500">Hotel Preference</span><p className="font-medium text-[#1d1d1f] capitalize">{trip.hotel_prefs.replace('_', ' ')}</p></div>}
          {trip.food_prefs?.length > 0 && <div><span className="text-gray-500">Food Preferences</span><p className="font-medium text-[#1d1d1f] capitalize">{trip.food_prefs.map(f => f.replace('_', ' ')).join(', ')}</p></div>}
          {trip.activity_prefs?.length > 0 && <div><span className="text-gray-500">Activity Preferences</span><p className="font-medium text-[#1d1d1f] capitalize">{trip.activity_prefs.map(a => a.replace('_', ' ')).join(', ')}</p></div>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Link to={`/trips/${id}/budget`} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="text-sm font-semibold text-[#1d1d1f]">{hasBudget ? 'View Budget' : 'Generate Budget'}</h3>
          <p className="text-xs text-gray-500 mt-1">{hasBudget ? 'See your budget breakdown' : 'Get a smart budget allocation'}</p>
        </Link>
        <Link to={`/trips/${id}/ai`} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="text-sm font-semibold text-[#1d1d1f]">AI Advisor</h3>
          <p className="text-xs text-gray-500 mt-1">Get AI-powered travel advice</p>
        </Link>
        <Link to={`/trips/${id}/recommendations`} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">⭐</div>
          <h3 className="text-sm font-semibold text-[#1d1d1f]">Recommendations</h3>
          <p className="text-xs text-gray-500 mt-1">View saved recommendations</p>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/heitindersingh/CSCI318Project
git add frontend/src/pages/TripDetailPage.jsx
git commit -m "feat: add TripDetailPage with overview and quick actions"
```

---

## Task 8: BudgetPage + BudgetChart + SavingsProgress

**Files:**
- Create: `frontend/src/components/BudgetChart.jsx`, `frontend/src/components/SavingsProgress.jsx`
- Modify: `frontend/src/pages/BudgetPage.jsx`

- [ ] **Step 1: Create BudgetChart component**

Create `frontend/src/components/BudgetChart.jsx`:

```jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#0071e3', '#34c759', '#ff9f0a', '#ff375f', '#af52de', '#8e8e93']
const LABELS = ['Flights', 'Hotel', 'Food', 'Activities', 'Transport', 'Misc']
const KEYS = ['flights', 'hotel', 'food', 'activities', 'transport', 'misc']

export default function BudgetChart({ allocation }) {
  const data = KEYS.map((key, i) => ({
    name: LABELS[i],
    value: allocation[`${key}_pct`],
    amount: allocation[`${key}_budget`],
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Pie>
          <Tooltip formatter={(value, name, props) => [`$${props.payload.amount} (${value}%)`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i] }} />
            {d.name} {d.value}%
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create SavingsProgress component**

Create `frontend/src/components/SavingsProgress.jsx`:

```jsx
export default function SavingsProgress({ savings, totalBudget }) {
  const pct = Math.min(100, Math.round((savings.amount_saved / totalBudget) * 100))

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: 'per month', value: savings.monthly_savings_needed },
          { label: 'bi-weekly', value: savings.biweekly_savings_needed },
          { label: 'per week', value: savings.weekly_savings_needed },
        ].map((s) => (
          <div key={s.label} className="text-center bg-[#f5f5f7] rounded-lg p-3">
            <p className="text-xl font-semibold text-[#1d1d1f]">${s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>${savings.amount_saved} saved</span>
          <span>${totalBudget} goal</span>
        </div>
        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="bg-[#0071e3] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build BudgetPage**

Replace `frontend/src/pages/BudgetPage.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getTrip } from '../services/tripService'
import { getAllocation, createAllocation, getSavings, createSavings } from '../services/budgetService'
import BudgetChart from '../components/BudgetChart'
import SavingsProgress from '../components/SavingsProgress'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const ICONS = { flights: '✈️', hotel: '🏨', food: '🍽️', activities: '🎯', transport: '🚗', misc: '📦' }
const KEYS = ['flights', 'hotel', 'food', 'activities', 'transport', 'misc']

export default function BudgetPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [allocation, setAllocation] = useState(null)
  const [savings, setSavings] = useState(null)
  const [amountSaved, setAmountSaved] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    Promise.all([
      getTrip(id),
      getAllocation(id).catch(() => null),
      getSavings(id).catch(() => null),
    ])
      .then(([t, a, s]) => { setTrip(t); setAllocation(a); setSavings(s) })
      .catch(() => toast.error('Failed to load budget data'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const a = await createAllocation(id)
      setAllocation(a)
      toast.success('Budget generated!')
    } catch {
      toast.error('Failed to generate budget')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSavings(e) {
    e.preventDefault()
    try {
      const s = await createSavings(id, Number(amountSaved))
      setSavings(s)
      toast.success('Savings plan updated!')
    } catch {
      toast.error('Failed to update savings plan')
    }
  }

  if (loading) return <LoadingSpinner />
  if (!trip) return <p className="text-gray-500">Trip not found.</p>

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1f]">Budget Breakdown</h1>
      <p className="text-sm text-gray-500 mt-1">${trip.total_budget.toLocaleString()} total · {trip.trip_purpose}</p>

      {!allocation ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📊</p>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">No budget yet</h2>
          <p className="text-sm text-gray-500 mt-1">Generate a smart budget allocation based on your trip details</p>
          <button onClick={handleGenerate} disabled={generating}
            className="mt-4 bg-[#0071e3] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50">
            {generating ? 'Generating...' : 'Generate Budget'}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            {/* Pie Chart */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">Allocation</h2>
              <BudgetChart allocation={allocation} />
            </div>

            {/* Amounts List */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#1d1d1f]">Amounts</h2>
                <button onClick={handleGenerate} disabled={generating}
                  className="text-xs text-[#0071e3] hover:underline disabled:opacity-50">
                  {generating ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>
              <div className="space-y-3">
                {KEYS.map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{ICONS[key]} {key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <span className="text-sm font-semibold text-[#1d1d1f]">${allocation[`${key}_budget`]}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#1d1d1f]">Total</span>
                  <span className="text-base font-semibold text-[#0071e3]">${trip.total_budget.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Plan */}
          <div className="bg-white rounded-xl p-5 shadow-sm mt-4">
            <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4">Savings Plan</h2>
            {savings ? (
              <SavingsProgress savings={savings} totalBudget={trip.total_budget} />
            ) : (
              <p className="text-sm text-gray-500 mb-3">Track how much you've saved toward this trip.</p>
            )}
            <form onSubmit={handleSavings} className="mt-4 flex gap-3">
              <input type="number" min="0" placeholder="Amount saved so far" value={amountSaved}
                onChange={(e) => setAmountSaved(e.target.value)} required
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" />
              <button type="submit" className="bg-[#1d1d1f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors">
                {savings ? 'Update' : 'Create'} Plan
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/heitindersingh/CSCI318Project
git add frontend/src/components/BudgetChart.jsx frontend/src/components/SavingsProgress.jsx frontend/src/pages/BudgetPage.jsx
git commit -m "feat: add BudgetPage with pie chart and savings plan"
```

---

## Task 9: AiAdvisorPage + AiChatPanel + AiInsightCard

**Files:**
- Create: `frontend/src/components/AiChatPanel.jsx`, `frontend/src/components/AiInsightCard.jsx`
- Modify: `frontend/src/pages/AiAdvisorPage.jsx`

- [ ] **Step 1: Create AiInsightCard**

Create `frontend/src/components/AiInsightCard.jsx`:

```jsx
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
```

- [ ] **Step 2: Create AiChatPanel**

Create `frontend/src/components/AiChatPanel.jsx`:

```jsx
import { useEffect, useRef } from 'react'

export default function AiChatPanel({ messages }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm flex flex-col h-80">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-[#1d1d1f]">💬 AI Chat</div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          Click an action above to start
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm flex flex-col h-96">
      <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-[#1d1d1f]">💬 AI Chat</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 ${
              msg.role === 'ai' ? 'bg-[#0071e3]' : 'bg-[#1d1d1f]'
            }`}>
              {msg.role === 'ai' ? 'AI' : 'U'}
            </div>
            <div className="bg-[#f5f5f7] rounded-lg px-3 py-2 text-sm text-[#1d1d1f] leading-relaxed max-w-[85%] whitespace-pre-wrap">
              {msg.content}
            </div>
          </div>
        ))}
        {messages[messages.length - 1]?.loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-[#0071e3] flex items-center justify-center text-xs text-white flex-shrink-0">AI</div>
            <div className="bg-[#f5f5f7] rounded-lg px-3 py-2 text-sm text-gray-400">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build AiAdvisorPage**

Replace `frontend/src/pages/AiAdvisorPage.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAllocation } from '../services/budgetService'
import { analyzeBudget, getAiRecommendations } from '../services/aiService'
import AiInsightCard from '../components/AiInsightCard'
import AiChatPanel from '../components/AiChatPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AiAdvisorPage() {
  const { id } = useParams()
  const [hasBudget, setHasBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeAction, setActiveAction] = useState(null)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    getAllocation(id)
      .then(() => setHasBudget(true))
      .catch(() => setHasBudget(false))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAnalyze() {
    setActiveAction('analyze')
    setMessages((prev) => [...prev, { role: 'user', content: '📊 Analyze my budget allocation' }])
    try {
      const { advice } = await analyzeBudget(id)
      setMessages((prev) => [...prev, { role: 'ai', content: advice }])
    } catch {
      toast.error('AI service unavailable')
      setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, I couldn\'t analyze your budget right now. Please try again.' }])
    } finally {
      setActiveAction(null)
    }
  }

  async function handleRecommend(focus) {
    setActiveAction(focus)
    setMessages((prev) => [...prev, { role: 'user', content: `🔍 Get ${focus} recommendations` }])
    try {
      const { advice } = await getAiRecommendations(id, focus)
      setMessages((prev) => [...prev, { role: 'ai', content: advice }])
    } catch {
      toast.error('AI service unavailable')
      setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, I couldn\'t get recommendations right now. Please try again.' }])
    } finally {
      setActiveAction(null)
    }
  }

  if (loading) return <LoadingSpinner />

  if (!hasBudget) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">📊</p>
        <h2 className="text-lg font-semibold text-[#1d1d1f]">Generate a budget first</h2>
        <p className="text-sm text-gray-500 mt-1">The AI advisor needs a budget allocation to work with.</p>
        <Link to={`/trips/${id}/budget`}
          className="mt-4 inline-block bg-[#0071e3] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors">
          Go to Budget
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1f]">AI Advisor</h1>
      <p className="text-sm text-gray-500 mt-1">Get AI-powered budget analysis and recommendations</p>

      {/* Insight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
        <AiInsightCard icon="📊" title="Analyze Budget" description="Get AI feedback on your allocation"
          onClick={handleAnalyze} loading={activeAction === 'analyze'} />
        <AiInsightCard icon="🌍" title="Overall" description="Get overall recommendations"
          onClick={() => handleRecommend('overall')} loading={activeAction === 'overall'} />
        <AiInsightCard icon="🏨" title="Hotels" description="Get hotel picks"
          onClick={() => handleRecommend('hotels')} loading={activeAction === 'hotels'} />
        <AiInsightCard icon="🍽️" title="Food" description="Get food picks"
          onClick={() => handleRecommend('food')} loading={activeAction === 'food'} />
        <AiInsightCard icon="🎯" title="Activities" description="Get activity picks"
          onClick={() => handleRecommend('activities')} loading={activeAction === 'activities'} />
      </div>

      {/* Chat Panel */}
      <div className="mt-4">
        <AiChatPanel messages={messages} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/heitindersingh/CSCI318Project
git add frontend/src/components/AiInsightCard.jsx frontend/src/components/AiChatPanel.jsx frontend/src/pages/AiAdvisorPage.jsx
git commit -m "feat: add AI Advisor page with insight cards and chat panel"
```

---

## Task 10: RecommendationsPage + RecommendationCard

**Files:**
- Create: `frontend/src/components/RecommendationCard.jsx`
- Modify: `frontend/src/pages/RecommendationsPage.jsx`

- [ ] **Step 1: Create RecommendationCard**

Create `frontend/src/components/RecommendationCard.jsx`:

```jsx
import { TrashIcon } from '@heroicons/react/24/outline'

const CATEGORY_COLORS = {
  hotel: 'bg-blue-100 text-blue-700',
  restaurant: 'bg-orange-100 text-orange-700',
  attraction: 'bg-purple-100 text-purple-700',
  flight: 'bg-green-100 text-green-700',
  car_rental: 'bg-gray-100 text-gray-700',
}

export default function RecommendationCard({ rec, onDelete }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm relative group">
      <button onClick={onDelete}
        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
        <TrashIcon className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_COLORS[rec.category] || 'bg-gray-100 text-gray-700'}`}>
          {rec.category}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{rec.source?.replace('_', ' ')}</span>
        {rec.is_ai_pick && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">AI Pick</span>}
      </div>

      <h3 className="text-sm font-semibold text-[#1d1d1f]">{rec.name}</h3>
      {rec.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rec.description}</p>}

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        {rec.rating && <span>⭐ {rec.rating}</span>}
        {rec.price_level && <span>{rec.price_level}</span>}
        {rec.address && <span className="truncate">{rec.address}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build RecommendationsPage**

Replace `frontend/src/pages/RecommendationsPage.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getRecommendations, deleteRecommendation } from '../services/recommendationService'
import RecommendationCard from '../components/RecommendationCard'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const TABS = [
  { label: 'All', value: null },
  { label: 'Hotels', value: 'hotel' },
  { label: 'Restaurants', value: 'restaurant' },
  { label: 'Attractions', value: 'attraction' },
]

export default function RecommendationsPage() {
  const { id } = useParams()
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(null)

  useEffect(() => {
    loadRecs()
  }, [id, activeTab])

  async function loadRecs() {
    setLoading(true)
    try {
      const data = await getRecommendations(id, activeTab)
      setRecs(data)
    } catch {
      toast.error('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(recId) {
    try {
      await deleteRecommendation(id, recId)
      setRecs((prev) => prev.filter((r) => r.id !== recId))
      toast.success('Recommendation removed')
    } catch {
      toast.error('Failed to delete recommendation')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1f]">Recommendations</h1>
      <p className="text-sm text-gray-500 mt-1">Saved hotels, restaurants, and attractions</p>

      {/* Tabs */}
      <div className="flex gap-2 mt-6">
        {TABS.map((tab) => (
          <button key={tab.label} onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              activeTab === tab.value
                ? 'bg-[#0071e3] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner inline />
      ) : recs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">⭐</p>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">No recommendations yet</h2>
          <p className="text-sm text-gray-500 mt-1">Try the AI Advisor to get personalized picks</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {recs.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} onDelete={() => handleDelete(rec.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/heitindersingh/CSCI318Project
git add frontend/src/components/RecommendationCard.jsx frontend/src/pages/RecommendationsPage.jsx
git commit -m "feat: add RecommendationsPage with category tabs and cards"
```

---

## Task 11: Final Wiring + Verify

- [ ] **Step 1: Add `.env.example` for documentation**

Create `frontend/.env.example`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

- [ ] **Step 2: Add `frontend/.env` to root `.gitignore`**

Append to `.gitignore`:

```
frontend/.env
frontend/node_modules/
frontend/dist/
```

- [ ] **Step 3: Delete Vite boilerplate files**

Remove: `frontend/src/App.css`, `frontend/src/assets/` (the default Vite SVG logo), and any default content.

- [ ] **Step 4: Start both servers and do a smoke test**

Terminal 1:
```bash
cd /Users/heitindersingh/CSCI318Project && python app.py
```

Terminal 2:
```bash
cd /Users/heitindersingh/CSCI318Project/frontend && npm run dev
```

Smoke test checklist:
1. `/login` renders with no console errors
2. `/signup` renders and links to login
3. Signing in redirects to `/trips`
4. `/trips` shows trip cards (or empty state)
5. Creating a trip works and card appears
6. Clicking a trip card navigates to `/trips/:id`
7. Trip detail shows overview + quick action cards
8. Budget page generates allocation + shows pie chart
9. Savings plan creates and shows progress bar
10. AI Advisor checks for budget, shows insight cards, chat panel populates
11. Recommendations page shows tabs + cards (or empty state)

- [ ] **Step 5: Final commit**

```bash
cd /Users/heitindersingh/CSCI318Project
git add -A
git commit -m "feat: complete React frontend for TripBudget"
```
