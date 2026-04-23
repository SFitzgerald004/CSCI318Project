import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Skeleton from '../../components/ui/Skeleton';

describe('<Skeleton>', () => {
  it('applies text variant by default', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild.className).toMatch(/h-4/);
  });
  it('applies title variant', () => {
    const { container } = render(<Skeleton variant="title" />);
    expect(container.firstChild.className).toMatch(/h-7/);
  });
  it('applies card variant', () => {
    const { container } = render(<Skeleton variant="card" />);
    expect(container.firstChild.className).toMatch(/h-32/);
  });
  it('applies circle variant', () => {
    const { container } = render(<Skeleton variant="circle" />);
    expect(container.firstChild.className).toMatch(/rounded-full/);
  });
  it('has shimmer animation', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild.className).toMatch(/animate-pulse/);
  });
  it('accepts custom className', () => {
    const { container } = render(<Skeleton className="w-1/2" />);
    expect(container.firstChild.className).toMatch(/w-1\/2/);
  });
});
