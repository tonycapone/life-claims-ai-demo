import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge, RiskBadge } from '../components/StatusBadge'
import StatusBadgeCombined from '../components/StatusBadge'

describe('StatusBadge', () => {
  it('renders the correct label for a known status', () => {
    render(<StatusBadge status="submitted" />)
    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })

  it('falls back to raw status string for unknown statuses', () => {
    render(<StatusBadge status="unknown_status" />)
    expect(screen.getByText('unknown_status')).toBeInTheDocument()
  })

  it('applies the correct CSS class based on status', () => {
    const { container } = render(<StatusBadge status="under_review" />)
    expect(container.querySelector('.badge-under-review')).toBeInTheDocument()
  })

  it('renders all known statuses', () => {
    const statuses = [
      ['draft', 'Draft'],
      ['submitted', 'Submitted'],
      ['approved', 'Approved'],
      ['denied', 'Denied'],
      ['paid', 'Paid'],
    ] as const
    for (const [status, label] of statuses) {
      const { unmount } = render(<StatusBadge status={status} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })
})

describe('RiskBadge', () => {
  it('renders risk level with icon', () => {
    render(<RiskBadge level="high" />)
    expect(screen.getByText(/high/)).toBeInTheDocument()
  })

  it('shows green icon for low risk', () => {
    render(<RiskBadge level="low" />)
    expect(screen.getByText(/🟢/)).toBeInTheDocument()
  })

  it('shows yellow icon for medium risk', () => {
    render(<RiskBadge level="medium" />)
    expect(screen.getByText(/🟡/)).toBeInTheDocument()
  })

  it('shows red icon for high risk', () => {
    render(<RiskBadge level="high" />)
    expect(screen.getByText(/🔴/)).toBeInTheDocument()
  })
})

describe('StatusBadgeCombined', () => {
  it('renders RiskBadge when risk is provided', () => {
    render(<StatusBadgeCombined risk="medium" />)
    expect(screen.getByText(/medium/)).toBeInTheDocument()
  })

  it('renders StatusBadge when only status is provided', () => {
    render(<StatusBadgeCombined status="approved" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('renders nothing when neither provided', () => {
    const { container } = render(<StatusBadgeCombined />)
    expect(container.innerHTML).toBe('')
  })
})
