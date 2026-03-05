import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClaim } from '../contexts/ClaimContext'
import { useSubmitClaim } from '../hooks/useClaim'
import StepIndicator from '../components/StepIndicator'

export default function ReviewSubmit() {
  const navigate = useNavigate()
  const { draft, setDraft } = useClaim()
  const { submitClaim, loading, error } = useSubmitClaim()
  const [agreed, setAgreed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.claim_id) return
    const result = await submitClaim(draft.claim_id)
    if (result) {
      setDraft({ claim_number: result.claim_number })
      navigate('/claim/confirmation')
    }
  }

  const rows = [
    ['Policy', `#${draft.policy_number || '—'}`],
    ['Insured', draft.insured_name || '—'],
    ['Beneficiary', draft.beneficiary_name || '—'],
    ['Email', draft.beneficiary_email || '—'],
    ['Phone', draft.beneficiary_phone || '—'],
    ['Relationship', draft.beneficiary_relationship || '—'],
    ['Date of Death', draft.date_of_death || '—'],
    ['Manner', draft.manner_of_death || '—'],
    ['Cause', draft.cause_of_death || '—'],
    ['Payout', draft.payout_method?.replace('_', ' ') || '—'],
  ]

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn--sm" style={{ color: 'white', padding: '0.25rem 0.5rem' }} onClick={() => navigate(-1)}>←</button>
        <span className="logo-text" style={{ color: 'white', fontSize: '1rem' }}>ClaimPath</span>
      </div>
      <StepIndicator currentStep={7} />

      <div className="page-content">
        <h2 style={{ marginBottom: '0.5rem' }}>Review & Submit</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
          Please review your information before submitting.
        </p>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          {rows.map(([label, value]) => (
            <div key={label} className="extraction-row">
              <span className="extraction-label">{label}</span>
              <span className="extraction-value" style={{ textTransform: 'capitalize' }}>{value}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <label className="checkbox-option" style={{ marginBottom: '1.25rem', alignItems: 'flex-start' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <span className="text-sm">
              By submitting this claim, I certify that the information provided is accurate and complete
              to the best of my knowledge. I understand that providing false information may result in
              claim denial.
            </span>
          </label>

          {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

          <button type="submit" className="btn btn-primary btn--full btn--lg" disabled={!agreed || loading || !draft.claim_id}>
            {loading ? <><span className="spinner" />Submitting...</> : 'Submit Claim'}
          </button>
        </form>
      </div>
    </div>
  )
}
