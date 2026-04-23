import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../../components/ui/Card';

describe('<Card>', () => {
  it('renders children', () => {
    render(<Card><p>Hello</p></Card>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
  it('applies white variant by default', () => {
    const { container } = render(<Card>X</Card>);
    expect(container.firstChild.className).toMatch(/bg-white/);
  });
  it('applies light variant', () => {
    const { container } = render(<Card variant="light">X</Card>);
    expect(container.firstChild.className).toMatch(/bg-surface-light/);
  });
  it('applies dark-1 variant', () => {
    const { container } = render(<Card variant="dark-1">X</Card>);
    expect(container.firstChild.className).toMatch(/bg-surface-dark-1/);
  });
  it('applies hover classes when hover prop is true', () => {
    const { container } = render(<Card hover>X</Card>);
    expect(container.firstChild.className).toMatch(/cursor-pointer/);
  });
  it('applies elevated shadow when elevated prop is true', () => {
    const { container } = render(<Card elevated>X</Card>);
    expect(container.firstChild.className).toMatch(/shadow-card/);
  });
  it('applies md padding by default', () => {
    const { container } = render(<Card>X</Card>);
    expect(container.firstChild.className).toMatch(/p-5/);
  });
  it('applies sm padding when padding="sm"', () => {
    const { container } = render(<Card padding="sm">X</Card>);
    expect(container.firstChild.className).toMatch(/p-4/);
  });
});
