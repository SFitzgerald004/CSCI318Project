import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContextObject';

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
  it('renders Wayfare wordmark', () => {
    renderSidebar();
    expect(screen.getByText('Wayfare')).toBeInTheDocument();
  });

  it('shows Trips link when not in a trip', () => {
    renderSidebar();
    expect(screen.getByRole('link', { name: /^trips$/i })).toBeInTheDocument();
  });

  it('renders user handle from email', () => {
    renderSidebar();
    // editorial sidebar displays the local-part (handle), not the full email
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('renders Sign out button', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls logout when Sign out clicked', () => {
    const mockAuth = { user: { email: 'test@example.com' }, logout: vi.fn() };
    render(
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter><Sidebar /></MemoryRouter>
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(mockAuth.logout).toHaveBeenCalled();
  });

  it('uses the editorial sidebar shell (paper background, not glass)', () => {
    const { container } = renderSidebar();
    expect(container.querySelector('aside').className).toMatch(/ed-sidebar/);
  });
});
