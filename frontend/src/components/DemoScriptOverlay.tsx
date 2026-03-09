import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBookOpen, faXmark } from '@fortawesome/free-solid-svg-icons'

export default function DemoScriptOverlay() {
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

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Floating toggle button — always visible */}
      <button
        className="demo-script-fab"
        onClick={toggle}
        aria-label={open ? 'Close demo script' : 'Open demo script'}
      >
        <FontAwesomeIcon icon={open ? faXmark : faBookOpen} />
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="demo-drawer-overlay" onClick={() => setOpen(false)}>
          <div className="demo-drawer" onClick={e => e.stopPropagation()}>
            <div className="demo-drawer__header">
              <h2>Demo Script</h2>
              <button
                className="demo-drawer__close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="demo-drawer__body markdown-body">
              {content ? (
                <ReactMarkdown>{content}</ReactMarkdown>
              ) : (
                <p style={{ color: 'var(--color-muted)' }}>Loading...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
