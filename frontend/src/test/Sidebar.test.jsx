import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';

function renderSidebar({ tripName = undefined, path = '/trips' } = {}) {
  const mockAuth = { user: { email: 'test@example.com' }, logout: vi.fn() };
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter initialEntries={[path]}>
        <Sidebar tripName={tripName} />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('<Sidebar>', () => {
  it('renders TripBudget wordmark', () => {
    renderSidebar();
    expect(screen.getByText('TripBudget')).toBeInTheDocument();
  });

  it('shows "My Trips" link when not in a trip', () => {
    renderSidebar();
    expect(screen.getByText('My Trips')).toBeInTheDocument();
  });

  it('renders user email', () => {
    renderSidebar();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders Sign Out button', () => {
    renderSidebar();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls logout when Sign Out clicked', () => {
    const mockAuth = { user: { email: 'test@example.com' }, logout: vi.fn() };
    render(
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter><Sidebar /></MemoryRouter>
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByText('Sign Out'));
    expect(mockAuth.logout).toHaveBeenCalled();
  });

  it('has backdrop-blur class on aside (glass treatment)', () => {
    const { container } = renderSidebar();
    expect(container.querySelector('aside').className).toMatch(/backdrop-blur/);
  });
});
