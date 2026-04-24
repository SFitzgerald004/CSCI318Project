import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import TripCard from '../components/TripCard'

const mockTrip = {
  id: 'trip-123',
  destination: 'Tokyo',
  trip_purpose: 'vacation',
  num_travelers: 2,
  total_budget: 3500,
  departure_date: '2026-07-01T00:00:00Z',
  return_date: '2026-07-08T00:00:00Z',
}

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('TripCard', () => {
  it('renders destination name', () => {
    renderWithRouter(<TripCard trip={mockTrip} />)
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
  })

  it('renders budget amount', () => {
    renderWithRouter(<TripCard trip={mockTrip} />)
    expect(screen.getByText('$3,500')).toBeInTheDocument()
  })

  it('renders trip purpose', () => {
    renderWithRouter(<TripCard trip={mockTrip} />)
    expect(screen.getByText(/vacation/i)).toBeInTheDocument()
  })

  it('renders traveler count', () => {
    renderWithRouter(<TripCard trip={mockTrip} />)
    expect(screen.getByText(/2 travelers/i)).toBeInTheDocument()
  })

  it('links to trip detail page', () => {
    renderWithRouter(<TripCard trip={mockTrip} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/trips/trip-123')
  })

  it('shows singular traveler for 1 person', () => {
    renderWithRouter(<TripCard trip={{ ...mockTrip, num_travelers: 1 }} />)
    expect(screen.getByText(/1 traveler$/i)).toBeInTheDocument()
  })
})
