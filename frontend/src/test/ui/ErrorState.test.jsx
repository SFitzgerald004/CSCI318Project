import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorState from '../../components/ui/ErrorState';

describe('<ErrorState>', () => {
  it('renders title', () => {
    render(<ErrorState title="Something failed" />);
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });
  it('renders description', () => {
    render(<ErrorState title="T" description="Try again in a moment" />);
    expect(screen.getByText('Try again in a moment')).toBeInTheDocument();
  });
  it('renders warning icon', () => {
    const { container } = render(<ErrorState title="T" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
  it('renders retry button when retry prop provided', () => {
    render(<ErrorState title="T" retry={() => {}} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
  it('calls retry when retry button is clicked', () => {
    const retry = vi.fn();
    render(<ErrorState title="T" retry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalled();
  });
  it('does not render button when no retry', () => {
    render(<ErrorState title="T" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
