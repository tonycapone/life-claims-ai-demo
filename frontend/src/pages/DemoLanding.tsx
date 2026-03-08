import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ReactMarkdown from 'react-markdown'
import {
  faMobileScreenButton,
  faDesktop,
  faArrowRight,
  faShieldHalved,
  faComments,
  faBrain,
  faFileLines,
  faFilePdf,
  faBookOpen,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

const CAPABILITIES = [
  { icon: faComments, label: 'Conversational claim intake' },
  { icon: faBrain, label: 'AI risk scoring & analysis' },
  { icon: faShieldHalved, label: 'Contestability analysis' },
  { icon: faFileLines, label: 'AI copilot & communications' },
]

export default function DemoLanding() {
  const navigate = useNavigate()
  const [scriptOpen, setScriptOpen] = useState(false)
  const [scriptContent, setScriptContent] = useState('')

  const openScript = useCallback(async () => {
    setScriptOpen(true)
    if (!scriptContent) {
      const res = await fetch('/demo/demo-script.md')
      const text = await res.text()
      setScriptContent(text)
    }
  }, [scriptContent])

  useEffect(() => {
    if (scriptOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [scriptOpen])

  return (
    <div className="demo-landing">
      {/* Hero */}
      <div className="demo-landing__hero">
        <div className="demo-landing__hero-inner">
          <div className="demo-landing__logo">
            <div className="demo-landing__logo-icon">CP</div>
            <span className="demo-landing__logo-text">
              Claim<span>Path</span>
            </span>
          </div>

          <h1 className="demo-landing__title">
            The missing claims module for modern life insurance.
          </h1>

          <p className="demo-landing__subtitle">
            An AI-native prototype that reimagines how beneficiaries file claims
            and how adjusters process them — built as a white-label module any
            carrier could adopt.
          </p>
        </div>
      </div>

      {/* Two portals */}
      <div className="demo-landing__content">
        <div className="demo-landing__section-label">Choose a portal</div>

        <div className="demo-landing__portals">
          <button
            className="demo-portal-card"
            onClick={() => navigate('/carrier/login')}
          >
            <div className="demo-portal-card__icon demo-portal-card__icon--customer">
              <FontAwesomeIcon icon={faMobileScreenButton} />
            </div>
            <div className="demo-portal-card__body">
              <h2>Customer App</h2>
              <p>
                Experience the beneficiary side — a carrier-branded mobile app
                where policyholders file death benefit claims through an
                AI-guided conversation instead of a multi-page form.
              </p>
            </div>
            <div className="demo-portal-card__arrow">
              <FontAwesomeIcon icon={faArrowRight} />
            </div>
          </button>

          <button
            className="demo-portal-card"
            onClick={() => navigate('/adjuster/login')}
          >
            <div className="demo-portal-card__icon demo-portal-card__icon--adjuster">
              <FontAwesomeIcon icon={faDesktop} />
            </div>
            <div className="demo-portal-card__body">
              <h2>Adjuster Dashboard</h2>
              <p>
                See the claims professional side — AI-powered risk scoring,
                a copilot that knows the claim inside and out, and one-click
                communication drafting.
              </p>
            </div>
            <div className="demo-portal-card__arrow">
              <FontAwesomeIcon icon={faArrowRight} />
            </div>
          </button>
        </div>

        {/* What it does */}
        <div className="demo-landing__section-label">What the AI does</div>

        <div className="demo-landing__capabilities">
          {CAPABILITIES.map((cap) => (
            <div key={cap.label} className="demo-capability">
              <div className="demo-capability__icon">
                <FontAwesomeIcon icon={cap.icon} />
              </div>
              <span>{cap.label}</span>
            </div>
          ))}
        </div>

        {/* Demo resources */}
        <div className="demo-landing__section-label">Demo resources</div>

        <div className="demo-landing__resources">
          <button
            className="demo-resource-link demo-resource-link--script"
            onClick={openScript}
          >
            <FontAwesomeIcon icon={faBookOpen} />
            <div>
              <strong>Demo Script</strong>
              <span>Step-by-step walkthrough with talking points and timing</span>
            </div>
          </button>
          <a
            href="/demo/death-certificate-smith.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="demo-resource-link demo-resource-link--pdf"
          >
            <FontAwesomeIcon icon={faFilePdf} />
            <div>
              <strong>Death Certificate</strong>
              <span>John Michael Smith — upload this during the claim flow</span>
            </div>
          </a>
          <a
            href="/demo/application-smith.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="demo-resource-link demo-resource-link--pdf"
          >
            <FontAwesomeIcon icon={faFilePdf} />
            <div>
              <strong>Insurance Application</strong>
              <span>Original application with health questionnaire — used in contestability analysis</span>
            </div>
          </a>
          <a
            href="/demo/medical-records-smith.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="demo-resource-link demo-resource-link--pdf"
          >
            <FontAwesomeIcon icon={faFilePdf} />
            <div>
              <strong>Medical Records</strong>
              <span>Lakeview Internal Medicine records — contains undisclosed conditions</span>
            </div>
          </a>
        </div>

        {/* Context */}
        <div className="demo-landing__context">
          <p>
            This is a production-quality prototype — two frontends, a Python/FastAPI
            backend, real infrastructure on AWS — built with AI-assisted development.
            Everything you see is live, with real AI reasoning about real claim data.
            Nothing is canned.
          </p>
        </div>

        <div className="demo-landing__footer">
          ClaimPath Demo
        </div>
      </div>

      {/* Demo script drawer */}
      {scriptOpen && (
        <div className="demo-drawer-overlay" onClick={() => setScriptOpen(false)}>
          <div className="demo-drawer" onClick={e => e.stopPropagation()}>
            <div className="demo-drawer__header">
              <h2>Demo Script</h2>
              <button
                className="demo-drawer__close"
                onClick={() => setScriptOpen(false)}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="demo-drawer__body markdown-body">
              {scriptContent ? (
                <ReactMarkdown>{scriptContent}</ReactMarkdown>
              ) : (
                <p style={{ color: 'var(--color-muted)' }}>Loading...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
