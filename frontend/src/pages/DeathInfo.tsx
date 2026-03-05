import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUpdateClaim } from '../hooks/useClaim'
import { useClaim } from '../contexts/ClaimContext'
import StepIndicator from '../components/StepIndicator'

export default function DeathInfo() {
  const navigate = useNavigate()
  const { draft, setDraft } = useClaim()
  const { updateClaim, loading } = useUpdateClaim()

  const [dod, setDod] = useState(draft.date_of_death || '')
  const [manner, setManner] = useState<import('../types/claim').MannerOfDeath | ''>(draft.manner_of_death || '')
  const [inUs, setInUs] = useState<boolean>(draft.death_in_us !== false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = { date_of_death: dod, manner_of_death: manner as import('../types/claim').MannerOfDeath || undefined, death_in_us: inUs }
    setDraft({ ...data, current_step: 4 })
    if (draft.claim_id) await updateClaim(draft.claim_id, { date_of_death: dod, manner_of_death: manner })
    navigate('/claim/documents')
  }

  return (
    <div className="page">
      <StepIndicator currentStep={3} />
      <div className="page-header">
        <h1>Death Information</h1>
        <p>We're sorry for your loss. We just need a few details to get started.</p>
      </div>
      <form onSubmit={handleSubmit} className="card stack stack-md">
        <div className="form-group">
          <label>Date of Death</label>
          <input type="date" value={dod} max={new Date().toISOString().split('T')[0]}
            onChange={e => setDod(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Manner of Death</label>
          <select value={manner} onChange={e => setManner(e.target.value)} required>
            <option value="">Select manner</option>
            <option value="natural">Natural causes / illness</option>
            <option value="accident">Accident</option>
            <option value="undetermined">Undetermined</option>
          </select>
        </div>
        <div className="form-group">
          <label>Did the death occur within the United States?</label>
          <div className="cluster">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400 }}>
              <input type="radio" checked={inUs} onChange={() => setInUs(true)} /> Yes
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400 }}>
              <input type="radio" checked={!inUs} onChange={() => setInUs(false)} /> No
            </label>
          </div>
          {!inUs && (
            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 8 }}>
              Additional documentation may be required for deaths occurring outside the US.
            </p>
          )}
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> Saving...</> : 'Continue'}
        </button>
      </form>
    </div>
  )
}
