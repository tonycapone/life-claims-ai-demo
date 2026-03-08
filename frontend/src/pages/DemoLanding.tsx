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
} from '@fortawesome/free-solid-svg-icons'

const CAPABILITIES = [
  { icon: faComments, label: 'Conversational claim intake' },
  { icon: faBrain, label: 'AI risk scoring & analysis' },
  { icon: faShieldHalved, label: 'Adjuster copilot with claim context' },
  { icon: faFileLines, label: 'AI-drafted communications' },
]

export default function DemoLanding() {
  const navigate = useNavigate()

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
          Built by Tony Capone
        </div>
      </div>
    </div>
  )
}
