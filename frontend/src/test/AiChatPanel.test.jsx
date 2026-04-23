import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
