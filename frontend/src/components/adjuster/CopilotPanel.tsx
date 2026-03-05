import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '../../types/adjuster'

interface Props { claimId: string; claimSummary?: string }

export default function CopilotPanel({ claimId, claimSummary }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setStreaming(true)

    const assistantMsg: ChatMessage = { role: 'assistant', content: '', timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const response = await fetch('/api/adjuster/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adjuster_token')}`,
        },
        body: JSON.stringify({ claim_id: claimId, message: text }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.replace('data: ', '')
          if (data === '[DONE]') break
          setMessages(prev => {
            const msgs = [...prev]
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + data }
            return msgs
          })
        }
      }
    } catch (err) {
      setMessages(prev => {
        const msgs = [...prev]
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: 'Error connecting to AI copilot.' }
        return msgs
      })
    } finally {
      setStreaming(false)
    }
  }

  const suggestions = ['What are the red flags on this claim?', 'Draft a medical records request letter', 'What is the standard contestability review process?', 'Should I approve or escalate this claim?']

  return (
    <div className="chat-panel" style={{ height: 600 }}>
      <div className="chat-header">
        <h4 style={{ margin: 0 }}>🤖 AI Copilot</h4>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>Claim-aware assistant</p>
      </div>

      {claimSummary && (
        <div style={{ padding: '12px 16px', background: '#f0f9ff', borderBottom: '1px solid var(--color-border)', fontSize: '0.8125rem', color: 'var(--color-text)' }}>
          {claimSummary}
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 && (
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 12 }}>Ask me anything about this claim.</p>
            <div className="stack stack-sm">
              {suggestions.map(s => (
                <button key={s} className="btn btn-outline btn-sm" style={{ textAlign: 'left', whiteSpace: 'normal' }}
                  onClick={() => { setInput(s); setTimeout(sendMessage, 0) }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message chat-message-${msg.role}`}>
            {msg.content}
            {streaming && i === messages.length - 1 && msg.role === 'assistant' && <span className="spinner" style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', marginLeft: 6 }} />}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          rows={2}
          placeholder="Ask a question about this claim..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          disabled={streaming}
        />
        <button className="btn btn-primary btn-sm" onClick={sendMessage} disabled={streaming || !input.trim()}>
          {streaming ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '↑'}
        </button>
      </div>
    </div>
  )
}
