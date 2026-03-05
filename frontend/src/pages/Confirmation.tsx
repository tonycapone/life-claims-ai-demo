import { useNavigate } from 'react-router-dom'
import { useClaim } from '../contexts/ClaimContext'

const TRACKER_STEPS = [
  { label: 'Claim Received', desc: 'Your claim has been submitted successfully.', status: 'complete' },
  { label: 'Under Review', desc: 'Our team is reviewing your claim.', status: 'active' },
  { label: 'Decision', desc: 'Approval, denial, or request for more info.', status: 'pending' },
  { label: 'Payout', desc: 'Funds disbursed to your account.', status: 'pending' },
]

export default function Confirmation() {
  const { draft, clearDraft } = useClaim()
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <span className="logo-text" style={{ color: 'white', fontSize: '1rem' }}>ClaimPath</span>
      </div>

      <div className="page-content">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Claim Submitted</h2>
          <p className="text-muted">Your claim number is:</p>
          <p className="font-bold" style={{ fontSize: '1.375rem', color: 'var(--color-primary)', letterSpacing: '0.05em', marginTop: '0.25rem' }}>
            {draft.claim_number || 'CLM-2026-XXXXX'}
          </p>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p className="card-title">What happens next</p>
          <div className="claim-tracker">
            {TRACKER_STEPS.map((s, i) => (
              <div key={s.label} className={`tracker-step ${s.status === 'complete' ? 'tracker-step--complete' : ''}`}>
                <div className={`tracker-icon ${s.status === 'complete' ? 'tracker-icon--complete' : s.status === 'active' ? 'tracker-icon--active' : ''}`}>
                  {s.status === 'complete' ? <span style={{ color: 'white' }}>✓</span>
                   : s.status === 'active' ? <span style={{ color: 'white' }}>⏳</span>
                   : <span style={{ color: 'var(--color-muted)' }}>{i + 1}</span>}
                </div>
                <div className="tracker-text">
                  <h4>{s.label}</h4>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
          We'll email updates to <strong>{draft.beneficiary_email || 'your email'}</strong>.
          Standard claims are typically resolved within 14–30 days.
        </div>

        <p className="text-sm text-muted text-center" style={{ marginBottom: '1rem' }}>
          Questions? Call <a href="tel:18005246272">1-800-CLAIMPATH</a> with your claim number.
        </p>

        <button
          className="btn btn-secondary btn--full"
          onClick={() => { clearDraft(); navigate('/') }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
