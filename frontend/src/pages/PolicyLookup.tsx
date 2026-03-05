import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePolicyLookup } from '../hooks/useClaim'
import { useClaim } from '../contexts/ClaimContext'
import StepIndicator from '../components/StepIndicator'

export default function PolicyLookup() {
  const navigate = useNavigate()
  const { setDraft } = useClaim()
  const { lookup, loading, error } = usePolicyLookup()
  const [mode, setMode] = useState<'number' | 'name'>('number')
  const [policyNumber, setPolicyNumber] = useState('')
  const [insuredName, setInsuredName] = useState('')
  const [insuredDob, setInsuredDob] = useState('')
  const [ssnLast4, setSsnLast4] = useState('')
  const [found, setFound] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const params = mode === 'number'
      ? { policy_number: policyNumber }
      : { insured_name: insuredName, insured_dob: insuredDob, insured_ssn_last4: ssnLast4 }
    const result = await lookup(params)
    if (result) setFound(result)
  }

  const handleConfirm = () => {
    setDraft({
      policy_number: found.policy_number,
      insured_name: found.insured_name_masked,
    })
    navigate('/claim/beneficiary')
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="logo-mark">
          <div className="logo-icon" style={{ width: 28, height: 28, fontSize: '0.875rem' }}>CP</div>
          <span className="logo-text" style={{ color: 'white', fontSize: '1rem' }}>ClaimPath</span>
        </div>
      </div>
      <StepIndicator currentStep={1} />

      <div className="page-content">
        <h2 style={{ marginBottom: '0.5rem' }}>Find the Policy</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
          We're sorry for your loss. Let's start by finding the policy.
        </p>

        {!found ? (
          <form onSubmit={handleSubmit}>
            <div className="toggle-tabs" style={{ marginBottom: '1.25rem' }}>
              <button type="button" className={`toggle-tab ${mode === 'number' ? 'active' : ''}`} onClick={() => setMode('number')}>
                I have the policy number
              </button>
              <button type="button" className={`toggle-tab ${mode === 'name' ? 'active' : ''}`} onClick={() => setMode('name')}>
                I don't have it
              </button>
            </div>

            {mode === 'number' ? (
              <div className="form-group">
                <label className="form-label required">Policy Number</label>
                <input
                  className="form-input"
                  placeholder="e.g. LT-29471"
                  value={policyNumber}
                  onChange={e => setPolicyNumber(e.target.value)}
                  required
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label required">Insured's Full Name</label>
                  <input className="form-input" placeholder="John Smith" value={insuredName} onChange={e => setInsuredName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label required">Insured's Date of Birth</label>
                  <input className="form-input" type="date" value={insuredDob} onChange={e => setInsuredDob(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label required">Last 4 of SSN</label>
                  <input className="form-input" placeholder="1234" maxLength={4} value={ssnLast4} onChange={e => setSsnLast4(e.target.value)} required />
                </div>
              </>
            )}

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <button type="submit" className="btn btn-primary btn--full" disabled={loading}>
              {loading ? <><span className="spinner" />Looking up policy...</> : 'Find Policy'}
            </button>
          </form>
        ) : (
          <div>
            <div className="card extraction-card" style={{ marginBottom: '1.25rem' }}>
              <p className="text-sm text-muted" style={{ marginBottom: '0.75rem' }}>We found a policy for:</p>
              <p className="font-semibold text-lg" style={{ marginBottom: '0.25rem' }}>{found.insured_name_masked}</p>
              <p className="text-sm text-muted">{found.policy_type?.replace('_', ' ')} policy</p>
              <p className="text-sm text-muted">Policy #{found.policy_number}</p>
            </div>
            <p className="text-sm" style={{ marginBottom: '1rem' }}>Is this the right policy?</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary flex-1" onClick={handleConfirm}>Yes, continue</button>
              <button className="btn btn-secondary flex-1" onClick={() => setFound(null)}>No, search again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
