import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RecommendationCard from '../components/RecommendationCard'

const mockRec = {
  id: 'rec-1',
  name: 'Shinjuku Granbell Hotel',
  category: 'hotel',
  source: 'ai_generated',
  rating: 4.5,
  price_level: '$$$',
  description: 'Modern hotel in the heart of Shinjuku',
  address: '2-14-4 Kabukicho, Shinjuku',
  is_ai_pick: true,
}

describe('RecommendationCard', () => {
  it('renders recommendation name', () => {
    render(<RecommendationCard rec={mockRec} onDelete={() => {}} />)
    expect(screen.getByText('Shinjuku Granbell Hotel')).toBeInTheDocument()
  })

  it('renders category badge', () => {
    render(<RecommendationCard rec={mockRec} onDelete={() => {}} />)
    expect(screen.getByText('hotel')).toBeInTheDocument()
  })

  it('renders source badge', () => {
    render(<RecommendationCard rec={mockRec} onDelete={() => {}} />)
    expect(screen.getByText('ai generated')).toBeInTheDocument()
  })

  it('renders AI Pick badge when is_ai_pick is true', () => {
    render(<RecommendationCard rec={mockRec} onDelete={() => {}} />)
    expect(screen.getByText('AI Pick')).toBeInTheDocument()
  })

  it('does not render AI Pick badge when is_ai_pick is false', () => {
    render(<RecommendationCard rec={{ ...mockRec, is_ai_pick: false }} onDelete={() => {}} />)
    expect(screen.queryByText('AI Pick')).not.toBeInTheDocument()
  })

  it('renders rating', () => {
    render(<RecommendationCard rec={mockRec} onDelete={() => {}} />)
    expect(screen.getByText(/4.5/)).toBeInTheDocument()
  })

  it('renders price level', () => {
    render(<RecommendationCard rec={mockRec} onDelete={() => {}} />)
    expect(screen.getByText('$$$')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<RecommendationCard rec={mockRec} onDelete={() => {}} />)
    expect(screen.getByText('Modern hotel in the heart of Shinjuku')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', () => {
    const handleDelete = vi.fn()
    render(<RecommendationCard rec={mockRec} onDelete={handleDelete} />)
    const deleteBtn = screen.getByRole('button')
    fireEvent.click(deleteBtn)
    expect(handleDelete).toHaveBeenCalledOnce()
  })
})
