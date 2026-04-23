import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../components/ui/Modal';

describe('<Modal>', () => {
  it('does not render when open is false', () => {
    render(<Modal open={false} onClose={() => {}} title="Test"><p>body</p></Modal>);
    expect(screen.queryByText('body')).not.toBeInTheDocument();
  });
  it('renders when open is true', () => {
    render(<Modal open={true} onClose={() => {}} title="Test"><p>body</p></Modal>);
    expect(screen.getByText('body')).toBeInTheDocument();
  });
  it('renders the title', () => {
    render(<Modal open={true} onClose={() => {}} title="My Modal"><p>body</p></Modal>);
    expect(screen.getByText('My Modal')).toBeInTheDocument();
  });
  it('has role="dialog" and aria-modal', () => {
    render(<Modal open={true} onClose={() => {}} title="T"><p>body</p></Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="T"><p>body</p></Modal>);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="T"><p>body</p></Modal>);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="T"><p>body</p></Modal>);
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });
  it('does not call onClose when panel (not overlay) is clicked', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="T"><p>body</p></Modal>);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });
  it('close button has type="button" to prevent form submission', () => {
    render(<Modal open={true} onClose={() => {}} title="T"><p>body</p></Modal>);
    expect(screen.getByLabelText('Close')).toHaveAttribute('type', 'button');
  });
});
