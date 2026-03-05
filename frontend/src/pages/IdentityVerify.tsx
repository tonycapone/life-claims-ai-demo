import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdentityVerify } from '../hooks/useClaim'
import { useClaim } from '../contexts/ClaimContext'
import StepIndicator from '../components/StepIndicator'

export default function IdentityVerify() {
  const navigate = useNavigate()
  const { draft, setDraft } = useClaim()
  const { verify } = useIdentityVerify()
  const [step, setStep] = useState<'id' | 'selfie' | 'verifying' | 'done'>('id')

  async function handleIdUploaded() { setStep('selfie') }

  async function handleSelfie() {
    setStep('verifying')
    setTimeout(async () => {
      if (draft.claim_id) await verify(draft.claim_id)
      setStep('done')
    }, 2000)
  }

  function handleContinue() {
    setDraft({ current_step: 6 })
    navigate('/claim/payout')
  }

  return (
    <div className="page">
      <StepIndicator currentStep={5} />
      <div className="page-header">
        <h1>Identity Verification</h1>
        <p>We need to verify your identity before processing the claim.</p>
      </div>

      {step === 'id' && (
        <div className="card stack stack-md">
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🪪</div>
            <h3 style={{ marginBottom: 8 }}>Upload Your Government ID</h3>
            <p className="text-muted" style={{ marginBottom: 24, fontSize: '0.9375rem' }}>
              Driver's license or passport. Front and back if driver's license.
            </p>
            <button className="btn btn-primary" onClick={handleIdUploaded}>
              Upload ID (Mock)
            </button>
          </div>
        </div>
      )}

      {step === 'selfie' && (
        <div className="card stack stack-md">
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤳</div>
            <h3 style={{ marginBottom: 8 }}>Take a Selfie</h3>
            <p className="text-muted" style={{ marginBottom: 24, fontSize: '0.9375rem' }}>
              We'll compare your selfie to your ID to confirm your identity.
            </p>
            <button className="btn btn-primary" onClick={handleSelfie}>
              Take Selfie (Mock)
            </button>
          </div>
        </div>
      )}

      {step === 'verifying' && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
          <p className="mt-16 fw-600">Verifying your identity...</p>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>This will only take a moment.</p>
        </div>
      )}

      {step === 'done' && (
        <div className="card stack stack-md" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem' }}>✅</div>
          <h3 style={{ color: 'var(--color-success)' }}>Identity Verified</h3>
          <p className="text-muted">Your identity has been successfully confirmed.</p>
          <button className="btn btn-primary btn-full btn-lg" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
