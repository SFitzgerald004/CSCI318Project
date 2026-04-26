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
import RecommendationDetailPage from './pages/RecommendationDetailPage'
import ItineraryPage from './pages/ItineraryPage'
import FlightsPage from './pages/FlightsPage'

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
            <Route path="itinerary" element={<ItineraryPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="recommendations/:recId" element={<RecommendationDetailPage />} />
            <Route path="flights" element={<FlightsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/trips" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
