import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '../../types/adjuster'


interface Props {
  claimId: string
  initialSummary?: string
}

const SUGGESTIONS = [
  'Request medical records',
  'Draft approval letter',
  'Explain contestability rules',
  'What are the red flags?',
]

export default function CopilotPanel({ claimId, initialSummary }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    const assistantMsg: ChatMessage = { role: 'assistant', content: '', timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const response = await fetch('/api/adjuster/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adjuster_token')}`,
        },
        body: JSON.stringify({ claim_id: claimId, message: text }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch (e) {
      console.error('Chat error:', e)
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="chat-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-alt)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '1rem' }}>🤖</span>
          <span className="font-semibold" style={{ fontSize: '0.9375rem' }}>AI Copilot</span>
        </div>
        {initialSummary && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{initialSummary}</p>
        )}
      </div>

      {messages.length === 0 && (
        <div style={{ padding: '1rem' }}>
          <p className="section-header">Suggested Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                className="btn btn-secondary btn--sm"
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => sendMessage(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-messages" style={{ flex: 1 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message chat-message--${msg.role}`}>
            <div className="chat-bubble">{msg.content}</div>
          </div>
        ))}
        {streaming && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content === '' && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-bubble">
              <span className="spinner" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          placeholder="Ask anything about this claim…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={streaming}
        />
        <button
          className="btn btn-primary btn--sm"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
        >
          Send
        </button>
      </div>
    </div>
  )
}
