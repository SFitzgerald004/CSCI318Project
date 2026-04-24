import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from '../components/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders full-screen by default', () => {
    const { container } = render(<LoadingSpinner />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('min-h-screen')
  })

  it('renders inline when prop is true', () => {
    const { container } = render(<LoadingSpinner inline />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('py-12')
    expect(wrapper.className).not.toContain('min-h-screen')
  })

  it('contains a spinning element', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
})
