import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePolicyLookup } from '../hooks/useClaim'
import { useClaim } from '../contexts/ClaimContext'
import StepIndicator from '../components/StepIndicator'

export default function PolicyLookup() {
  const navigate = useNavigate()
  const { setDraft } = useClaim()
  const { lookup, loading, error } = usePolicyLookup()
  const [mode, setMode] = useState<'number' | 'info'>('number')
  const [policyNumber, setPolicyNumber] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [ssn4, setSsn4] = useState('')
  const [result, setResult] = useState<any>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = mode === 'number'
      ? { policy_number: policyNumber }
      : { insured_name: name, insured_dob: dob, insured_ssn_last4: ssn4 }
    const data = await lookup(params)
    if (data) setResult(data)
  }

  function handleConfirm() {
    setDraft({
      policy_number: result.policy_number,
      insured_name: result.insured_name,
      insured_dob: result.insured_dob,
    })
    navigate('/claim/beneficiary')
  }

  return (
    <div>
      <nav className="navbar"><a href="/" className="navbar-brand">🛡️ ClaimPath</a></nav>
      <div className="page">
        <StepIndicator currentStep={1} />
        <div className="page-header">
          <h2>Find the Policy</h2>
          <p>We'll look up the life insurance policy to get started.</p>
        </div>

        {result ? (
          <div className="card">
            <div className="alert alert-success mb-16">We found a policy matching your information.</div>
            <div className="stack stack-sm">
              <div><span className="text-muted">Insured: </span><strong>{result.insured_name_masked}</strong></div>
              <div><span className="text-muted">Policy type: </span><strong style={{ textTransform: 'capitalize' }}>{result.policy_type?.replace('_', ' ')}</strong></div>
              <div><span className="text-muted">Status: </span><strong style={{ textTransform: 'capitalize' }}>{result.status}</strong></div>
            </div>
            <p className="mt-16 mb-16 text-muted" style={{ fontSize: '0.9375rem' }}>Is this the right policy?</p>
            <div className="cluster">
              <button className="btn btn-primary" onClick={handleConfirm}>Yes, continue</button>
              <button className="btn btn-outline" onClick={() => setResult(null)}>No, search again</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card">
            <div className="cluster mb-16">
              <button type="button" className={`btn btn-sm ${mode === 'number' ? 'btn-dark' : 'btn-outline'}`} onClick={() => setMode('number')}>I have the policy number</button>
              <button type="button" className={`btn btn-sm ${mode === 'info' ? 'btn-dark' : 'btn-outline'}`} onClick={() => setMode('info')}>I don't have the policy number</button>
            </div>

            {mode === 'number' ? (
              <div className="form-group">
                <label>Policy Number</label>
                <input className="input" placeholder="e.g. LT-29471" value={policyNumber} onChange={e => setPolicyNumber(e.target.value)} required />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Insured's Full Name</label>
                  <input className="input" placeholder="First and last name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Insured's Date of Birth</label>
                  <input className="input" type="date" value={dob} onChange={e => setDob(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Last 4 of SSN (optional)</label>
                  <input className="input" placeholder="1234" maxLength={4} value={ssn4} onChange={e => setSsn4(e.target.value)} />
                </div>
              </>
            )}

            {error && <div className="alert alert-danger mt-12">{error}</div>}
            <button className="btn btn-primary btn-full mt-16" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> Looking up…</> : 'Find Policy'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
