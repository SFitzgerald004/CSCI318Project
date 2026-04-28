import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AiInsightCard from '../components/AiInsightCard'

describe('AiInsightCard', () => {
  it('renders title and description', () => {
    render(<AiInsightCard icon="📊" title="Analyze Budget" description="Get feedback" onClick={() => {}} />)
    expect(screen.getByText('Analyze Budget')).toBeInTheDocument()
    expect(screen.getByText('Get feedback')).toBeInTheDocument()
  })

  it('renders icon', () => {
    render(<AiInsightCard icon="📊" title="Test" description="Desc" onClick={() => {}} />)
    expect(screen.getByText('📊')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<AiInsightCard icon="📊" title="Test" description="Desc" onClick={handleClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('shows Thinking... when loading', () => {
    render(<AiInsightCard icon="📊" title="Test" description="Desc" onClick={() => {}} loading />)
    expect(screen.getByText('Thinking...')).toBeInTheDocument()
  })

  it('is disabled when loading', () => {
    render(<AiInsightCard icon="📊" title="Test" description="Desc" onClick={() => {}} loading />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
