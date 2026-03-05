import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdjusterLogin } from '../../hooks/useAdjuster'
import { useAdjusterContext } from '../../contexts/AdjusterContext'

export default function AdjusterLogin() {
  const navigate = useNavigate()
  const { login, loading, error } = useAdjusterLogin()
  const { setAuth } = useAdjusterContext()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = await login(username, password)
    if (result) {
      setAuth(result.access_token, result.adjuster)
      navigate('/adjuster/queue')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛡️</div>
          <h1 style={{ marginBottom: 4 }}>ClaimPath</h1>
          <p className="text-muted">Adjuster Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="card stack stack-md">
          <h3>Sign In</h3>
          <div className="form-group">
            <label>Username</label>
            <input type="text" placeholder="j.martinez" value={username}
              onChange={e => setUsername(e.target.value)} autoFocus required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button className="btn btn-dark btn-full" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
          </button>
          <p className="text-muted text-center" style={{ fontSize: '0.8125rem' }}>
            Demo credentials: j.martinez / adjuster123
          </p>
        </form>
      </div>
    </div>
  )
}
