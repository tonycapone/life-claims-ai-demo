import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUpdateClaim } from '../hooks/useClaim'
import { useClaim } from '../contexts/ClaimContext'
import StepIndicator from '../components/StepIndicator'

export default function PayoutPrefs() {
  const navigate = useNavigate()
  const { draft, setDraft } = useClaim()
  const { updateClaim, loading } = useUpdateClaim()

  const [method, setMethod] = useState(draft.payout_method || 'lump_sum')
  const [routing, setRouting] = useState(draft.bank_routing || '')
  const [account, setAccount] = useState(draft.bank_account || '')
  const [accountConfirm, setAccountConfirm] = useState('')
  const [accountType, setAccountType] = useState(draft.bank_account_type || 'checking')
  const [holderName, setHolderName] = useState(draft.beneficiary_name || '')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (account !== accountConfirm) { setError('Account numbers do not match'); return }
    setError('')
    const data = {
      payout_method: method as import('../types/claim').PayoutMethod,
      bank_routing: routing,
      bank_account: account,
      bank_account_type: accountType as 'checking' | 'savings',
      current_step: 7,
    }
    setDraft(data)
    if (draft.claim_id) await updateClaim(draft.claim_id, { payout_method: method as import('../types/claim').PayoutMethod })
    navigate('/claim/review')
  }

  return (
    <div className="page">
      <StepIndicator currentStep={6} />
      <div className="page-header">
        <h1>Payout Preferences</h1>
        <p>How would you like to receive the death benefit?</p>
      </div>
      <form onSubmit={handleSubmit} className="card stack stack-md">
        <div className="form-group">
          <label>Payout Method</label>
          <div className="stack stack-sm">
            {[['lump_sum', 'Lump Sum (Recommended)', 'Full benefit paid at once'], ['structured', 'Structured Installments', 'Paid out over time — subject to carrier approval']].map(([val, label, desc]) => (
              <label key={val} style={{ display: 'flex', gap: 12, padding: '14px 16px', border: `1.5px solid ${method === val ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', background: method === val ? '#eff6ff' : 'white', fontWeight: 400 }}>
                <input type="radio" value={val} checked={method === val} onChange={() => setMethod(val as any)} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="divider" />
        <h4>Bank Account Information</h4>
        <div className="alert alert-info" style={{ fontSize: '0.875rem' }}>
          🔒 Your banking information is encrypted and only used for claim payout.
        </div>
        <div className="form-group">
          <label>Account Holder Name</label>
          <input type="text" value={holderName} onChange={e => setHolderName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Routing Number</label>
          <input type="text" maxLength={9} placeholder="123456789" value={routing} onChange={e => setRouting(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Account Number</label>
          <input type="password" placeholder="Account number" value={account} onChange={e => setAccount(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Confirm Account Number</label>
          <input type="password" placeholder="Confirm account number" value={accountConfirm} onChange={e => setAccountConfirm(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Account Type</label>
          <select value={accountType} onChange={e => setAccountType(e.target.value as any)}>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> Saving...</> : 'Continue'}
        </button>
      </form>
    </div>
  )
}
