import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../../components/ui/Badge';

describe('<Badge>', () => {
  it('renders children', () => {
    render(<Badge>Hotel</Badge>);
    expect(screen.getByText('Hotel')).toBeInTheDocument();
  });
  it('applies neutral variant by default', () => {
    const { container } = render(<Badge>X</Badge>);
    expect(container.firstChild.className).toMatch(/bg-gray-100/);
  });
  it('applies hotel variant', () => {
    const { container } = render(<Badge variant="hotel">X</Badge>);
    expect(container.firstChild.className).toMatch(/bg-blue-100/);
  });
  it('applies ai-pick variant', () => {
    const { container } = render(<Badge variant="ai-pick">X</Badge>);
    expect(container.firstChild.className).toMatch(/bg-yellow-100/);
  });
  it('applies tool-called variant with check icon', () => {
    const { container } = render(<Badge variant="tool-called">Tool</Badge>);
    expect(container.firstChild.className).toMatch(/bg-apple-blue/);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
  it('has pill shape (rounded-full)', () => {
    const { container } = render(<Badge>X</Badge>);
    expect(container.firstChild.className).toMatch(/rounded-full/);
  });
});
