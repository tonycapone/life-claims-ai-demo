import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentUpload } from '../hooks/useClaim'
import { useClaim } from '../contexts/ClaimContext'
import StepIndicator from '../components/StepIndicator'

export default function DocumentUpload() {
  const navigate = useNavigate()
  const { draft, setDraft } = useClaim()
  const { uploadDocument, loading, error } = useDocumentUpload()
  const inputRef = useRef<HTMLInputElement>(null)

  const [dragOver, setDragOver] = useState(false)
  const [extracted, setExtracted] = useState<any>(null)

  async function handleFile(file: File) {
    if (!draft.claim_id) return
    const result = await uploadDocument(draft.claim_id, file)
    if (result) setExtracted(result.extracted)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  function handleConfirm() {
    setDraft({ current_step: 5 })
    navigate('/claim/verify')
  }

  return (
    <div className="page">
      <StepIndicator currentStep={4} />
      <div className="page-header">
        <h1>Death Certificate</h1>
        <p>Please upload the certified death certificate. We'll extract the details automatically.</p>
      </div>

      {!extracted ? (
        <>
          <div
            className={`upload-area ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {loading ? (
              <div style={{ textAlign: 'center' }}>
                <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                <p className="mt-12 text-muted">Uploading and extracting...</p>
              </div>
            ) : (
              <>
                <div className="upload-icon">📄</div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Drop your death certificate here</p>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>or tap to browse • PDF, JPG, PNG • up to 20MB</p>
              </>
            )}
          </div>
          {error && <p className="error-msg mt-8">{error}</p>}
        </>
      ) : (
        <div className="card stack stack-md">
          <div className="alert alert-success">
            <span>✅</span>
            <strong>We extracted the following from your death certificate. Please confirm:</strong>
          </div>
          <div className="stack stack-sm">
            {[
              ['Name', extracted.deceased_name],
              ['Date of Death', extracted.date_of_death],
              ['Cause of Death', extracted.cause_of_death],
              ['Manner of Death', extracted.manner_of_death],
              ['Certifying Physician', extracted.certifying_physician],
              ['Jurisdiction', extracted.jurisdiction],
              ['Certificate #', extracted.certificate_number],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label as string} className="d-flex justify-between" style={{ fontSize: '0.9375rem', paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                <span className="text-muted">{label}</span>
                <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{value as string}</strong>
              </div>
            ))}
          </div>
          <div className="cluster">
            <button className="btn btn-primary" onClick={handleConfirm}>This looks correct ✓</button>
            <button className="btn btn-outline" onClick={() => setExtracted(null)}>Something looks wrong</button>
          </div>
        </div>
      )}
    </div>
  )
}
