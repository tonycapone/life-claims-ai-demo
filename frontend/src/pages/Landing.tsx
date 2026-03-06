import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = () => {
    installPrompt?.prompt()
    setShowBanner(false)
  }

  return (
    <div className="page">
      <div className="landing-hero">
        <div className="logo-mark" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div className="logo-icon" style={{ width: 52, height: 52, fontSize: '1.375rem' }}>CP</div>
          <span className="logo-text" style={{ color: 'white', fontSize: '1.5rem' }}>
            Claim<span style={{ color: '#93c5fd' }}>Path</span>
          </span>
        </div>
        <h1>We're here to help.</h1>
        <p style={{ marginTop: '0.75rem' }}>
          File a life insurance death benefit claim in about 10 minutes.
          Save your progress and come back anytime.
        </p>
      </div>

      <div className="landing-actions">
        <button
          className="btn btn-primary btn--full btn--lg"
          onClick={() => navigate('/claim/chat')}
        >
          File a Death Benefit Claim
        </button>
        <button
          className="btn btn-secondary btn--full btn--lg"
          onClick={() => navigate('/claim/status')}
        >
          Check Claim Status
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p className="text-muted text-sm">
            Questions? Call us at{' '}
            <a href="tel:18005246272">1-800-CLAIMPATH</a>
          </p>
          <p className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>
            Available Mon–Fri, 8am–8pm ET
          </p>
        </div>

        <div className="card" style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p className="text-sm text-muted">
            🔒 Your information is encrypted and secure. We take your privacy seriously.
          </p>
        </div>
      </div>

      {showBanner && (
        <div className="install-banner">
          <p>Add ClaimPath to your home screen for easy access.</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn--sm" onClick={handleInstall}>Install</button>
            <button className="btn btn-ghost btn--sm" style={{ color: 'rgba(255,255,255,0.7)' }} onClick={() => setShowBanner(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
