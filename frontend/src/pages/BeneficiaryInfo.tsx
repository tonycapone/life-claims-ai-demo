import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUpdateClaim } from '../hooks/useClaim'
import { useClaim } from '../contexts/ClaimContext'
import StepIndicator from '../components/StepIndicator'

export default function BeneficiaryInfo() {
  const navigate = useNavigate()
  const { draft, setDraft } = useClaim()
  const { updateClaim, loading } = useUpdateClaim()

  const [name, setName] = useState(draft.beneficiary_name || '')
  const [email, setEmail] = useState(draft.beneficiary_email || '')
  const [phone, setPhone] = useState(draft.beneficiary_phone || '')
  const [rel, setRel] = useState(draft.beneficiary_relationship || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = { beneficiary_name: name, beneficiary_email: email, beneficiary_phone: phone, beneficiary_relationship: rel }
    setDraft({ ...data, current_step: 3 })
    if (draft.claim_id) await updateClaim(draft.claim_id, data)
    navigate('/claim/death-info')
  }

  return (
    <div className="page">
      <StepIndicator currentStep={2} />
      <div className="page-header">
        <h1>Your Information</h1>
        <p>We need a few details about you — the person filing this claim.</p>
      </div>
      <form onSubmit={handleSubmit} className="card stack stack-md">
        <div className="form-group">
          <label>Your Full Legal Name</label>
          <input type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input type="tel" placeholder="(555) 555-1234" value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Your Relationship to the Insured</label>
          <select value={rel} onChange={e => setRel(e.target.value)} required>
            <option value="">Select relationship</option>
            <option value="spouse">Spouse</option>
            <option value="child">Child</option>
            <option value="parent">Parent</option>
            <option value="sibling">Sibling</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> Saving...</> : 'Continue'}
        </button>
      </form>
    </div>
  )
}
