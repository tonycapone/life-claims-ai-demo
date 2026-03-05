import type { Claim } from '../../types/claim'
import { RiskBadge } from '../StatusBadge'

export default function RiskCard({ claim }: { claim: Claim }) {
  return (
    <div className="card mb-16" style={{ borderLeft: `4px solid ${claim.risk_level === 'high' ? 'var(--color-danger)' : claim.risk_level === 'medium' ? 'var(--color-warning)' : 'var(--color-success)'}` }}>
      <div className="d-flex justify-between align-center mb-12">
        <h4>AI Risk Assessment</h4>
        {claim.risk_level && <RiskBadge level={claim.risk_level} />}
      </div>

      {claim.contestability_alert && (
        <div className="alert alert-danger mb-12">
          <span>⚠️</span>
          <div>
            <strong>Contestability Alert</strong>
            <p style={{ marginTop: 4, fontSize: '0.875rem' }}>
              Policy is {Math.round(claim.months_since_issue || 0)} months old — within the 2-year contestability period.
              Recommend medical records review before approving.
            </p>
          </div>
        </div>
      )}

      {claim.risk_flags && claim.risk_flags.length > 0 && (
        <div className="mb-12">
          <p className="text-muted fw-600 mb-8" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Risk Flags
          </p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {claim.risk_flags.map((flag, i) => (
              <li key={i} style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {claim.ai_summary && (
        <div style={{ background: 'var(--color-surface-2)', padding: '12px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
          {claim.ai_summary}
        </div>
      )}

      {!claim.risk_level && (
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>AI assessment will be available after claim submission.</p>
      )}
    </div>
  )
}
