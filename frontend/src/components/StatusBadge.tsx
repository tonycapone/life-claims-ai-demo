import type { ClaimStatus, RiskLevel } from '../types/claim'

interface Props {
  status?: ClaimStatus
  risk?: RiskLevel
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  pending_documents: 'Pending Docs',
  contestability_review: 'Contestability',
  siu_review: 'SIU Review',
  approved: 'Approved',
  paid: 'Paid',
  denied: 'Denied',
}

const STATUS_CLASSES: Record<string, string> = {
  draft: 'badge-draft',
  submitted: 'badge-submitted',
  under_review: 'badge-under-review',
  pending_documents: 'badge-pending-docs',
  contestability_review: 'badge-contestability',
  siu_review: 'badge-siu',
  approved: 'badge-approved',
  paid: 'badge-paid',
  denied: 'badge-denied',
}

export default function StatusBadge({ status, risk }: Props) {
  if (risk) {
    return (
      <span className={`badge badge-risk-${risk}`}>
        {risk === 'high' ? '🔴' : risk === 'medium' ? '🟡' : '🟢'} {risk}
      </span>
    )
  }
  if (!status) return null
  return (
    <span className={`badge ${STATUS_CLASSES[status] || 'badge-draft'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
