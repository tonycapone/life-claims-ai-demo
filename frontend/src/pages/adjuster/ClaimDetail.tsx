import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useClaimDetail } from '../../hooks/useAdjuster'
import { useAdjusterContext } from '../../contexts/AdjusterContext'
import { StatusBadge } from '../../components/StatusBadge'
import RiskCard from '../../components/adjuster/RiskCard'
import CopilotPanel from '../../components/adjuster/CopilotPanel'
import ActionModal from '../../components/adjuster/ActionModal'

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value == null || value === '') return null
  return (
    <div className="d-flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
      <span className="text-muted">{label}</span>
      <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{String(value)}</strong>
    </div>
  )
}

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { adjuster, clearAuth } = useAdjusterContext()
  const { fetchClaim, claim, loading } = useClaimDetail()
  const [showAction, setShowAction] = useState(false)

  useEffect(() => { if (id) fetchClaim(id) }, [id])

  const claimSummary = claim
    ? `Claim ${claim.claim_number} for ${claim.insured_name} (Policy #${claim.policy_number}), filed by ${claim.beneficiary_name || 'beneficiary'}. ` +
      (claim.date_of_death ? `Date of death: ${claim.date_of_death}. ` : '') +
      (claim.cause_of_death ? `Cause: ${claim.cause_of_death}. ` : '') +
      (claim.contestability_alert ? `⚠️ Policy is ${Math.round(claim.months_since_issue || 0)} months old — within 2-year contestability period. ` : '') +
      (claim.ai_summary || '')
    : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav className="navbar">
        <div className="d-flex align-center gap-16">
          <button className="btn btn-ghost btn-sm" style={{ color: '#fff' }} onClick={() => navigate('/adjuster/queue')}>
            ← Queue
          </button>
          <span className="navbar-brand">🛡️ ClaimPath</span>
        </div>
        <div className="d-flex align-center gap-12">
          <span style={{ color: 'rgba(255,255,255,.7)', fontSize: '0.875rem' }}>{adjuster?.full_name}</span>
          <button className="btn btn-sm btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}
            onClick={() => { clearAuth(); navigate('/adjuster/login') }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div className="adjuster-page">
        <div style={{ maxWidth: 'var(--max-width-wide)', margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 64 }}>
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          ) : claim ? (
            <>
              <div className="d-flex justify-between align-center mb-24">
                <div>
                  <h2 style={{ marginBottom: 4 }}>{claim.claim_number}</h2>
                  <StatusBadge status={claim.status} />
                </div>
                <button className="btn btn-primary" onClick={() => setShowAction(true)}>
                  Take Action
                </button>
              </div>

              <div className="claim-detail-layout">
                {/* Left column */}
                <div>
                  <RiskCard claim={claim} />

                  <div className="card mb-16">
                    <h4 style={{ marginBottom: 16 }}>Policy Information</h4>
                    <div className="stack">
                      <Row label="Policy Number" value={claim.policy_number} />
                      <Row label="Insured Name" value={claim.insured_name} />
                      <Row label="Date of Birth" value={claim.insured_dob} />
                      <Row label="Issue Date" value={claim.policy_issue_date} />
                      <Row label="Policy Age" value={claim.months_since_issue ? `${Math.round(claim.months_since_issue)} months` : undefined} />
                      <Row label="Face Amount" value={claim.face_amount ? `$${claim.face_amount.toLocaleString()}` : undefined} />
                    </div>
                  </div>

                  <div className="card mb-16">
                    <h4 style={{ marginBottom: 16 }}>Beneficiary Information</h4>
                    <div className="stack">
                      <Row label="Name" value={claim.beneficiary_name} />
                      <Row label="Email" value={claim.beneficiary_email} />
                      <Row label="Phone" value={claim.beneficiary_phone} />
                      <Row label="Relationship" value={claim.beneficiary_relationship} />
                      <Row label="Identity Verified" value={claim.identity_verified ? '✅ Verified' : '❌ Not verified'} />
                    </div>
                  </div>

                  <div className="card mb-16">
                    <h4 style={{ marginBottom: 16 }}>Death Information</h4>
                    <div className="stack">
                      <Row label="Date of Death" value={claim.date_of_death} />
                      <Row label="Cause of Death" value={claim.cause_of_death} />
                      <Row label="Manner of Death" value={claim.manner_of_death} />
                    </div>
                    {claim.death_certificate_extracted && (
                      <details style={{ marginTop: 16 }}>
                        <summary style={{ cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-accent)' }}>
                          View AI-extracted death certificate data
                        </summary>
                        <div className="stack mt-8" style={{ fontSize: '0.875rem', background: 'var(--color-surface-2)', padding: 12, borderRadius: 8 }}>
                          {Object.entries(claim.death_certificate_extracted as Record<string, string>).map(([k, v]) => (
                            <div key={k} className="d-flex justify-between" style={{ padding: '4px 0' }}>
                              <span className="text-muted">{k.replace(/_/g, ' ')}</span>
                              <strong style={{ maxWidth: '60%', textAlign: 'right' }}>{v}</strong>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="card mb-16">
                    <h4 style={{ marginBottom: 16 }}>Documents</h4>
                    <div className="stack stack-sm">
                      <div className="d-flex justify-between align-center">
                        <span>Death Certificate</span>
                        <span style={{ color: claim.death_certificate_extracted ? 'var(--color-success)' : 'var(--color-muted)', fontSize: '0.875rem' }}>
                          {claim.death_certificate_extracted ? '✅ Received + AI extracted' : '⏳ Not uploaded'}
                        </span>
                      </div>
                      <div className="d-flex justify-between align-center">
                        <span>Beneficiary ID</span>
                        <span style={{ color: claim.identity_verified ? 'var(--color-success)' : 'var(--color-muted)', fontSize: '0.875rem' }}>
                          {claim.identity_verified ? '✅ Received + Verified' : '⏳ Not verified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {claim.adjuster_notes && (
                    <div className="card mb-16">
                      <h4 style={{ marginBottom: 12 }}>Adjuster Notes</h4>
                      <pre style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
                        {claim.adjuster_notes}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Right: AI copilot */}
                <div style={{ position: 'sticky', top: 24 }}>
                  <CopilotPanel claimId={claim.id} claimSummary={claimSummary} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted">Claim not found.</p>
          )}
        </div>
      </div>

      {showAction && claim && (
        <ActionModal
          claimId={claim.id}
          onClose={() => setShowAction(false)}
          onSuccess={() => id && fetchClaim(id)}
        />
      )}
    </div>
  )
}
