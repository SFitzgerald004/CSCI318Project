import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SparklesIcon } from '@heroicons/react/24/outline'
import AiInsightCard from '../components/AiInsightCard'

describe('AiInsightCard', () => {
  it('renders title and description', () => {
    render(<AiInsightCard icon={SparklesIcon} title="Analyze Budget" description="Get feedback" onClick={() => {}} />)
    expect(screen.getByText('Analyze Budget')).toBeInTheDocument()
    expect(screen.getByText('Get feedback')).toBeInTheDocument()
  })

  it('renders icon as SVG when passed a Heroicon component', () => {
    render(<AiInsightCard icon={SparklesIcon} title="Test" description="Desc" onClick={() => {}} />)
    expect(document.querySelector('svg')).not.toBeNull()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<AiInsightCard icon={SparklesIcon} title="Test" description="Desc" onClick={handleClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('shows pulsing dots when loading', () => {
    render(<AiInsightCard icon={SparklesIcon} title="Test" description="Desc" onClick={() => {}} loading />)
    // Description text should not appear; pulsing dots span should be present
    expect(screen.queryByText('Desc')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.bg-apple-blue.rounded-full').length).toBeGreaterThan(0)
  })

  it('is disabled when loading', () => {
    render(<AiInsightCard icon={SparklesIcon} title="Test" description="Desc" onClick={() => {}} loading />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
