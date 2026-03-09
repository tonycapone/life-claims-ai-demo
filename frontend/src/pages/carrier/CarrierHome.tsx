import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faComments,
  faCreditCard,
  faFolderOpen,
  faHeadset,
  faCheckCircle,
  faFileAlt,
  faShieldHalved,
  faChevronRight,
  faArrowRightFromBracket,
  faBell,
} from '@fortawesome/free-solid-svg-icons'
import { carrier } from '../../config/carrier'

const QUICK_ACTIONS = [
  { label: 'Chat', icon: faComments, path: '/carrier/chat', live: true },
  { label: 'Make a Payment', icon: faCreditCard, path: null, live: false },
  { label: 'Documents', icon: faFolderOpen, path: null, live: false },
  { label: 'Contact Us', icon: faHeadset, path: null, live: false },
]

const RECENT_ACTIVITY = [
  { text: 'Premium payment processed', detail: '$42.50 · Mar 1, 2026', icon: faCheckCircle },
  { text: 'Annual statement available', detail: 'Feb 15, 2026', icon: faFileAlt },
  { text: 'Premium payment processed', detail: '$42.50 · Feb 1, 2026', icon: faCheckCircle },
]

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning,'
  if (h < 17) return 'Good afternoon,'
  return 'Good evening,'
}

export default function CarrierHome() {
  const navigate = useNavigate()
  const { mockUser, mockPolicy } = carrier

  const handleAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.live && action.path) {
      navigate(action.path)
    }
  }

  return (
    <div className="carrier-home">
      {/* Header bar */}
      <div className="carrier-home__header">
        <img src={carrier.icon} alt="" className="carrier-home__header-icon" />
        <span className="carrier-home__header-name">{carrier.name}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <button className="carrier-header-btn" aria-label="Notifications">
            <FontAwesomeIcon icon={faBell} />
          </button>
          <button className="carrier-header-btn" onClick={() => navigate('/carrier/login')} aria-label="Sign out">
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </button>
        </div>
      </div>

      {/* Hero with greeting */}
      <div className="carrier-home__hero">
        <img src={carrier.hero} alt="" className="carrier-home__hero-img" />
        <div className="carrier-home__hero-overlay">
          <p className="carrier-home__hero-greeting">{getGreeting()}</p>
          <h1>{mockUser.firstName}</h1>
        </div>
      </div>

      <div className="carrier-home__content">
        {/* Policy card — floats up over hero */}
        <div className="carrier-policy-card">
          <div className="carrier-policy-card__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div className="carrier-policy-card__icon">
                <FontAwesomeIcon icon={faShieldHalved} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--carrier-primary)' }}>
                {mockPolicy.typeLabel}
              </span>
            </div>
            <span className="badge badge--success">{mockPolicy.status}</span>
          </div>

          <div className="carrier-policy-card__amount">{mockPolicy.faceAmount}</div>

          <div className="carrier-policy-card__details">
            <div>
              <span className="carrier-detail-label">Insured</span>
              <span className="carrier-detail-value">{mockPolicy.insuredName}</span>
            </div>
            <div>
              <span className="carrier-detail-label">Policy #</span>
              <span className="carrier-detail-value">{mockPolicy.number}</span>
            </div>
            <div>
              <span className="carrier-detail-label">Issued</span>
              <span className="carrier-detail-value">{mockPolicy.issueDate}</span>
            </div>
            <div>
              <span className="carrier-detail-label">Premium</span>
              <span className="carrier-detail-value">{mockPolicy.premiumAmount}/mo</span>
            </div>
          </div>

          <div className="carrier-policy-card__footer">
            <span className="text-sm text-muted">
              Next payment: <strong>{mockPolicy.premiumAmount}</strong> on {mockPolicy.nextPaymentDate}
            </span>
            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '0.625rem', color: 'var(--color-subtle)' }} />
          </div>
        </div>

        {/* Quick actions — 2x2 grid, big tappable tiles */}
        <div className="carrier-actions">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.label}
              className={`carrier-action-btn ${action.live ? 'carrier-action-btn--live' : ''}`}
              onClick={() => handleAction(action)}
            >
              <div className="carrier-action-btn__icon-wrap">
                <FontAwesomeIcon icon={action.icon} />
              </div>
              <span className="carrier-action-btn__label">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Recent activity */}
        <div className="carrier-activity">
          <div style={{ padding: '0.875rem 0 0.25rem', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-subtle)' }}>
            Recent Activity
          </div>
          {RECENT_ACTIVITY.map((item, i) => (
            <div key={i} className="carrier-activity__item">
              <div className="carrier-activity__icon">
                <FontAwesomeIcon icon={item.icon} />
              </div>
              <div className="carrier-activity__text">
                <span className="text-sm font-medium">{item.text}</span>
                <span className="text-sm text-muted">{item.detail}</span>
              </div>
              <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '0.5rem', color: 'var(--color-subtle)', alignSelf: 'center' }} />
            </div>
          ))}
        </div>

        {/* Support */}
        <div className="carrier-support">
          <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 0 }}>
            Need help? <a href={carrier.support.phone}>{carrier.support.phoneDisplay}</a>
          </p>
        </div>
      </div>

      {/* Floating chat button */}
      <button
        className="carrier-chat-fab"
        onClick={() => navigate('/carrier/chat')}
        aria-label="Chat with us"
      >
        <FontAwesomeIcon icon={faComments} />
      </button>
    </div>
  )
}
