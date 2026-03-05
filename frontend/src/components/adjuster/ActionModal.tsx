import { useState } from 'react'
import { useClaimAction } from '../../hooks/useAdjuster'
import type { ActionType } from '../../types/adjuster'

interface Props {
  claimId: string
  onClose: () => void
  onSuccess: () => void
}

const ACTIONS: { value: ActionType; label: string; cls: string }[] = [
  { value: 'approve', label: '✅ Approve Claim', cls: 'btn-success' },
  { value: 'deny', label: '❌ Deny Claim', cls: 'btn-danger' },
  { value: 'escalate', label: '🚨 Escalate to SIU', cls: 'btn-warning' },
  { value: 'request_docs', label: '📋 Request Documents', cls: 'btn-outline' },
]

export default function ActionModal({ claimId, onClose, onSuccess }: Props) {
  const { takeAction, loading, error } = useClaimAction()
  const [action, setAction] = useState<ActionType | null>(null)
  const [notes, setNotes] = useState('')
  const [docType, setDocType] = useState('medical_records')

  async function handleSubmit() {
    if (!action) return
    const result = await takeAction(claimId, { action, notes, document_type: action === 'request_docs' ? docType : undefined })
    if (result) { onSuccess(); onClose() }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Take Action</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body stack stack-md">
          <div className="stack stack-sm">
            {ACTIONS.map(a => (
              <button
                key={a.value}
                className={`btn ${a.cls} ${action === a.value ? 'btn-dark' : ''}`}
                onClick={() => setAction(a.value)}
                style={{ justifyContent: 'flex-start', border: action === a.value ? '2px solid var(--color-accent)' : undefined }}
              >
                {a.label}
              </button>
            ))}
          </div>
          {action === 'request_docs' && (
            <div className="form-group">
              <label>Document Type</label>
              <select value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="medical_records">Medical Records</option>
                <option value="autopsy_report">Autopsy Report</option>
                <option value="police_report">Police Report</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea placeholder="Add notes for the audit trail..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {error && <p className="error-msg">{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!action || loading}>
            {loading ? <><span className="spinner" /> Processing...</> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
