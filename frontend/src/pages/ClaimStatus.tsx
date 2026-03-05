import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClaimStatus } from '../hooks/useClaim'
import { StatusBadge } from '../components/StatusBadge'
import type { Claim } from '../types/claim'

const TRACKER_STEPS = ['Submitted', 'Under Review', 'Decision', 'Payout']

function statusToStep(status: Claim['status']): number {
  if (status === 'draft') return 0
  if (status === 'submitted') return 1
  if (['under_review', 'pending_documents', 'contestability_review', 'siu_review'].includes(status)) return 2
  if (status === 'approved' || status === 'denied') return 3
  if (status === 'paid') return 4
  return 1
}

export default function ClaimStatus() {
  const navigate = useNavigate()
  const { check, loading, error } = useClaimStatus()
  const [claimNumber, setClaimNumber] = useState('')
  const [email, setEmail] = useState('')
  const [claim, setClaim] = useState<Claim | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await check(claimNumber, email)
    if (result) setClaim(result)
  }

  const currentStep = claim ? statusToStep(claim.status) : 0

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn--sm" style={{ color: 'white', padding: '0.25rem 0.5rem' }} onClick={() => navigate('/')}>←</button>
        <span className="logo-text" style={{ color: 'white', fontSize: '1rem' }}>ClaimPath</span>
      </div>

      <div className="page-content">
        <h2 style={{ marginBottom: '0.5rem' }}>Check Claim Status</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
          Enter your claim number and email to see your claim status.
        </p>

        {!claim ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Claim Number</label>
              <input className="form-input" placeholder="CLM-2026-00001" value={claimNumber} onChange={e => setClaimNumber(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label required">Email Address</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
            <button type="submit" className="btn btn-primary btn--full" disabled={loading}>
              {loading ? <><span className="spinner" />Looking up...</> : 'Check Status'}
            </button>
          </form>
        ) : (
          <div>
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="font-semibold">{claim.claim_number}</span>
                <StatusBadge status={claim.status} />
              </div>
              <p className="text-sm text-muted">Insured: {claim.insured_name}</p>
              {claim.date_of_death && <p className="text-sm text-muted">Date of death: {claim.date_of_death}</p>}
            </div>

            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <p className="card-title">Claim Progress</p>
              <div className="claim-tracker">
                {TRACKER_STEPS.map((label, i) => {
                  const step = i + 1
                  const isComplete = step < currentStep
                  const isActive = step === currentStep
                  return (
                    <div key={label} className={`tracker-step ${isComplete ? 'tracker-step--complete' : ''}`}>
                      <div className={`tracker-icon ${isComplete ? 'tracker-icon--complete' : isActive ? 'tracker-icon--active' : ''}`}>
                        {isComplete ? <span style={{ color: 'white' }}>✓</span>
                         : isActive ? <span style={{ color: 'white' }}>⏳</span>
                         : <span style={{ color: 'var(--color-muted)' }}>{step}</span>}
                      </div>
                      <div className="tracker-text">
                        <h4>{label}</h4>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <button className="btn btn-secondary btn--full" onClick={() => setClaim(null)}>
              Check another claim
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
