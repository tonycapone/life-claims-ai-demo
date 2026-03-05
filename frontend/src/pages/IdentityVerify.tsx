import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClaim } from '../contexts/ClaimContext'
import { useIdentityVerify } from '../hooks/useClaim'
import StepIndicator from '../components/StepIndicator'

type Step = 'id' | 'selfie' | 'verifying' | 'done'

export default function IdentityVerify() {
  const navigate = useNavigate()
  const { draft } = useClaim()
  const { verify } = useIdentityVerify()
  const [step, setStep] = useState<Step>('id')
  const [idUploaded, setIdUploaded] = useState(false)

  const handleIdUpload = () => {
    setIdUploaded(true)
    setTimeout(() => setStep('selfie'), 800)
  }

  const handleSelfie = () => {
    setStep('verifying')
    setTimeout(async () => {
      if (draft.claim_id) await verify(draft.claim_id)
      setStep('done')
    }, 2000)
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn--sm" style={{ color: 'white', padding: '0.25rem 0.5rem' }} onClick={() => navigate(-1)}>←</button>
        <span className="logo-text" style={{ color: 'white', fontSize: '1rem' }}>ClaimPath</span>
      </div>
      <StepIndicator currentStep={5} />

      <div className="page-content">
        <h2 style={{ marginBottom: '0.5rem' }}>Verify Your Identity</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
          We need to verify who you are to protect you and the estate.
        </p>

        {step === 'id' && (
          <>
            <div className="verify-step">
              <div className="verify-icon" style={{ background: '#dbeafe' }}>🪪</div>
              <div>
                <p className="font-medium">Step 1: Upload your ID</p>
                <p className="text-sm text-muted">Driver's license or passport</p>
              </div>
            </div>
            <div className="verify-step" style={{ opacity: 0.4 }}>
              <div className="verify-icon" style={{ background: '#f1f5f9' }}>🤳</div>
              <div>
                <p className="font-medium">Step 2: Take a selfie</p>
                <p className="text-sm text-muted">Quick liveness check</p>
              </div>
            </div>
            <button className="btn btn-primary btn--full" style={{ marginTop: '1rem' }} onClick={handleIdUpload}>
              {idUploaded ? '✓ ID Uploaded' : 'Upload ID Document'}
            </button>
          </>
        )}

        {step === 'selfie' && (
          <>
            <div className="verify-step" style={{ opacity: 0.4 }}>
              <div className="verify-icon" style={{ background: '#dcfce7' }}>✅</div>
              <div><p className="font-medium">ID uploaded</p></div>
            </div>
            <div className="verify-step">
              <div className="verify-icon" style={{ background: '#dbeafe' }}>🤳</div>
              <div>
                <p className="font-medium">Step 2: Take a selfie</p>
                <p className="text-sm text-muted">Hold your phone at face level and smile</p>
              </div>
            </div>
            <button className="btn btn-primary btn--full" style={{ marginTop: '1rem' }} onClick={handleSelfie}>
              Take Selfie
            </button>
          </>
        )}

        {step === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <span className="spinner spinner--lg" style={{ margin: '0 auto 1rem' }} />
            <p className="font-medium">Verifying your identity...</p>
            <p className="text-sm text-muted">This takes just a moment</p>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Identity Verified</h3>
            <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>Your identity has been confirmed.</p>
            <button className="btn btn-primary btn--full" onClick={() => navigate('/claim/payout')}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
