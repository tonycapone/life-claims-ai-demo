import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClaimQueue } from '../../hooks/useAdjuster'
import { useAdjusterContext } from '../../contexts/AdjusterContext'
import { StatusBadge, RiskBadge } from '../../components/StatusBadge'
import type { ClaimQueueItem } from '../../types/adjuster'

export default function Queue() {
  const navigate = useNavigate()
  const { adjuster, clearAuth } = useAdjusterContext()
  const { fetchQueue, claims, loading } = useClaimQueue()
  const [statusFilter, setStatusFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')

  useEffect(() => {
    fetchQueue({
      status: statusFilter || undefined,
      risk_level: riskFilter || undefined,
    })
  }, [statusFilter, riskFilter])

  const stats = {
    total: claims.length,
    contested: claims.filter(c => c.contestability_alert).length,
    highRisk: claims.filter(c => c.risk_level === 'high').length,
    pending: claims.filter(c => c.status === 'pending_documents').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav className="navbar">
        <a href="/adjuster/queue" className="navbar-brand">🛡️ ClaimPath Adjuster</a>
        <div className="d-flex align-center gap-12">
          <span style={{ color: 'rgba(255,255,255,.7)', fontSize: '0.875rem' }}>{adjuster?.full_name}</span>
          <button className="btn btn-sm btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}
            onClick={() => { clearAuth(); navigate('/adjuster/login') }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div className="adjuster-page">
        <div style={{ maxWidth: 'var(--max-width-wide)', margin: '0 auto' }}>
          <div className="d-flex justify-between align-center mb-24">
            <h2>Claims Queue</h2>
          </div>

          <div className="stats-bar">
            {[
              ['Total Open', stats.total],
              ['Contestability', stats.contested],
              ['High Risk', stats.highRisk],
              ['Pending Docs', stats.pending],
            ].map(([label, value]) => (
              <div key={label as string} className="stat-card">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          <div className="d-flex gap-12 mb-16 align-center">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="pending_documents">Pending Docs</option>
              <option value="contestability_review">Contestability</option>
              <option value="siu_review">SIU Review</option>
              <option value="approved">Approved</option>
            </select>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          ) : (
            <div className="table-wrapper">
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
                    <th>Contest.</th>
                    <th>Days Open</th>
                    <th>Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: 32 }}>No claims found</td></tr>
                  ) : claims.map((c: ClaimQueueItem) => (
                    <tr key={c.id} className="table-row-link" onClick={() => navigate(`/adjuster/claims/${c.id}`)}>
                      <td><strong style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>{c.claim_number}</strong></td>
                      <td>{c.beneficiary_name || '—'}</td>
                      <td>{c.insured_name}</td>
                      <td>{c.face_amount ? `$${c.face_amount.toLocaleString()}` : '—'}</td>
                      <td>{c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : '—'}</td>
                      <td>{c.status ? <StatusBadge status={c.status} /> : '—'}</td>
                      <td>{c.risk_level ? <RiskBadge level={c.risk_level} /> : '—'}</td>
                      <td>{c.contestability_alert ? <span title="Contestability alert">⚠️</span> : '—'}</td>
                      <td>{c.days_open}</td>
                      <td>{c.assigned_adjuster || <span className="text-muted">Unassigned</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
