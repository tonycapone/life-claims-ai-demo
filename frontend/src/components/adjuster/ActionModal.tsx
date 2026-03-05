import { useState } from 'react'
import { useClaimAction } from '../../hooks/useAdjuster'
import type { Claim } from '../../types/claim'

interface Props {
  claimId: string
  onClose: () => void
  onSuccess: (claim: Claim) => void
}

const ACTIONS = [
  { value: 'review', label: 'Move to Review', variant: 'btn-secondary' },
  { value: 'approve', label: 'Approve Claim', variant: 'btn-success' },
  { value: 'deny', label: 'Deny Claim', variant: 'btn-danger' },
  { value: 'escalate', label: 'Escalate to SIU', variant: 'btn-danger' },
  { value: 'request_docs', label: 'Request Documents', variant: 'btn-secondary' },
  { value: 'contestability', label: 'Open Contestability Review', variant: 'btn-secondary' },
]

export default function ActionModal({ claimId, onClose, onSuccess }: Props) {
  const { takeAction, loading, error } = useClaimAction()
  const [action, setAction] = useState('')
  const [notes, setNotes] = useState('')
  const [docType, setDocType] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!action) return
    const result = await takeAction(claimId, {
      action: action as any,
      notes: notes || undefined,
      document_type: docType || undefined,
    })
    if (result) onSuccess(result)
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <h3 className="modal-title">Take Action</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Action</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {ACTIONS.map(a => (
                <button
                  key={a.value}
                  type="button"
                  className={`btn btn--sm ${action === a.value ? a.variant : 'btn-secondary'}`}
                  onClick={() => setAction(a.value)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {action === 'request_docs' && (
            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select className="form-select" value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="">Select document</option>
                <option value="medical_records">Medical Records</option>
                <option value="autopsy_report">Autopsy Report</option>
                <option value="insurance_application">Original Application</option>
                <option value="beneficiary_id">Beneficiary ID</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-textarea" placeholder="Add internal notes..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary flex-1" disabled={!action || loading}>
              {loading ? <><span className="spinner" />Processing...</> : 'Confirm Action'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
