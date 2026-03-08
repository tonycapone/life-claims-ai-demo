import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ClaimProvider, useClaim } from '../contexts/ClaimContext'

function TestConsumer() {
  const { draft, setDraft, clearDraft } = useClaim()
  return (
    <div>
      <span data-testid="policy">{draft.policy_number || 'none'}</span>
      <span data-testid="name">{draft.beneficiary_name || 'none'}</span>
      <button onClick={() => setDraft({ policy_number: 'LT-12345' })}>Set Policy</button>
      <button onClick={() => setDraft({ beneficiary_name: 'Jane Doe' })}>Set Name</button>
      <button onClick={() => clearDraft()}>Clear</button>
    </div>
  )
}

describe('ClaimContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides empty draft by default', () => {
    render(
      <ClaimProvider>
        <TestConsumer />
      </ClaimProvider>
    )
    expect(screen.getByTestId('policy')).toHaveTextContent('none')
  })

  it('updates draft with setDraft', async () => {
    render(
      <ClaimProvider>
        <TestConsumer />
      </ClaimProvider>
    )
    await userEvent.click(screen.getByText('Set Policy'))
    expect(screen.getByTestId('policy')).toHaveTextContent('LT-12345')
  })

  it('merges partial updates without losing existing fields', async () => {
    render(
      <ClaimProvider>
        <TestConsumer />
      </ClaimProvider>
    )
    await userEvent.click(screen.getByText('Set Policy'))
    await userEvent.click(screen.getByText('Set Name'))
    expect(screen.getByTestId('policy')).toHaveTextContent('LT-12345')
    expect(screen.getByTestId('name')).toHaveTextContent('Jane Doe')
  })

  it('clears draft', async () => {
    render(
      <ClaimProvider>
        <TestConsumer />
      </ClaimProvider>
    )
    await userEvent.click(screen.getByText('Set Policy'))
    expect(screen.getByTestId('policy')).toHaveTextContent('LT-12345')
    await userEvent.click(screen.getByText('Clear'))
    expect(screen.getByTestId('policy')).toHaveTextContent('none')
  })

  it('persists draft to localStorage', async () => {
    render(
      <ClaimProvider>
        <TestConsumer />
      </ClaimProvider>
    )
    await userEvent.click(screen.getByText('Set Policy'))
    const stored = JSON.parse(localStorage.getItem('claim_draft') || '{}')
    expect(stored.policy_number).toBe('LT-12345')
  })

  it('restores draft from localStorage on mount', () => {
    localStorage.setItem('claim_draft', JSON.stringify({ policy_number: 'LT-99999' }))
    render(
      <ClaimProvider>
        <TestConsumer />
      </ClaimProvider>
    )
    expect(screen.getByTestId('policy')).toHaveTextContent('LT-99999')
  })

  it('throws when useClaim is used outside ClaimProvider', () => {
    // Suppress React error boundary console noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useClaim must be used within ClaimProvider')
    spy.mockRestore()
  })
})
