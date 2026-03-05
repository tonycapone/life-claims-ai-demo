import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClaim } from '../contexts/ClaimContext'
import { useDocumentUpload } from '../hooks/useClaim'
import StepIndicator from '../components/StepIndicator'
import type { DeathCertificateExtraction } from '../types/claim'

export default function DocumentUpload() {
  const navigate = useNavigate()
  const { draft } = useClaim()
  const { uploadDocument, loading, error } = useDocumentUpload()
  const [extracted, setExtracted] = useState<DeathCertificateExtraction | null>(null)
  const [fileName, setFileName] = useState('')
  const [dragover, setDragover] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setFileName(file.name)
    if (!draft.claim_id) return
    const result = await uploadDocument(draft.claim_id, file)
    if (result?.extracted) setExtracted(result.extracted)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragover(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const fields: [keyof DeathCertificateExtraction, string][] = [
    ['deceased_name', 'Deceased Name'],
    ['date_of_death', 'Date of Death'],
    ['cause_of_death', 'Cause of Death'],
    ['manner_of_death', 'Manner of Death'],
    ['certifying_physician', 'Certifying Physician'],
    ['jurisdiction', 'Jurisdiction'],
    ['certificate_number', 'Certificate #'],
  ]

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn--sm" style={{ color: 'white', padding: '0.25rem 0.5rem' }} onClick={() => navigate(-1)}>←</button>
        <span className="logo-text" style={{ color: 'white', fontSize: '1rem' }}>ClaimPath</span>
      </div>
      <StepIndicator currentStep={4} />

      <div className="page-content">
        <h2 style={{ marginBottom: '0.5rem' }}>Death Certificate</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
          Please upload a certified copy of the death certificate. Accepts PDF, JPG, or PNG (max 20MB).
        </p>

        {!extracted ? (
          <>
            <div
              className={`upload-zone ${dragover ? 'dragover' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragover(true) }}
              onDragLeave={() => setDragover(false)}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="spinner spinner--lg" />
                  <p className="text-sm text-muted">Extracting information from document...</p>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
                  <p className="font-medium" style={{ marginBottom: '0.25rem' }}>
                    {fileName || 'Tap to upload or drag & drop'}
                  </p>
                  <p className="text-sm text-muted">PDF, JPG, or PNG · Max 20MB</p>
                </>
              )}
            </div>
            {error && <div className="alert alert-danger" style={{ marginTop: '1rem' }}>{error}</div>}
          </>
        ) : (
          <div>
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              We extracted the following from your death certificate. Please confirm:
            </div>
            <div className="extraction-card" style={{ marginBottom: '1.25rem' }}>
              {fields.map(([key, label]) => extracted[key] ? (
                <div key={key} className="extraction-row">
                  <span className="extraction-label">{label}</span>
                  <span className="extraction-value">{extracted[key]} ✓</span>
                </div>
              ) : null)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-primary btn--full" onClick={() => navigate('/claim/verify')}>
                This looks correct — Continue
              </button>
              <button className="btn btn-secondary btn--full" onClick={() => { setExtracted(null); setFileName('') }}>
                Something looks wrong — Re-upload
              </button>
            </div>
          </div>
        )}

        {!extracted && !loading && (
          <button
            className="btn btn-ghost btn--full"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate('/claim/verify')}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
