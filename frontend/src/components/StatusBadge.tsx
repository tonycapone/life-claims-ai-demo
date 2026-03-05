import type { ClaimStatus, RiskLevel } from '../types/claim'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
  pending_documents: 'Pending Docs', contestability_review: 'Contestability',
  siu_review: 'SIU Review', approved: 'Approved', paid: 'Paid', denied: 'Denied',
}

export function StatusBadge({ status }: { status: ClaimStatus | string }) {
  const cssClass = status.replace(/_/g, '-')
  return <span className={`badge badge-${cssClass}`}>{STATUS_LABELS[status] || status}</span>
}

export function RiskBadge({ level }: { level: RiskLevel | string }) {
  const icons: Record<string, string> = { low: '🟢', medium: '🟡', high: '🔴' }
  return (
    <span className={`badge badge-risk-${level}`}>
      {icons[level] || ''} {level}
    </span>
  )
}
