import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StepIndicator from '../components/StepIndicator'

describe('StepIndicator', () => {
  it('renders 7 step circles by default', () => {
    const { container } = render(<StepIndicator currentStep={1} />)
    const circles = container.querySelectorAll('.step-circle')
    expect(circles.length).toBe(7)
  })

  it('marks the current step as active', () => {
    const { container } = render(<StepIndicator currentStep={3} />)
    const circles = container.querySelectorAll('.step-circle')
    expect(circles[2]).toHaveClass('active')
  })

  it('marks previous steps as complete with checkmark', () => {
    const { container } = render(<StepIndicator currentStep={4} />)
    const circles = container.querySelectorAll('.step-circle')
    // Steps 1-3 should be complete
    expect(circles[0]).toHaveClass('complete')
    expect(circles[1]).toHaveClass('complete')
    expect(circles[2]).toHaveClass('complete')
    // Step 4 should be active, not complete
    expect(circles[3]).toHaveClass('active')
    expect(circles[3]).not.toHaveClass('complete')
  })

  it('shows step numbers for incomplete steps', () => {
    render(<StepIndicator currentStep={2} />)
    // Steps after current should show their number
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('respects custom totalSteps', () => {
    const { container } = render(<StepIndicator currentStep={1} totalSteps={4} />)
    const circles = container.querySelectorAll('.step-circle')
    expect(circles.length).toBe(4)
  })

  it('renders connecting lines between steps', () => {
    const { container } = render(<StepIndicator currentStep={1} />)
    const lines = container.querySelectorAll('.step-line')
    // 7 steps = 6 lines between them
    expect(lines.length).toBe(6)
  })

  it('marks lines as complete for passed steps', () => {
    const { container } = render(<StepIndicator currentStep={3} />)
    const lines = container.querySelectorAll('.step-line')
    expect(lines[0]).toHaveClass('complete')
    expect(lines[1]).toHaveClass('complete')
    expect(lines[2]).not.toHaveClass('complete')
  })
})
