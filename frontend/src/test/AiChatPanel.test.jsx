import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AiChatPanel from '../components/AiChatPanel';

describe('<AiChatPanel>', () => {
  it('renders empty state when no messages', () => {
    render(<AiChatPanel messages={[]} thinking={false} />);
    expect(screen.getByText(/click an action/i)).toBeInTheDocument();
  });

  it('renders user messages', () => {
    render(<AiChatPanel messages={[{ role: 'user', content: 'Hello' }]} thinking={false} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders AI messages', () => {
    render(<AiChatPanel messages={[{ role: 'ai', content: 'Hi there' }]} thinking={false} />);
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('renders tool badges under AI messages with tools_used', () => {
    render(<AiChatPanel messages={[
      { role: 'ai', content: 'Advice', tools_used: ['get_savings_progress'] }
    ]} thinking={false} />);
    expect(screen.getByText('Reviewed savings progress')).toBeInTheDocument();
  });

  it('does not render tool badges for user messages', () => {
    render(<AiChatPanel messages={[
      { role: 'user', content: 'Hi', tools_used: ['get_savings_progress'] }
    ]} thinking={false} />);
    expect(screen.queryByText('Reviewed savings progress')).not.toBeInTheDocument();
  });

  it('shows thinking shimmer when thinking prop is true', () => {
    const { container } = render(<AiChatPanel messages={[]} thinking={true} />);
    expect(container.querySelector('[data-testid="thinking-dots"]')).toBeInTheDocument();
  });

  it('shows Save this button when AI message has canSave and onSave callback', () => {
    render(<AiChatPanel
      messages={[{ role: 'ai', content: 'Hotel picks', canSave: true, category: 'hotel' }]}
      thinking={false}
      onSaveRecommendation={vi.fn()}
    />);
    expect(screen.getByRole('button', { name: /save this/i })).toBeInTheDocument();
  });

  it('does not show Save button when canSave is false', () => {
    render(<AiChatPanel
      messages={[{ role: 'ai', content: 'Overall advice', canSave: false }]}
      thinking={false}
      onSaveRecommendation={vi.fn()}
    />);
    expect(screen.queryByRole('button', { name: /save this/i })).not.toBeInTheDocument();
  });

  it('switches to "Saved" state after successful save', async () => {
    const onSave = vi.fn().mockResolvedValue({ id: 'new-rec' });
    render(<AiChatPanel
      messages={[{ role: 'ai', content: 'Hotel picks', canSave: true, category: 'hotel' }]}
      thinking={false}
      onSaveRecommendation={onSave}
    />);
    fireEvent.click(screen.getByRole('button', { name: /save this/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /saved/i })).toBeDisabled();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('stays in unsaved state when save throws', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('fail'));
    render(<AiChatPanel
      messages={[{ role: 'ai', content: 'Hotel picks', canSave: true, category: 'hotel' }]}
      thinking={false}
      onSaveRecommendation={onSave}
    />);
    fireEvent.click(screen.getByRole('button', { name: /save this/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    // After failure, button is still "Save this", not "Saved"
    expect(screen.getByRole('button', { name: /save this/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^saved$/i })).not.toBeInTheDocument();
  });

  it('renders relative timestamp on AI messages', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    render(<AiChatPanel
      messages={[{ role: 'ai', content: 'Advice', created_at: fiveMinutesAgo }]}
      thinking={false}
    />);
    expect(screen.getByText(/minutes? ago/i)).toBeInTheDocument();
  });

  it('renders "Cached" pill when message has cached: true', () => {
    render(<AiChatPanel
      messages={[{ role: 'ai', content: 'Cached advice', cached: true, created_at: new Date().toISOString() }]}
      thinking={false}
    />);
    expect(screen.getByText('Cached')).toBeInTheDocument();
  });

  it('does not render "Cached" pill on fresh messages', () => {
    render(<AiChatPanel
      messages={[{ role: 'ai', content: 'Fresh advice', cached: false, created_at: new Date().toISOString() }]}
      thinking={false}
    />);
    expect(screen.queryByText('Cached')).not.toBeInTheDocument();
  });

  it('does not render timestamp on user messages', () => {
    render(<AiChatPanel
      messages={[{ role: 'user', content: 'Hello', created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() }]}
      thinking={false}
    />);
    expect(screen.queryByText(/minutes? ago/i)).not.toBeInTheDocument();
  });
});
