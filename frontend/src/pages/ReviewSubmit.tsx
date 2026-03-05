import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubmitClaim } from '../hooks/useClaim'
import { useClaim } from '../contexts/ClaimContext'
import StepIndicator from '../components/StepIndicator'

export default function ReviewSubmit() {
  const navigate = useNavigate()
  const { draft, setDraft } = useClaim()
  const { submitClaim, loading, error } = useSubmitClaim()
  const [agreed, setAgreed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.claim_id) return
    const result = await submitClaim(draft.claim_id)
    if (result) {
      setDraft({ claim_number: result.claim_number })
      navigate('/claim/confirmation')
    }
  }

  const rows = [
    ['Policy Number', draft.policy_number],
    ['Insured Name', draft.insured_name],
    ['Your Name', draft.beneficiary_name],
    ['Your Email', draft.beneficiary_email],
    ['Your Phone', draft.beneficiary_phone],
    ['Relationship', draft.beneficiary_relationship],
    ['Date of Death', draft.date_of_death],
    ['Manner of Death', draft.manner_of_death],
    ['Payout Method', draft.payout_method?.replace('_', ' ')],
    ['Bank Account', draft.bank_account ? `****${draft.bank_account.slice(-4)}` : '—'],
  ]

  return (
    <div className="page">
      <StepIndicator currentStep={7} />
      <div className="page-header">
        <h1>Review & Submit</h1>
        <p>Please review your information before submitting.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card stack stack-sm mb-16">
          {rows.filter(([, v]) => v).map(([label, value]) => (
            <div key={label as string} className="d-flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.9375rem' }}>
              <span className="text-muted">{label}</span>
              <strong style={{ textAlign: 'right', maxWidth: '60%', textTransform: 'capitalize' }}>{value as string}</strong>
            </div>
          ))}
          <div className="d-flex justify-between" style={{ padding: '8px 0', fontSize: '0.9375rem' }}>
            <span className="text-muted">Documents</span>
            <strong style={{ color: 'var(--color-success)' }}>✅ Death Certificate</strong>
          </div>
          <div className="d-flex justify-between" style={{ padding: '8px 0', fontSize: '0.9375rem' }}>
            <span className="text-muted">Identity</span>
            <strong style={{ color: 'var(--color-success)' }}>✅ Verified</strong>
          </div>
        </div>

        <div className="card mb-16">
          <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontWeight: 400, cursor: 'pointer' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
              By submitting this claim, I certify that the information provided is accurate and complete to the best of my knowledge.
            </span>
          </label>
        </div>

        {error && <p className="error-msg mb-8">{error}</p>}

        <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={!agreed || loading}>
          {loading ? <><span className="spinner" /> Submitting...</> : 'Submit Claim'}
        </button>
      </form>
    </div>
  )
}
