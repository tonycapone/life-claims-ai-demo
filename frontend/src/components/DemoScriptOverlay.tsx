import { useState, useCallback, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBookOpen, faXmark } from '@fortawesome/free-solid-svg-icons'

export default function DemoScriptOverlay({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')

  const toggle = useCallback(async () => {
    const next = !open
    setOpen(next)
    if (next && !content) {
      const res = await fetch('/demo/demo-script.md')
      setContent(await res.text())
    }
  }, [open, content])

  return (
    <div className="demo-script-layout">
      {/* Script panel — in flow, pushes content */}
      <div className={`demo-script-panel ${open ? 'demo-script-panel--open' : ''}`}>
        <div className="demo-drawer__header">
          <h2>Demo Script</h2>
        </div>
        <div className="demo-drawer__body markdown-body">
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p style={{ color: 'var(--color-muted)' }}>Loading...</p>
          )}
        </div>
      </div>

      {/* App content — fills remaining space */}
      <div className="demo-script-main">
        {children}
      </div>

      {/* Toggle FAB — pill when closed, circle X when open */}
      <button
        className={`demo-script-fab ${open ? 'demo-script-fab--open' : ''}`}
        style={open ? { left: 'calc(380px - 44px - 0.75rem)', bottom: '0.75rem' } : undefined}
        onClick={toggle}
        aria-label={open ? 'Close demo script' : 'Open demo script'}
      >
        {open
          ? <FontAwesomeIcon icon={faXmark} />
          : <><FontAwesomeIcon icon={faBookOpen} /> Script</>
        }
      </button>
    </div>
  )
}
