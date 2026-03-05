import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClaimQueue } from '../../hooks/useAdjuster'
import { useAdjusterContext } from '../../contexts/AdjusterContext'
import StatusBadge from '../../components/StatusBadge'

export default function AdjusterQueue() {
  const navigate = useNavigate()
  const { adjuster, clearAuth } = useAdjusterContext()
  const { fetchQueue, claims, loading } = useClaimQueue()
  const [statusFilter, setStatusFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')

  useEffect(() => {
    fetchQueue({ status: statusFilter || undefined, risk_level: riskFilter || undefined, assigned_to: assignedFilter || undefined })
  }, [statusFilter, riskFilter, assignedFilter])

  const stats = {
    total: claims.length,
    contestability: claims.filter(c => c.contestability_alert).length,
    highRisk: claims.filter(c => c.risk_level === 'high').length,
    avgDays: claims.length > 0 ? Math.round(claims.reduce((s, c) => s + c.days_open, 0) / claims.length) : 0,
  }

  return (
    <div className="adjuster-layout">
      <div className="adjuster-sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon" style={{ width: 28, height: 28, fontSize: '0.875rem' }}>CP</div>
            <span className="logo-text">Claim<span>Path</span></span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <a className="nav-link active" href="/adjuster/queue">📋 Claims Queue</a>
        </nav>
        <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0, padding: '0 1.25rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
            {adjuster?.full_name}
          </p>
          <button
            className="btn btn-ghost btn--sm"
            style={{ color: 'rgba(255,255,255,0.6)', padding: '0.375rem 0' }}
            onClick={() => { clearAuth(); navigate('/adjuster/login') }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="adjuster-main">
        <div className="adjuster-topbar">
          <h2 style={{ fontSize: '1.125rem' }}>Claims Queue</h2>
          <span className="text-sm text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>

        <div className="adjuster-content">
          <div className="stats-bar">
            {[
              { value: stats.total, label: 'Open Claims' },
              { value: stats.avgDays, label: 'Avg Days Open' },
              { value: stats.contestability, label: 'Contestability' },
              { value: stats.highRisk, label: 'High Risk' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="filter-bar">
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="pending_documents">Pending Docs</option>
              <option value="contestability_review">Contestability</option>
              <option value="siu_review">SIU Review</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
            <select className="form-select" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
            <select className="form-select" value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)}>
              <option value="">All Assignments</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <span className="spinner spinner--lg" style={{ margin: '0 auto' }} />
                </div>
              ) : claims.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                  No claims found.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Claim #</th>
                      <th>Beneficiary</th>
                      <th>Insured</th>
                      <th>Face Amount</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Risk</th>
                      <th>Flags</th>
                      <th>Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map(c => (
                      <tr key={c.id} onClick={() => navigate(`/adjuster/claims/${c.id}`)}>
                        <td className="font-medium" style={{ color: 'var(--color-accent)' }}>{c.claim_number}</td>
                        <td>{c.beneficiary_name || '—'}</td>
                        <td>{c.insured_name}</td>
                        <td>{c.face_amount ? `$${c.face_amount.toLocaleString()}` : '—'}</td>
                        <td className="text-muted">{c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : '—'}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td>{c.risk_level ? <StatusBadge risk={c.risk_level} /> : '—'}</td>
                        <td>{c.contestability_alert ? <span title="Contestability">⚠️</span> : '—'}</td>
                        <td>{c.days_open}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
