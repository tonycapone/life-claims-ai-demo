import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMobileScreenButton,
  faDesktop,
  faArrowRight,
  faShieldHalved,
  faComments,
  faBrain,
  faFileLines,
  faFilePdf,
  faRotateLeft,
  faBookOpen,
  faDownload,
} from '@fortawesome/free-solid-svg-icons'

const CAPABILITIES = [
  { icon: faComments, label: 'Conversational claim intake' },
  { icon: faBrain, label: 'AI risk scoring & analysis' },
  { icon: faShieldHalved, label: 'Contestability analysis' },
  { icon: faFileLines, label: 'AI copilot & communications' },
]

export default function DemoLanding() {
  const navigate = useNavigate()
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState('')

  return (
    <div className="demo-landing">
      {/* GitHub corner — https://github.com/tholman/github-corners */}
      <a
        href="https://github.com/tonycapone/life-claims-ai-demo"
        target="_blank"
        rel="noopener noreferrer"
        className="github-corner"
        aria-label="View source on GitHub"
      >
        <svg width="80" height="80" viewBox="0 0 250 250" aria-hidden="true">
          <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z" />
          <path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style={{ transformOrigin: '130px 106px' }} className="octo-arm" />
          <path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" className="octo-body" />
        </svg>
      </a>

      {/* Hero */}
      <div className="demo-landing__hero">
        <div className="demo-landing__hero-inner">
          <div className="demo-landing__logo">
            <img src="/logo-claimpath.png" alt="ClaimPath" className="demo-landing__logo-img" />
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

      {/* Start here */}
      <div className="demo-landing__content">
        <div className="demo-landing__start-here">
          <h3>New to the demo?</h3>
          <ol>
            <li>
              <FontAwesomeIcon icon={faDownload} className="demo-start-icon" />
              Download a test <strong>death certificate</strong> below — pick low-risk (natural) or high-risk (accident) for different outcomes
            </li>
            <li>
              <FontAwesomeIcon icon={faBookOpen} className="demo-start-icon" />
              Open the <strong>Script</strong> panel (bottom-left button) for a step-by-step walkthrough
            </li>
          </ol>
        </div>

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
          <a
            href="/demo/death-certificate-smith.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="demo-resource-link demo-resource-link--pdf"
          >
            <FontAwesomeIcon icon={faFilePdf} />
            <div>
              <strong>Death Certificate (Low Risk)</strong>
              <span>John Michael Smith — natural death, cardiac arrest</span>
            </div>
          </a>
          <a
            href="/demo/death-certificate-smith-high-risk.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="demo-resource-link demo-resource-link--pdf"
          >
            <FontAwesomeIcon icon={faFilePdf} />
            <div>
              <strong>Death Certificate (High Risk)</strong>
              <span>John Michael Smith — accidental death, rock climbing fall</span>
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
          <button
            className="demo-resource-link demo-resource-link--reset"
            onClick={async () => {
              setResetting(true)
              setResetMsg('')
              try {
                const res = await fetch('/api/claims/reset-demo', { method: 'POST' })
                const data = await res.json()
                setResetMsg(`Cleared ${data.deleted} claim${data.deleted === 1 ? '' : 's'}`)
              } catch {
                setResetMsg('Reset failed')
              } finally {
                setResetting(false)
                setTimeout(() => setResetMsg(''), 3000)
              }
            }}
            disabled={resetting}
          >
            <FontAwesomeIcon icon={faRotateLeft} spin={resetting} />
            <div>
              <strong>{resetting ? 'Resetting...' : 'Reset Demo Claims'}</strong>
              <span>{resetMsg || 'Clear all filed claims to start fresh'}</span>
            </div>
          </button>
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
    </div>
  )
}
