import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px 16px', background: 'var(--color-bg)' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ width: 64, height: 64, background: 'var(--color-primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '1.75rem' }}>
          🛡️
        </div>
        <h1 style={{ color: 'var(--color-primary)', fontSize: '2rem', marginBottom: 12 }}>ClaimPath</h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--color-muted)', marginBottom: 8 }}>We're here to help.</p>
        <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted)', marginBottom: 40, lineHeight: 1.7 }}>
          Filing a death benefit claim is one of the hardest things you'll do.<br />
          We've made it as simple as possible. This takes about 10 minutes.
        </p>
        <div className="stack stack-md">
          <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/claim/lookup')}>
            File a Death Benefit Claim
          </button>
          <button className="btn btn-outline btn-full" onClick={() => navigate('/claim/status')}>
            Check Claim Status
          </button>
        </div>
        <p className="text-muted mt-24" style={{ fontSize: '0.8125rem' }}>
          Your progress is saved automatically. You can return at any time.
        </p>
        <div className="divider" style={{ margin: '32px 0' }} />
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/adjuster/login')} style={{ color: 'var(--color-muted)' }}>
          Adjuster Portal →
        </button>
      </div>
    </div>
  )
}
