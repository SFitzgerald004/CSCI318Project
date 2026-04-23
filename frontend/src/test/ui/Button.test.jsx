import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

describe('<Button>', () => {
  it('renders children as label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
  it('does not call onClick when loading', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} loading>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
  it('renders a spinner element when loading', () => {
    render(<Button loading>Saving</Button>);
    expect(screen.getByRole('button').querySelector('[data-testid="button-spinner"]')).toBeInTheDocument();
  });
  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>);
    expect(screen.getByRole('button').className).toMatch(/bg-apple-blue/);
  });
  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button').className).toMatch(/bg-white/);
  });
  it('applies pill-outline variant classes', () => {
    render(<Button variant="pill-outline">Learn more</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/rounded-full/);
    expect(btn.className).toMatch(/border/);
  });
  it('renders leading icon when icon prop provided', () => {
    render(<Button icon={PlusIcon}>Add</Button>);
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });
  it('accepts type="submit"', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
