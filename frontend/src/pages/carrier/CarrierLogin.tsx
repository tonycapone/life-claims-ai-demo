import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFaceSmile, faLock } from '@fortawesome/free-solid-svg-icons'
import { carrier } from '../../config/carrier'

export default function CarrierLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/carrier/home')
  }

  return (
    <div className="carrier-login">
      <div className="carrier-login__header">
        <img
          src={carrier.logo}
          alt={carrier.name}
          className="carrier-login__logo"
        />
        <p className="carrier-login__tagline">{carrier.tagline}</p>
      </div>

      <div className="carrier-login__body">
        <h2>Sign in</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Access your policies and manage your account
        </p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn carrier-btn-primary btn--full btn--lg">
            Sign In
          </button>
        </form>

        <div className="carrier-login__divider">
          <span>or</span>
        </div>

        <button
          className="btn btn-secondary btn--full btn--lg carrier-biometric-btn"
          onClick={() => navigate('/carrier/home')}
        >
          <FontAwesomeIcon icon={faFaceSmile} style={{ color: 'var(--carrier-primary)', fontSize: '1.25rem' }} />
          Sign in with Face ID
        </button>

        <p className="text-sm text-muted text-center" style={{ marginTop: '1.5rem' }}>
          <a href="#" onClick={e => e.preventDefault()}>Forgot password?</a>
          {' · '}
          <a href="#" onClick={e => e.preventDefault()}>Create account</a>
        </p>
      </div>

      <div className="carrier-login__footer">
        <FontAwesomeIcon icon={faLock} style={{ fontSize: '0.625rem', marginRight: '0.375rem' }} />
        Protected by 256-bit encryption
      </div>
    </div>
  )
}
