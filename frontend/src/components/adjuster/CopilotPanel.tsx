import { useState, useRef, useEffect } from 'react'
import Markdown from 'react-markdown'
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
        body: JSON.stringify({
          claim_id: claimId,
          message: text,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
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
            if (event.type === 'text' && event.data) {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = { ...last, content: last.content + event.data }
                return updated
              })
            }
          } catch {
            // skip malformed events
          }
        }
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
            <div className="chat-bubble markdown-body">
              <Markdown>{msg.content}</Markdown>
            </div>
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

      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <textarea
          className="form-textarea"
          placeholder="Ask anything about this claim…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={streaming}
          style={{ marginBottom: '0.5rem', minHeight: '72px' }}
        />
        <button
          className="btn btn-primary btn--sm btn--full"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
        >
          Send
        </button>
      </div>
    </div>
  )
}
