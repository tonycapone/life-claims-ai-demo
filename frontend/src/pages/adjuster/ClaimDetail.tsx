import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClaimDetail } from '../../hooks/useAdjuster'
import { useAdjusterContext } from '../../contexts/AdjusterContext'
import RiskCard from '../../components/adjuster/RiskCard'
import CopilotPanel from '../../components/adjuster/CopilotPanel'
import ActionModal from '../../components/adjuster/ActionModal'
import { StatusBadge } from '../../components/StatusBadge'
import type { Claim } from '../../types/claim'

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { adjuster, clearAuth } = useAdjusterContext()
  const { fetchClaim, claim, loading } = useClaimDetail()
  const [showAction, setShowAction] = useState(false)

  useEffect(() => {
    if (id) fetchClaim(id)
  }, [id])

  const c = claim

  const summaryText = c
    ? `Claim ${c.claim_number} for ${c.insured_name} (Policy #${c.policy_number}), filed by ${c.beneficiary_name || 'beneficiary'}.` +
      (c.date_of_death ? ` Date of death: ${c.date_of_death}.` : '') +
      (c.cause_of_death ? ` Cause: ${c.cause_of_death}.` : '') +
      (c.contestability_alert ? ` ⚠️ Policy is ${Math.round(c.months_since_issue || 0)} months old — within 2-year contestability period.` : '') +
      (c.ai_summary ? ` ${c.ai_summary}` : '')
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
            onClick={() => { clearAuth(); navigate('/adjuster/login') }}>Sign Out</button>
        </div>
      </nav>

      <div className="adjuster-page">
        <div style={{ maxWidth: 'var(--max-width-wide)', margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 64 }}>
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          ) : c ? (
            <>
              <div className="d-flex justify-between align-center mb-24">
                <div>
                  <h2 style={{ marginBottom: 4 }}>{c.claim_number}</h2>
                  <StatusBadge status={c.status} />
                </div>
                <button className="btn btn-primary" onClick={() => setShowAction(true)}>Take Action</button>
              </div>

              <div className="claim-detail-layout">
                <div>
                  <RiskCard
                    riskLevel={c.risk_level}
                    contestabilityAlert={c.contestability_alert}
                    monthsSinceIssue={c.months_since_issue}
                    flags={c.risk_flags}
                    summary={c.ai_summary}
                  />

                  <div className="card mb-16">
                    <h4 style={{ marginBottom: 16 }}>Policy Information</h4>
                    <div className="stack">
                      {[['Policy Number', c.policy_number], ['Insured Name', c.insured_name],
                        ['Date of Birth', c.insured_dob], ['Issue Date', c.policy_issue_date],
                        ['Policy Age', c.months_since_issue ? `${Math.round(c.months_since_issue)} months` : undefined],
                        ['Face Amount', c.face_amount ? `$${c.face_amount.toLocaleString()}` : undefined],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label as string} className="d-flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                          <span className="text-muted">{label}</span>
                          <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{value as string}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card mb-16">
                    <h4 style={{ marginBottom: 16 }}>Beneficiary Information</h4>
                    <div className="stack">
                      {[['Name', c.beneficiary_name], ['Email', c.beneficiary_email],
                        ['Phone', c.beneficiary_phone], ['Relationship', c.beneficiary_relationship],
                        ['Identity Verified', c.identity_verified ? '✅ Verified' : '❌ Not verified'],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label as string} className="d-flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                          <span className="text-muted">{label}</span>
                          <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{value as string}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card mb-16">
                    <h4 style={{ marginBottom: 16 }}>Death Information</h4>
                    <div className="stack">
                      {[['Date of Death', c.date_of_death], ['Cause', c.cause_of_death], ['Manner', c.manner_of_death]].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label as string} className="d-flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                          <span className="text-muted">{label}</span>
                          <strong>{value as string}</strong>
                        </div>
                      ))}
                    </div>
                    {c.death_certificate_extracted && (
                      <details style={{ marginTop: 16 }}>
                        <summary style={{ cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-accent)' }}>View AI-extracted data</summary>
                        <div className="stack mt-8" style={{ fontSize: '0.875rem', background: 'var(--color-surface-2)', padding: 12, borderRadius: 8 }}>
                          {Object.entries(c.death_certificate_extracted as Record<string, string>).map(([k, v]) => (
                            <div key={k} className="d-flex justify-between" style={{ padding: '4px 0' }}>
                              <span className="text-muted">{k.replace(/_/g, ' ')}</span>
                              <strong style={{ maxWidth: '60%', textAlign: 'right' }}>{v}</strong>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  {c.adjuster_notes && (
                    <div className="card mb-16">
                      <h4 style={{ marginBottom: 12 }}>Adjuster Notes</h4>
                      <pre style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>{c.adjuster_notes}</pre>
                    </div>
                  )}
                </div>

                <div style={{ position: 'sticky', top: 24 }}>
                  <CopilotPanel claimId={c.id} initialSummary={summaryText} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted">Claim not found.</p>
          )}
        </div>
      </div>

      {showAction && c && (
        <ActionModal
          claimId={c.id}
          onClose={() => setShowAction(false)}
          onSuccess={(_updated: Claim) => { if (id) fetchClaim(id); setShowAction(false) }}
        />
      )}
    </div>
  )
}
