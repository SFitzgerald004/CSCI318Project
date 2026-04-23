import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Select from '../../components/ui/Select';

const OPTIONS = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'business', label: 'Business' },
];

describe('<Select>', () => {
  it('renders label', () => {
    render(<Select label="Purpose" options={OPTIONS} value="vacation" onChange={() => {}} />);
    expect(screen.getByText('Purpose')).toBeInTheDocument();
  });
  it('renders all options', () => {
    render(<Select label="Purpose" options={OPTIONS} value="vacation" onChange={() => {}} />);
    expect(screen.getByRole('option', { name: 'Vacation' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Business' })).toBeInTheDocument();
  });
  it('fires onChange with new value', () => {
    const onChange = vi.fn();
    render(<Select label="Purpose" options={OPTIONS} value="vacation" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'business' } });
    expect(onChange).toHaveBeenCalledWith('business');
  });
  it('reflects value prop as selected', () => {
    render(<Select label="Purpose" options={OPTIONS} value="business" onChange={() => {}} />);
    expect(screen.getByRole('combobox').value).toBe('business');
  });
  it('renders chevron icon', () => {
    const { container } = render(<Select label="Purpose" options={OPTIONS} value="vacation" onChange={() => {}} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
