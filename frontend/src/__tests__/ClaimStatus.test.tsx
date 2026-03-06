import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import ClaimStatus from '../pages/ClaimStatus'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

vi.mock('../hooks/useClaim', () => ({
  useClaimStatus: () => ({
    check: vi.fn(),
    loading: false,
    error: null,
  }),
}))

function renderClaimStatus() {
  return render(
    <MemoryRouter>
      <ClaimStatus />
    </MemoryRouter>
  )
}

describe('ClaimStatus', () => {
  it('renders the page title', () => {
    renderClaimStatus()
    expect(screen.getByText('Check Claim Status')).toBeInTheDocument()
  })

  it('renders claim number input', () => {
    renderClaimStatus()
    expect(screen.getByPlaceholderText('CLM-2026-00001')).toBeInTheDocument()
  })

  it('renders email input', () => {
    renderClaimStatus()
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    renderClaimStatus()
    expect(screen.getByText('Check Status')).toBeInTheDocument()
  })

  it('shows instructions text', () => {
    renderClaimStatus()
    expect(screen.getByText(/Enter your claim number and email/)).toBeInTheDocument()
  })
})
