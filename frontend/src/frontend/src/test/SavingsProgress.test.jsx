import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SavingsProgress from '../components/SavingsProgress'

const mockSavings = {
  amount_saved: 1000,
  monthly_savings_needed: 437,
  biweekly_savings_needed: 218,
  weekly_savings_needed: 109,
}

describe('SavingsProgress', () => {
  it('renders monthly savings', () => {
    render(<SavingsProgress savings={mockSavings} totalBudget={3500} />)
    expect(screen.getByText('$437')).toBeInTheDocument()
    expect(screen.getByText('per month')).toBeInTheDocument()
  })

  it('renders biweekly savings', () => {
    render(<SavingsProgress savings={mockSavings} totalBudget={3500} />)
    expect(screen.getByText('$218')).toBeInTheDocument()
    expect(screen.getByText('bi-weekly')).toBeInTheDocument()
  })

  it('renders weekly savings', () => {
    render(<SavingsProgress savings={mockSavings} totalBudget={3500} />)
    expect(screen.getByText('$109')).toBeInTheDocument()
    expect(screen.getByText('per week')).toBeInTheDocument()
  })

  it('renders saved amount and goal', () => {
    render(<SavingsProgress savings={mockSavings} totalBudget={3500} />)
    expect(screen.getByText('$1000 saved')).toBeInTheDocument()
    expect(screen.getByText('$3500 goal')).toBeInTheDocument()
  })

  it('renders progress bar', () => {
    const { container } = render(<SavingsProgress savings={mockSavings} totalBudget={3500} />)
    const progressBar = container.querySelector('.bg-\\[\\#0071e3\\]')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar.style.width).toBe('29%')
  })
})
