import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ToolBadgeRow from '../components/ToolBadgeRow';

describe('<ToolBadgeRow>', () => {
  it('renders nothing when toolsUsed is empty', () => {
    const { container } = render(<ToolBadgeRow toolsUsed={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when toolsUsed is undefined', () => {
    const { container } = render(<ToolBadgeRow />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one badge per tool with human labels', () => {
    render(<ToolBadgeRow toolsUsed={['get_saved_recommendations', 'calculate_daily_spend']} />);
    expect(screen.getByText('Checked your saved items')).toBeInTheDocument();
    expect(screen.getByText('Calculated daily spend')).toBeInTheDocument();
  });

  it('deduplicates repeated tool names', () => {
    render(<ToolBadgeRow toolsUsed={['get_saved_recommendations', 'get_saved_recommendations']} />);
    const badges = screen.getAllByText('Checked your saved items');
    expect(badges).toHaveLength(1);
  });

  it('falls back to raw tool name when not in label map', () => {
    render(<ToolBadgeRow toolsUsed={['unknown_tool_name']} />);
    expect(screen.getByText('unknown_tool_name')).toBeInTheDocument();
  });

  it('applies tool-called badge variant', () => {
    const { container } = render(<ToolBadgeRow toolsUsed={['calculate_daily_spend']} />);
    expect(container.querySelector('span').className).toMatch(/text-apple-blue/);
  });
});
