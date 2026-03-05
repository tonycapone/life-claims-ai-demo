import { useNavigate } from 'react-router-dom'
import { useClaim } from '../contexts/ClaimContext'
import { useCreateClaim, useUpdateClaim } from '../hooks/useClaim'
import StepIndicator from '../components/StepIndicator'

const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other']

export default function BeneficiaryInfo() {
  const navigate = useNavigate()
  const { draft, setDraft } = useClaim()
  const { create, loading: creating } = useCreateClaim()
  const { update, loading: updating } = useUpdateClaim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (draft.claim_id) {
      await update(draft.claim_id, {
        beneficiary_name: draft.beneficiary_name,
        beneficiary_email: draft.beneficiary_email,
        beneficiary_phone: draft.beneficiary_phone,
        beneficiary_relationship: draft.beneficiary_relationship,
      })
    } else {
      const claim = await create({
        policy_number: draft.policy_number!,
        insured_name: draft.insured_name || '',
        beneficiary_name: draft.beneficiary_name,
        beneficiary_email: draft.beneficiary_email,
        beneficiary_phone: draft.beneficiary_phone,
        beneficiary_relationship: draft.beneficiary_relationship,
      })
      if (claim) {
        setDraft({ claim_id: claim.id, claim_number: claim.claim_number })
      }
    }
    navigate('/claim/death-info')
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn--sm" style={{ color: 'white', padding: '0.25rem 0.5rem' }} onClick={() => navigate(-1)}>←</button>
        <div className="logo-mark">
          <span className="logo-text" style={{ color: 'white', fontSize: '1rem' }}>ClaimPath</span>
        </div>
      </div>
      <StepIndicator currentStep={2} />

      <div className="page-content">
        <h2 style={{ marginBottom: '0.5rem' }}>Your Information</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>Tell us about yourself — the person filing this claim.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Your Full Legal Name</label>
            <input className="form-input" placeholder="Jane Smith" value={draft.beneficiary_name || ''} onChange={e => setDraft({ beneficiary_name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label required">Email Address</label>
            <input className="form-input" type="email" placeholder="jane@email.com" value={draft.beneficiary_email || ''} onChange={e => setDraft({ beneficiary_email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label required">Phone Number</label>
            <input className="form-input" type="tel" placeholder="(555) 000-0000" value={draft.beneficiary_phone || ''} onChange={e => setDraft({ beneficiary_phone: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label required">Your Relationship to the Insured</label>
            <select className="form-select" value={draft.beneficiary_relationship || ''} onChange={e => setDraft({ beneficiary_relationship: e.target.value })} required>
              <option value="">Select relationship</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn--full" disabled={creating || updating}>
            {(creating || updating) ? <><span className="spinner" />Saving...</> : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
