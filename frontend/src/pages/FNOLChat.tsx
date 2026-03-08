import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClaim } from '../contexts/ClaimContext'
import type { FNOLMessage } from '../types/claim'

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

const GREETING: FNOLMessage = {
  role: 'assistant',
  content: "I'm so sorry for your loss. I'm here to help you file a death benefit claim — I'll walk you through it step by step. Let's start with your policy number. It usually looks like LT-XXXXX and can be found on your policy documents.",
  timestamp: new Date().toISOString(),
}

export default function FNOLChat() {
  const navigate = useNavigate()
  const { draft, setDraft } = useClaim()
  const [messages, setMessages] = useState<FNOLMessage[]>(() => {
    return draft.chat_messages?.length ? draft.chat_messages : [GREETING]
  })
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [policyData, setPolicyData] = useState<any>(null)
  const [showReview, setShowReview] = useState(false)
  const [certified, setCertified] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Persist messages to draft
  useEffect(() => {
    setDraft({ chat_messages: messages })
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, policyData, showReview])

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
      const response = await fetch('/api/claims/fnol/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, draft }),
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

            if (event.type === 'fields') {
              setDraft(event.data)
            } else if (event.type === 'policy') {
              setPolicyData(event.data)
              if (event.data.found) {
                setDraft({ policy_verified: true })
              }
            } else if (event.type === 'text') {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = { ...last, content: last.content + event.data }
                return updated
              })
            } else if (event.type === 'action' && event.action === 'show_review') {
              setShowReview(true)
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (e) {
      console.error('FNOL chat error:', e)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handlePolicyConfirm = () => {
    setPolicyData(null)
    setDraft({ policy_verified: true })
    sendMessage("Yes, that's the correct policy.")
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

  return (
    <div className="fnol-chat">
      {/* Header */}
      <div className="page-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-ghost btn--sm"
            style={{ color: 'rgba(255,255,255,0.85)', padding: '0.25rem 0.5rem' }}
            onClick={() => navigate('/')}
          >
            ←
          </button>
          <h1>File a Claim</h1>
        </div>
        <div className="field-progress">
          {FNOL_REQUIRED.map((f) => (
            <div
              key={f}
              className={`field-dot ${draft[f as keyof typeof draft] ? 'field-dot--filled' : ''}`}
              title={FIELD_LABELS[f]}
            />
          ))}
        </div>
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

        {/* Policy confirmation card */}
        {policyData?.found && (
          <div className="fnol-policy-card">
            <p className="text-sm font-semibold" style={{ marginBottom: '0.5rem' }}>Policy found</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              {policyData.policy_number}
            </p>
            <p className="text-sm text-muted" style={{ marginBottom: '0.75rem' }}>
              Insured: {policyData.insured_name_masked} · {policyData.policy_type}
            </p>
            <button className="btn btn-primary btn--sm" onClick={handlePolicyConfirm}>
              Yes, that's correct
            </button>
          </div>
        )}

        {policyData && !policyData.found && (
          <div className="fnol-policy-card" style={{ borderLeftColor: 'var(--color-warning)' }}>
            <p className="text-sm" style={{ color: 'var(--color-warning)' }}>
              Policy not found. Please double-check the number and try again.
            </p>
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
              {submitting ? 'Submitting…' : 'Submit Claim'}
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
          placeholder="Type your message…"
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
