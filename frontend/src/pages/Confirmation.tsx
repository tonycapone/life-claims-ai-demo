import { useClaim } from '../contexts/ClaimContext'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  { label: 'Claim Received', status: 'complete' as const },
  { label: 'Under Review', status: 'current' as const },
  { label: 'Decision', status: 'pending' as const },
  { label: 'Payout', status: 'pending' as const },
]

export default function Confirmation() {
  const { draft } = useClaim()
  const navigate = useNavigate()

  return (
    <div className="page">
      <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
        <div style={{ fontSize: '4rem', marginBottom: 12 }}>🎉</div>
        <h1 style={{ marginBottom: 8 }}>Claim Submitted</h1>
        <p className="text-muted">Your claim has been submitted successfully.</p>
      </div>

      <div className="card mb-16">
        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>Your claim number</p>
        <h2 style={{ color: 'var(--color-primary)', letterSpacing: '0.05em' }}>{draft.claim_number || 'CLM-2026-00001'}</h2>
        <p className="text-muted mt-8" style={{ fontSize: '0.875rem' }}>Save this number to check your claim status later.</p>
      </div>

      <div className="card mb-16">
        <h3 style={{ marginBottom: 20 }}>What Happens Next</h3>
        <div className="timeline">
          {STEPS.map((s) => (
            <div key={s.label} className="timeline-item">
              <div className={`timeline-dot timeline-dot-${s.status}`}>
                {s.status === 'complete' ? '✓' : s.status === 'current' ? '⏳' : '○'}
              </div>
              <div className="timeline-content">
                <h4>{s.label}</h4>
                {s.status === 'complete' && <p>Received on {new Date().toLocaleDateString()}</p>}
                {s.status === 'current' && <p>Our team is reviewing your claim</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="alert alert-info mb-16">
        <span>📧</span>
        <div>We'll email you at <strong>{draft.beneficiary_email}</strong> with status updates.</div>
      </div>

      <p className="text-muted text-center" style={{ fontSize: '0.875rem', marginBottom: 16 }}>
        Standard claims are typically resolved within <strong>14–30 days</strong>.
      </p>

      <button className="btn btn-outline btn-full" onClick={() => navigate('/claim/status')}>
        Check Claim Status
      </button>
    </div>
  )
}
