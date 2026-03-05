import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdjusterAuth } from '../../contexts/AdjusterContext'
import { useAdjusterLogin } from '../../hooks/useAdjuster'

export default function AdjusterLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAdjusterAuth()
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '1rem' }}>
      <div className="card card--elevated" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>ClaimPath</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Adjuster Dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" autoComplete="username" />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" />
          </div>

          {error && <div className="alert alert--danger">{error}</div>}

          <button className="btn btn--primary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading || !username || !password}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Demo Credentials</strong>
          Username: <code>jmartinez</code> &middot; Password: <code>demo1234</code>
        </div>
      </div>
    </div>
  )
}
