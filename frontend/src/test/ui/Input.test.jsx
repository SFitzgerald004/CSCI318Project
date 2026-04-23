import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../../components/ui/Input';

describe('<Input>', () => {
  it('renders label text', () => {
    render(<Input label="Email" value="" onChange={() => {}} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });
  it('fires onChange with the new value', () => {
    const onChange = vi.fn();
    render(<Input label="Email" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hi@example.com' } });
    expect(onChange).toHaveBeenCalledWith('hi@example.com');
  });
  it('renders placeholder', () => {
    render(<Input label="Name" placeholder="Jane Doe" value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument();
  });
  it('applies light variant by default', () => {
    render(<Input label="X" value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox').className).toMatch(/bg-\[#fafafc\]/);
  });
  it('applies dark variant classes', () => {
    render(<Input label="X" value="" onChange={() => {}} variant="dark" />);
    expect(screen.getByRole('textbox').className).toMatch(/bg-surface-dark-2/);
  });
  it('shows error message when error prop is set', () => {
    render(<Input label="X" value="" onChange={() => {}} error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Required').className).toMatch(/text-red/);
  });
  it('passes through type prop', () => {
    render(<Input label="Password" type="password" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });
  it('applies required attribute', () => {
    render(<Input label="X" value="" onChange={() => {}} required />);
    expect(screen.getByRole('textbox')).toBeRequired();
  });
});
