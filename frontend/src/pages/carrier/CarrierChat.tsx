import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClaim } from '../../contexts/ClaimContext'
import { carrier } from '../../config/carrier'
import type { FNOLMessage, DeathCertificateExtraction, MannerOfDeath } from '../../types/claim'

const FNOL_REQUIRED = [
  'policy_number', 'beneficiary_name', 'beneficiary_email',
  'beneficiary_phone', 'beneficiary_relationship',
  'date_of_death', 'cause_of_death', 'manner_of_death', 'payout_method',
]

const FIELD_LABELS: Record<string, string> = {
  policy_number: 'Policy number',
  beneficiary_name: 'Your name',
  beneficiary_email: 'Email',
  beneficiary_phone: 'Phone',
  beneficiary_relationship: 'Relationship',
  date_of_death: 'Date of death',
  cause_of_death: 'Cause of death',
  manner_of_death: 'Manner of death',
  payout_method: 'Payout preference',
}

const EXTRACTION_FIELDS: [keyof DeathCertificateExtraction, string][] = [
  ['deceased_name', 'Deceased Name'],
  ['date_of_death', 'Date of Death'],
  ['cause_of_death', 'Cause of Death'],
  ['manner_of_death', 'Manner of Death'],
  ['certifying_physician', 'Certifying Physician'],
  ['jurisdiction', 'Jurisdiction'],
  ['certificate_number', 'Certificate #'],
]

const { mockUser, mockPolicy } = carrier

const GREETING: FNOLMessage = {
  role: 'assistant',
  content: `Hi ${mockUser.firstName}! How can I help you today?`,
  timestamp: new Date().toISOString(),
}

export default function CarrierChat() {
  const navigate = useNavigate()
  const { draft, setDraft, clearDraft } = useClaim()

  // Clear state on mount so every visit starts fresh
  useEffect(() => {
    clearDraft()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [messages, setMessages] = useState<FNOLMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [certified, setCertified] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Death certificate upload state
  const [showUploadWidget, setShowUploadWidget] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<DeathCertificateExtraction | null>(null)
  const [dragover, setDragover] = useState(false)
  const [uploadFileName, setUploadFileName] = useState('')

  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Persist messages to draft
  useEffect(() => {
    setDraft({ chat_messages: messages })
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showReview, showUploadWidget, extractedData, uploading])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return
    const userMsg: FNOLMessage = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    // Build chat history for API (limit to 20)
    const allMessages = [...messages, userMsg]
    const apiMessages = allMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))

    // Placeholder assistant message
    const assistantMsg: FNOLMessage = { role: 'assistant', content: '', timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const response = await fetch('/api/claims/carrier/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          policy_number: mockPolicy.number,
          draft,
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') continue

          try {
            const event = JSON.parse(payload)

            if (event.type === 'text') {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = { ...last, content: last.content + event.data }
                return updated
              })
            } else if (event.type === 'state') {
              setDraft(event.data)
            } else if (event.type === 'action' && event.action === 'show_review') {
              setShowReview(true)
            } else if (event.type === 'action' && event.action === 'upload_death_cert') {
              setShowUploadWidget(true)
              setExtractedData(null)
              setUploadFileName('')
              setUploadError(null)
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (e) {
      console.error('Carrier chat error:', e)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "I'm sorry, something went wrong. Please try again.",
        }
        return updated
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }, [streaming, messages, draft, setDraft])

  const handleUploadFile = useCallback(async (file: File) => {
    if (!draft.claim_id) {
      setUploadError('Claim must be created first.')
      return
    }

    setUploadFileName(file.name)
    setUploading(true)
    setUploadError(null)

    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch(`/api/claims/${draft.claim_id}/documents`, {
        method: 'POST',
        body: form,
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      const extracted = result.extracted as DeathCertificateExtraction

      setExtractedData(extracted)
      setDraft({
        death_certificate_uploaded: true,
        death_certificate_extracted: extracted,
        ...(extracted.date_of_death && { date_of_death: extracted.date_of_death }),
        ...(extracted.cause_of_death && { cause_of_death: extracted.cause_of_death }),
        ...(extracted.manner_of_death && { manner_of_death: extracted.manner_of_death as MannerOfDeath }),
      })
    } catch (e) {
      console.error('Upload error:', e)
      setUploadError('Upload failed. Please try again or skip this step.')
    } finally {
      setUploading(false)
    }
  }, [draft.claim_id, setDraft])

  const handleUploadConfirm = () => {
    setShowUploadWidget(false)
    const extracted = extractedData
    if (extracted) {
      const parts: string[] = []
      if (extracted.deceased_name) parts.push(`Deceased: ${extracted.deceased_name}`)
      if (extracted.date_of_death) parts.push(`Date: ${extracted.date_of_death}`)
      if (extracted.cause_of_death) parts.push(`Cause: ${extracted.cause_of_death}`)
      const summary = parts.length > 0 ? parts.join(', ') : 'Certificate uploaded'
      sendMessage(`I've uploaded the death certificate. ${summary}`)
    }
  }

  const handleUploadSkip = () => {
    setShowUploadWidget(false)
    setDraft({ death_certificate_skipped: true })
    sendMessage("I don't have the death certificate right now.")
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragover(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUploadFile(file)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleSubmit = async () => {
    if (!draft.claim_id || !certified) return
    setSubmitting(true)
    try {
      await fetch(`/api/claims/${draft.claim_id}/submit`, { method: 'POST' })
      navigate('/claim/confirmation')
    } catch (e) {
      console.error('Submit error:', e)
      setSubmitting(false)
    }
  }

  // Whether we're in claim mode (claim has been started)
  const hasActiveClaim = !!draft.claim_id

  return (
    <div className="fnol-chat">
      {/* Header */}
      <div className="page-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-ghost btn--sm"
            style={{ color: 'rgba(255,255,255,0.85)', padding: '0.25rem 0.5rem' }}
            onClick={() => navigate('/carrier/home')}
          >
            &#8592;
          </button>
          <h1>{hasActiveClaim ? 'File a Claim' : 'Chat'}</h1>
        </div>
        {hasActiveClaim && (
          <div className="field-progress">
            {FNOL_REQUIRED.map((f) => (
              <div
                key={f}
                className={`field-dot ${draft[f as keyof typeof draft] ? 'field-dot--filled' : ''}`}
                title={FIELD_LABELS[f]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message chat-message--${msg.role}`}>
            <div className="chat-bubble">
              {msg.content || (streaming && i === messages.length - 1 ? '' : '')}
              {streaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && (
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              )}
            </div>
          </div>
        ))}

        {/* Death certificate upload widget */}
        {showUploadWidget && !extractedData && (
          <div className="fnol-upload-card">
            <div className="fnol-upload-card__header">
              <span className="fnol-upload-card__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </span>
              <span className="fnol-upload-card__title">Upload Death Certificate</span>
            </div>
            {!uploading ? (
              <>
                <div
                  className={`fnol-upload-zone ${dragover ? 'fnol-upload-zone--dragover' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragover(true) }}
                  onDragLeave={() => setDragover(false)}
                  onDrop={onDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) handleUploadFile(f)
                    }}
                  />
                  <div className="fnol-upload-zone__content">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className="fnol-upload-zone__label">Tap to upload or drag and drop</p>
                    <p className="fnol-upload-zone__hint">PDF, JPG, or PNG</p>
                  </div>
                </div>
                {uploadError && (
                  <p className="fnol-upload-card__error">{uploadError}</p>
                )}
                <button
                  className="btn btn-ghost btn--sm fnol-upload-card__skip"
                  onClick={handleUploadSkip}
                >
                  I don't have it right now
                </button>
              </>
            ) : (
              <div className="fnol-upload-processing">
                <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2.5 }} />
                <div>
                  <p className="fnol-upload-processing__label">Analyzing document...</p>
                  <p className="fnol-upload-processing__file">{uploadFileName}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Death certificate extraction confirmation card */}
        {showUploadWidget && extractedData && (
          <div className="fnol-extraction-card">
            <div className="fnol-extraction-card__header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="fnol-extraction-card__title">Certificate processed</span>
            </div>
            <div className="extraction-card">
              {EXTRACTION_FIELDS.map(([key, label]) => {
                const value = extractedData[key]
                if (!value) return null
                return (
                  <div key={key} className="extraction-row">
                    <span className="extraction-label">{label}</span>
                    <span className="extraction-value">{value}</span>
                  </div>
                )
              })}
            </div>
            <div className="fnol-extraction-card__actions">
              <button className="btn btn-primary btn--sm" onClick={handleUploadConfirm}>
                Looks correct — continue
              </button>
              <button
                className="btn btn-ghost btn--sm"
                onClick={() => {
                  setExtractedData(null)
                  setUploadFileName('')
                  setUploadError(null)
                  setDraft({
                    death_certificate_uploaded: false,
                    death_certificate_extracted: undefined,
                    date_of_death: undefined,
                    cause_of_death: undefined,
                    manner_of_death: undefined,
                  } as any)
                }}
              >
                Re-upload
              </button>
            </div>
          </div>
        )}

        {/* Review card */}
        {showReview && draft.claim_id && (
          <div className="fnol-review-card">
            <p className="font-semibold" style={{ marginBottom: '0.75rem' }}>Review your claim</p>
            <div className="extraction-card" style={{ marginBottom: '1rem' }}>
              {FNOL_REQUIRED.map(f => (
                <div key={f} className="extraction-row">
                  <span className="extraction-label">{FIELD_LABELS[f]}</span>
                  <span className="extraction-value">
                    {String(draft[f as keyof typeof draft] || '—')}
                  </span>
                </div>
              ))}
            </div>
            <label className="checkbox-option" style={{ marginBottom: '0.75rem' }}>
              <input
                type="checkbox"
                checked={certified}
                onChange={e => setCertified(e.target.checked)}
              />
              <span className="text-sm">
                I certify that the information provided is true and accurate to the best of my knowledge.
              </span>
            </label>
            <button
              className="btn btn-primary btn--full"
              disabled={!certified || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={streaming || submitting}
        />
        <button
          className="btn btn-primary btn--sm"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming || submitting}
          style={{ width: 'auto' }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
