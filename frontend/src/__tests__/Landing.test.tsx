import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Landing from '../pages/Landing'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  )
}

describe('Landing', () => {
  it('renders the hero tagline', () => {
    renderLanding()
    expect(screen.getByText("We're here to help.")).toBeInTheDocument()
  })

  it('renders the File a Claim CTA', () => {
    renderLanding()
    expect(screen.getByText('File a Death Benefit Claim')).toBeInTheDocument()
  })

  it('renders the Check Status CTA', () => {
    renderLanding()
    expect(screen.getByText('Check Claim Status')).toBeInTheDocument()
  })

  it('navigates to /claim/chat when File Claim is clicked', async () => {
    renderLanding()
    await userEvent.click(screen.getByText('File a Death Benefit Claim'))
    expect(mockNavigate).toHaveBeenCalledWith('/claim/chat')
  })

  it('navigates to /claim/status when Check Status is clicked', async () => {
    renderLanding()
    await userEvent.click(screen.getByText('Check Claim Status'))
    expect(mockNavigate).toHaveBeenCalledWith('/claim/status')
  })

  it('shows the security notice', () => {
    renderLanding()
    expect(screen.getByText(/encrypted and secure/)).toBeInTheDocument()
  })

  it('shows contact information', () => {
    renderLanding()
    expect(screen.getByText(/1-800-CLAIMPATH/)).toBeInTheDocument()
  })
})
