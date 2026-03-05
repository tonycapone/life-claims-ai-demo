import { useNavigate } from 'react-router-dom'
import { useClaim } from '../contexts/ClaimContext'
import { useUpdateClaim } from '../hooks/useClaim'
import StepIndicator from '../components/StepIndicator'

export default function PayoutPrefs() {
  const navigate = useNavigate()
  const { draft, setDraft } = useClaim()
  const { update, loading } = useUpdateClaim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (draft.claim_id) {
      await update(draft.claim_id, {
        payout_method: draft.payout_method,
        
        
      })
    }
    navigate('/claim/review')
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn--sm" style={{ color: 'white', padding: '0.25rem 0.5rem' }} onClick={() => navigate(-1)}>←</button>
        <span className="logo-text" style={{ color: 'white', fontSize: '1rem' }}>ClaimPath</span>
      </div>
      <StepIndicator currentStep={6} />

      <div className="page-content">
        <h2 style={{ marginBottom: '0.5rem' }}>Payout Preferences</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
          How would you like to receive the death benefit?
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Payment Method</label>
            <div className="radio-group">
              <label className="radio-option">
                <input type="radio" name="payout" value="lump_sum" checked={draft.payout_method === 'lump_sum'} onChange={() => setDraft({ payout_method: 'lump_sum' })} />
                <div>
                  <span className="font-medium">Lump Sum</span>
                  <p className="text-sm text-muted">Receive the full benefit at once (most common)</p>
                </div>
              </label>
              <label className="radio-option">
                <input type="radio" name="payout" value="structured" checked={draft.payout_method === 'structured'} onChange={() => setDraft({ payout_method: 'structured' })} />
                <div>
                  <span className="font-medium">Structured Installments</span>
                  <p className="text-sm text-muted">Subject to carrier approval</p>
                </div>
              </label>
            </div>
          </div>

          <div className="divider" />
          <p className="font-semibold" style={{ marginBottom: '0.75rem' }}>Bank Account Details</p>

          <div className="form-group">
            <label className="form-label required">Account Holder Name</label>
            <input className="form-input" placeholder={draft.beneficiary_name || 'Full name'} value={draft.beneficiary_name || ''} onChange={e => setDraft({ beneficiary_name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label required">Routing Number</label>
            <input className="form-input" placeholder="9-digit routing number" maxLength={9} value={draft.bank_routing || ''} onChange={e => setDraft({ bank_routing: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label required">Account Number</label>
            <input className="form-input" type="password" placeholder="Account number" value={draft.bank_account || ''} onChange={e => setDraft({ bank_account: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label required">Account Type</label>
            <select className="form-select" value={draft.bank_account_type || ''} onChange={e => setDraft({ bank_account_type: e.target.value as any })} required>
              <option value="">Select type</option>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>

          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            🔒 Your banking information is encrypted and only used for claim payout.
          </div>

          <button type="submit" className="btn btn-primary btn--full" disabled={loading}>
            {loading ? <><span className="spinner" />Saving...</> : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
