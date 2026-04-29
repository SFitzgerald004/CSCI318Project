import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripsPage from '../pages/TripsPage';

vi.mock('../services/tripService', () => ({
  getTrips: vi.fn().mockResolvedValue([]),
  createTrip: vi.fn().mockResolvedValue({ id: 'new', destination: 'Paris', total_budget: 3000, trip_purpose: 'vacation', num_travelers: 1, departure_date: '2026-07-01', return_date: '2026-07-08' }),
}));

function renderTripsPage() {
  return render(<MemoryRouter><TripsPage /></MemoryRouter>);
}

describe('<TripsPage>', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows editorial empty state when no trips', async () => {
    renderTripsPage();
    await waitFor(() =>
      expect(screen.getByText(/begin a chapter/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/no journeys/i)).toBeInTheDocument();
  });

  it('opens modal when "New trip" button clicked', async () => {
    renderTripsPage();
    await waitFor(() => expect(screen.getByText(/begin a chapter/i)).toBeInTheDocument());
    // there are two "Plan a trip"/"New trip" CTAs in the empty state — pick the topbar one
    fireEvent.click(screen.getByRole('button', { name: /^new trip$/i }));
    expect(screen.getByText(/plan a new trip/i)).toBeInTheDocument();
  });

  it('closes modal when close button clicked', async () => {
    renderTripsPage();
    await waitFor(() => expect(screen.getByText(/begin a chapter/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^new trip$/i }));
    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByText(/plan a new trip/i)).not.toBeInTheDocument();
  });
});
