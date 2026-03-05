import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdjusterLogin } from '../../hooks/useAdjuster'
import { useAdjusterContext } from '../../contexts/AdjusterContext'

export default function AdjusterLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAdjusterContext()
  const { login, loading, error } = useAdjusterLogin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await login(username, password)
    if (result) {
      setAuth(result.access_token, result.adjuster)
      navigate('/adjuster/queue')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="logo-icon" style={{ width: 44, height: 44, fontSize: '1.125rem' }}>CP</div>
            <span style={{ fontSize: '1.375rem', fontWeight: 700, color: 'white' }}>
              Claim<span style={{ color: '#93c5fd' }}>Path</span>
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Adjuster Portal</p>
        </div>

        <div className="card card--elevated">
          <h2 style={{ marginBottom: '1.5rem' }}>Sign in</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Username</label>
              <input className="form-input" placeholder="j.martinez" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label required">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
            <button type="submit" className="btn btn-primary btn--full" disabled={loading}>
              {loading ? <><span className="spinner" />Signing in...</> : 'Sign in'}
            </button>
          </form>
          <p className="text-xs text-muted text-center" style={{ marginTop: '1rem' }}>
            Demo credentials: j.martinez / password123
          </p>
        </div>
      </div>
    </div>
  )
}
