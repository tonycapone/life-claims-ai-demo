import { useNavigate } from 'react-router-dom'
import { useClaim } from '../contexts/ClaimContext'
import { useUpdateClaim } from '../hooks/useClaim'
import StepIndicator from '../components/StepIndicator'

export default function DeathInfo() {
  const navigate = useNavigate()
  const { draft, setDraft } = useClaim()
  const { update, loading } = useUpdateClaim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (draft.claim_id) {
      await update(draft.claim_id, {
        date_of_death: draft.date_of_death,
        cause_of_death: draft.cause_of_death,
        manner_of_death: draft.manner_of_death,
      })
    }
    navigate('/claim/documents')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn--sm" style={{ color: 'white', padding: '0.25rem 0.5rem' }} onClick={() => navigate(-1)}>←</button>
        <span className="logo-text" style={{ color: 'white', fontSize: '1rem' }}>ClaimPath</span>
      </div>
      <StepIndicator currentStep={3} />

      <div className="page-content">
        <h2 style={{ marginBottom: '0.5rem' }}>About the Passing</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
          We're sorry for your loss. We just need a few details to get started.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Date of Death</label>
            <input className="form-input" type="date" max={today} value={draft.date_of_death || ''} onChange={e => setDraft({ date_of_death: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label required">Manner of Death</label>
            <select className="form-select" value={draft.manner_of_death || ''} onChange={e => setDraft({ manner_of_death: e.target.value as any })} required>
              <option value="">Select manner</option>
              <option value="natural">Natural causes / illness</option>
              <option value="accident">Accident</option>
              <option value="undetermined">Undetermined</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cause of Death (as listed on death certificate)</label>
            <input className="form-input" placeholder="e.g. Acute myocardial infarction" value={draft.cause_of_death || ''} onChange={e => setDraft({ cause_of_death: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Did the death occur within the United States?</label>
            <div className="radio-group" style={{ marginTop: '0.375rem' }}>
              {[{ val: true, label: 'Yes' }, { val: false, label: 'No — additional documentation may be required' }].map(({ val, label }) => (
                <label key={String(val)} className="radio-option">
                  <input type="radio" name="death_in_us" checked={draft.death_in_us === val} onChange={() => setDraft({ death_in_us: val })} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn--full" disabled={loading}>
            {loading ? <><span className="spinner" />Saving...</> : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
