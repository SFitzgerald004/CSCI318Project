import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import EmptyState from '../../components/ui/EmptyState';

describe('<EmptyState>', () => {
  it('renders title', () => {
    render(<EmptyState title="No items" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
  });
  it('renders description', () => {
    render(<EmptyState title="T" description="Nothing here yet" />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });
  it('renders icon when provided', () => {
    const { container } = render(<EmptyState title="T" icon={<PaperAirplaneIcon />} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
  it('renders action when provided', () => {
    render(<EmptyState title="T" action={<button>Go</button>} />);
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });
  it('does not render action section when no action', () => {
    render(<EmptyState title="T" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
