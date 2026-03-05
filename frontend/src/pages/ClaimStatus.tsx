import { useState } from 'react'
import { useClaimStatus } from '../hooks/useClaim'
import { StatusBadge } from '../components/StatusBadge'
import type { Claim } from '../types/claim'

const STATUS_STEPS: Record<string, number> = {
  draft: 0, submitted: 1, under_review: 2, pending_documents: 2,
  contestability_review: 2, siu_review: 2, approved: 3, paid: 4, denied: 3,
}

export default function ClaimStatus() {
  const { getStatus, loading, error } = useClaimStatus()
  const [claimNumber, setClaimNumber] = useState('')
  const [email, setEmail] = useState('')
  const [claim, setClaim] = useState<Claim | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const result = await getStatus(claimNumber, email)
    if (result) setClaim(result)
  }

  const currentStep = claim ? STATUS_STEPS[claim.status] ?? 1 : 0
  const steps = ['Claim Received', 'Under Review', 'Decision', 'Payout']

  return (
    <div className="page">
      <div className="page-header">
        <h1>Check Claim Status</h1>
        <p>Enter your claim number and email to see the latest status.</p>
      </div>

      <form onSubmit={handleSearch} className="card mb-16 stack stack-sm">
        <div className="form-group">
          <label>Claim Number</label>
          <input type="text" placeholder="CLM-2026-00001" value={claimNumber}
            onChange={e => setClaimNumber(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Your Email Address</label>
          <input type="email" placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)} required />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> Looking up...</> : 'Check Status'}
        </button>
      </form>

      {claim && (
        <div className="card stack stack-md">
          <div className="d-flex justify-between align-center">
            <div>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>Claim Number</p>
              <h3>{claim.claim_number}</h3>
            </div>
            <StatusBadge status={claim.status} />
          </div>
          <div className="divider" style={{ margin: '4px 0' }} />
          <div className="timeline">
            {steps.map((s, i) => {
              const isComplete = i < currentStep
              const isCurrent = i === currentStep
              return (
                <div key={s} className="timeline-item">
                  <div className={`timeline-dot timeline-dot-${isComplete ? 'complete' : isCurrent ? 'current' : 'pending'}`}>
                    {isComplete ? '✓' : i + 1}
                  </div>
                  <div className="timeline-content">
                    <h4 style={{ color: isCurrent ? 'var(--color-accent)' : undefined }}>{s}</h4>
                    {isCurrent && <p>Currently in progress</p>}
                    {isComplete && <p>Completed</p>}
                  </div>
                </div>
              )
            })}
          </div>
          {claim.status === 'pending_documents' && (
            <div className="alert alert-warning">
              <span>⚠️</span>
              <div><strong>Action Required:</strong> Additional documents have been requested. Please upload them to continue.</div>
            </div>
          )}
          {claim.ai_summary && (
            <div className="alert alert-info">
              <span>ℹ️</span>
              <div>{claim.ai_summary}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
