import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useClaimDetail, useDraftCommunication } from '../../hooks/useAdjuster'
import { StatusBadge } from '../../components/StatusBadge'
import RiskCard from '../../components/adjuster/RiskCard'
import RegulatoryCard from '../../components/adjuster/RegulatoryCard'
import CopilotPanel from '../../components/adjuster/CopilotPanel'
import ActionModal from '../../components/adjuster/ActionModal'
import { useAdjusterAuth } from '../../contexts/AdjusterContext'
import type { Claim } from '../../types/claim'
import type { CommunicationDraft } from '../../types/adjuster'

export default function AdjusterClaimDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { claim, fetchClaim, loading } = useClaimDetail()
  const { draft: draftComm, loading: draftLoading } = useDraftCommunication()

  const { adjuster } = useAdjusterAuth()
  const [showAction, setShowAction] = useState(false)
  const [commDraft, setCommDraft] = useState<CommunicationDraft | null>(null)

  useEffect(() => { if (id) fetchClaim(id) }, [id])

  const handleActionDone = (updated: Claim) => {
    fetchClaim(updated.id)
  }

  const handleDraftComm = async (type: string) => {
    if (!id) return
    const result = await draftComm(id, type)
    if (result) {
      const name = adjuster?.full_name || 'Claims Department'
      const body = result.body.replace(/Claims Department\s*$/m, name + '\nClaims Department')
      setCommDraft({ ...result, body })
    }
  }

  if (loading || !claim) {
    return <div className="loading-overlay"><div className="spinner" /></div>
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <header style={{ background: 'var(--color-primary)', color: 'white', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn--ghost btn--sm btn--inline" style={{ color: 'white' }} onClick={() => navigate('/adjuster/queue')}>&larr; Queue</button>
          <span style={{ fontWeight: 700 }}>{claim.claim_number}</span>
        </div>
        <button className="btn btn--accent btn--sm" onClick={() => setShowAction(true)}>Take Action</button>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          {/* Left column: claim data */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.25rem', margin: 0 }}>{claim.insured_name}</h1>
              <StatusBadge status={claim.status} />
            </div>

            <Section title="Policy Information">
              <Row label="Policy Number" value={claim.policy_number} />
              <Row label="Insured" value={claim.insured_name} />
              {claim.months_since_issue != null && <Row label="Policy Age" value={`${claim.months_since_issue} months`} />}
            </Section>

            <Section title="Beneficiary">
              <Row label="Name" value={claim.beneficiary_name} />
              <Row label="Email" value={claim.beneficiary_email} />
              <Row label="Phone" value={claim.beneficiary_phone} />
              <Row label="Relationship" value={claim.beneficiary_relationship} />
              <Row label="Identity Verified" value={claim.identity_verified ? 'Yes' : 'No'} />
            </Section>

            <Section title="Death Details">
              <Row label="Date of Death" value={claim.date_of_death} />
              <Row label="Cause" value={claim.cause_of_death} />
              <Row label="Manner" value={claim.manner_of_death} />
            </Section>

            <Section title="Claim Details">
              <Row label="Status" value={claim.status} />
              <Row label="Payout Method" value={claim.payout_method} />
              <Row label="Created" value={claim.created_at ? new Date(claim.created_at).toLocaleDateString() : undefined} />
              {claim.assigned_adjuster && <Row label="Assigned To" value={claim.assigned_adjuster} />}
            </Section>

            {claim.adjuster_notes && (
              <Section title="Notes">
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{claim.adjuster_notes}</p>
              </Section>
            )}

            <Section title="Communications">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: commDraft ? '1rem' : 0 }}>
                <button className="btn btn--outline btn--sm" onClick={() => handleDraftComm('acknowledgment')} disabled={draftLoading}>Acknowledgment</button>
                <button className="btn btn--outline btn--sm" onClick={() => handleDraftComm('status_update')} disabled={draftLoading}>Status Update</button>
                <button className="btn btn--outline btn--sm" onClick={() => handleDraftComm('document_request')} disabled={draftLoading}>Doc Request</button>
              </div>
              {commDraft && (
                <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '0.75rem' }}>
                  <input
                    className="form-input"
                    value={commDraft.subject}
                    onChange={e => setCommDraft({ ...commDraft, subject: e.target.value })}
                    style={{ fontWeight: 600, marginBottom: '0.5rem' }}
                  />
                  <textarea
                    className="form-textarea"
                    value={commDraft.body}
                    onChange={e => setCommDraft({ ...commDraft, body: e.target.value })}
                    style={{ fontSize: '0.875rem', lineHeight: 1.6, minHeight: '280px' }}
                  />
                </div>
              )}
            </Section>
          </div>

          {/* Right column: risk + copilot */}
          <div>
            <RiskCard
              riskLevel={claim.risk_level}
              contestabilityAlert={claim.contestability_alert}
              monthsSinceIssue={claim.months_since_issue}
              flags={claim.risk_flags}
              summary={claim.ai_summary}
            />
            <RegulatoryCard claimId={claim.id} />
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <CopilotPanel claimId={claim.id} />
            </div>
          </div>
        </div>
      </div>

      {showAction && <ActionModal claimId={claim.id} onClose={() => setShowAction(false)} onSuccess={handleActionDone} />}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ color: 'var(--color-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}
