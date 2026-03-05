import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClaimDetail } from '../../hooks/useAdjuster'

import RiskCard from '../../components/adjuster/RiskCard'
import CopilotPanel from '../../components/adjuster/CopilotPanel'
import ActionModal from '../../components/adjuster/ActionModal'
import StatusBadge from '../../components/StatusBadge'
import type { Claim } from '../../types/claim'

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showAction, setShowAction] = useState(false)

  useEffect(() => {
    if (id) fetchClaim(id)
  }, [id])

  if (loading) {
    return (
      <div className="adjuster-layout">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="spinner spinner--lg" />
        </div>
      </div>
    )
  }

  const claim = claimData as any
  if (!claim) return null

  const c = claim.claim || claim
  const p = claim.policy

  const summaryText = [
    `This is a death benefit claim for ${c.insured_name} (Policy #${c.policy_number}), submitted by ${c.beneficiary_name || 'beneficiary'}.`,
    c.date_of_death ? `Date of death: ${c.date_of_death}.` : '',
    c.months_since_issue ? `The policy was issued ${Math.round(c.months_since_issue)} months ago${c.contestability_alert ? ' — within the 2-year contestability period' : ''}.` : '',
    c.cause_of_death ? `Cause of death: ${c.cause_of_death}.` : '',
    c.ai_summary || '',
  ].filter(Boolean).join(' ')

  return (
    <div className="adjuster-layout">
      <div className="adjuster-sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon" style={{ width: 28, height: 28, fontSize: '0.875rem' }}>CP</div>
            <span className="logo-text">Claim<span>Path</span></span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <a className="nav-link" href="/adjuster/queue">📋 Claims Queue</a>
        </nav>
      </div>

      <div className="adjuster-main">
        <div className="adjuster-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-ghost btn--sm" onClick={() => navigate('/adjuster/queue')}>← Queue</button>
            <span className="font-semibold">{c.claim_number}</span>
            <StatusBadge status={c.status} />
            {c.contestability_alert && <span title="Contestability">⚠️</span>}
          </div>
          <button className="btn btn-primary btn--sm" onClick={() => setShowAction(true)}>
            Take Action
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0 }}>
          <div style={{ overflow: 'y auto', padding: '1.5rem', overflowY: 'auto' }}>
            <RiskCard
              riskLevel={c.risk_level}
              contestabilityAlert={c.contestability_alert}
              monthsSinceIssue={c.months_since_issue}
              flags={c.risk_flags}
              summary={c.ai_summary}
            />

            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <p className="card-title">Policy Information</p>
              <div className="info-grid">
                <div className="info-item"><span className="info-label">Policy #</span><span className="info-value">{c.policy_number}</span></div>
                <div className="info-item"><span className="info-label">Insured</span><span className="info-value">{c.insured_name}</span></div>
                {p && <><div className="info-item"><span className="info-label">Policy Type</span><span className="info-value" style={{ textTransform: 'capitalize' }}>{p.policy_type?.replace('_', ' ')}</span></div>
                <div className="info-item"><span className="info-label">Face Amount</span><span className="info-value">${(p.face_amount || 0).toLocaleString()}</span></div>
                <div className="info-item"><span className="info-label">Issue Date</span><span className="info-value">{p.issue_date}</span></div>
                <div className="info-item"><span className="info-label">Policy Status</span><span className="info-value" style={{ textTransform: 'capitalize' }}>{p.status?.replace('_', ' ')}</span></div></>}
                {c.months_since_issue && <div className="info-item"><span className="info-label">Policy Age</span><span className="info-value">{Math.round(c.months_since_issue)} months</span></div>}
              </div>
            </div>

            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <p className="card-title">Beneficiary Information</p>
              <div className="info-grid">
                <div className="info-item"><span className="info-label">Name</span><span className="info-value">{c.beneficiary_name || '—'}</span></div>
                <div className="info-item"><span className="info-label">Relationship</span><span className="info-value" style={{ textTransform: 'capitalize' }}>{c.beneficiary_relationship || '—'}</span></div>
                <div className="info-item"><span className="info-label">Email</span><span className="info-value">{c.beneficiary_email || '—'}</span></div>
                <div className="info-item"><span className="info-label">Phone</span><span className="info-value">{c.beneficiary_phone || '—'}</span></div>
                <div className="info-item">
                  <span className="info-label">Identity Verified</span>
                  <span className="info-value">{c.identity_verified ? '✅ Verified' : '❌ Not verified'}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <p className="card-title">Death Information</p>
              <div className="info-grid">
                <div className="info-item"><span className="info-label">Date of Death</span><span className="info-value">{c.date_of_death || '—'}</span></div>
                <div className="info-item"><span className="info-label">Manner</span><span className="info-value" style={{ textTransform: 'capitalize' }}>{c.manner_of_death || '—'}</span></div>
                <div className="info-item" style={{ gridColumn: '1/-1' }}><span className="info-label">Cause</span><span className="info-value">{c.cause_of_death || '—'}</span></div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <p className="card-title">Documents</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm">Death Certificate</span>
                  <span className="badge badge-approved">{c.death_certificate_url ? '✓ Received' : '⏳ Pending'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm">Beneficiary ID</span>
                  <span className={`badge ${c.identity_verified ? 'badge-approved' : 'badge-pending-docs'}`}>{c.identity_verified ? '✓ Verified' : '⏳ Pending'}</span>
                </div>
                {c.death_certificate_extracted && (
                  <div style={{ padding: '0.75rem', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }}>
                    <p className="font-medium" style={{ marginBottom: '0.375rem' }}>Extracted from death certificate:</p>
                    {Object.entries(c.death_certificate_extracted).map(([k, v]) => v ? (
                      <p key={k} className="text-muted">{k.replace(/_/g, ' ')}: <strong style={{ color: 'var(--color-text)' }}>{String(v)}</strong></p>
                    ) : null)}
                  </div>
                )}
              </div>
            </div>

            {c.adjuster_notes && (
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <p className="card-title">Adjuster Notes</p>
                <pre style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)', fontFamily: 'inherit' }}>{c.adjuster_notes}</pre>
              </div>
            )}
          </div>

          <CopilotPanel claimId={c.id} initialSummary={summaryText} />
        </div>
      </div>

      {showAction && (
        <ActionModal
          claimId={c.id}
          onClose={() => setShowAction(false)}
          onSuccess={(_updated: Claim) => {
            if (id) fetchClaim(id)
            setShowAction(false)
          }}
        />
      )}
    </div>
  )
}
