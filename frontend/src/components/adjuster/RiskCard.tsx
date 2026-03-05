import type { RiskLevel } from '../../types/claim'

interface Props {
  riskLevel?: RiskLevel
  contestabilityAlert?: boolean
  monthsSinceIssue?: number
  flags?: string[]
  recommendation?: string
  summary?: string
}

export default function RiskCard({ riskLevel, contestabilityAlert, monthsSinceIssue, flags, recommendation, summary }: Props) {
  if (!riskLevel) return null

  return (
    <div className={`risk-card risk-card--${riskLevel}`} style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h4 style={{ margin: 0 }}>AI Risk Assessment</h4>
        <span className={`badge badge-risk-${riskLevel}`}>
          {riskLevel === 'high' ? '🔴' : riskLevel === 'medium' ? '🟡' : '🟢'} {riskLevel} risk
        </span>
      </div>

      {summary && <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>{summary}</p>}

      {contestabilityAlert && (
        <div className="contestability-alert">
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-danger)' }}>Contestability Period</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
              Policy issued {monthsSinceIssue ? `${Math.round(monthsSinceIssue)} months ago` : 'recently'} —
              within 2-year contestability window. Recommend medical records review.
            </p>
          </div>
        </div>
      )}

      {flags && flags.length > 0 && (
        <ul className="flag-list">
          {flags.map((flag, i) => (
            <li key={i} className="flag-item">
              <span style={{ color: 'var(--color-danger)', flexShrink: 0 }}>•</span>
              {flag}
            </li>
          ))}
        </ul>
      )}

      {recommendation && (
        <div style={{ marginTop: '0.875rem', padding: '0.625rem 0.875rem', background: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
          <strong>Recommendation:</strong> {recommendation.replace(/_/g, ' ')}
        </div>
      )}
    </div>
  )
}
