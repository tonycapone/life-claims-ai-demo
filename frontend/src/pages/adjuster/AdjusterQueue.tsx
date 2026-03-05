import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdjusterAuth } from '../../contexts/AdjusterContext'
import { useClaimQueue } from '../../hooks/useAdjuster'
import { StatusBadge, RiskBadge } from '../../components/StatusBadge'

export default function AdjusterQueue() {
  const navigate = useNavigate()
  const { adjuster, logout } = useAdjusterAuth()
  const { claims, fetchQueue, loading } = useClaimQueue()

  const [statusFilter, setStatusFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')

  useEffect(() => {
    fetchQueue({ status: statusFilter || undefined, risk_level: riskFilter || undefined })
  }, [statusFilter, riskFilter])

  const stats = {
    total: claims.length,
    highRisk: claims.filter(c => c.risk_level === 'high').length,
    contestable: claims.filter(c => c.contestability_alert).length,
    avgDays: claims.length ? Math.round(claims.reduce((s, c) => s + c.days_open, 0) / claims.length) : 0,
  }

  const handleLogout = () => {
    logout()
    navigate('/adjuster/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <header style={{ background: 'var(--color-primary)', color: 'white', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>ClaimPath <span style={{ opacity: 0.6, fontWeight: 400, fontSize: '0.85rem' }}>Adjuster</span></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{adjuster?.full_name}</span>
          <button className="btn btn--ghost btn--sm btn--inline" style={{ color: 'white', opacity: 0.8 }} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>Claims Queue</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Open Claims', value: stats.total, color: 'var(--color-primary)' },
            { label: 'High Risk', value: stats.highRisk, color: 'var(--color-danger)' },
            { label: 'Contestable', value: stats.contestable, color: 'var(--color-warning)' },
            { label: 'Avg Days Open', value: stats.avgDays, color: 'var(--color-muted)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="pending_documents">Pending Documents</option>
            <option value="contestability_review">Contestability</option>
            <option value="siu_review">SIU Review</option>
          </select>
          <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
            <option value="">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : (
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Claim #</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Beneficiary</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Insured</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amount</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Risk</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Days</th>
                </tr>
              </thead>
              <tbody>
                {claims.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/adjuster/claims/${c.id}`)}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                    onMouseOut={e => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                      {c.claim_number}
                      {c.contestability_alert && <span title="Contestability" style={{ color: 'var(--color-warning)', marginLeft: '0.25rem' }}>&#9888;</span>}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{c.beneficiary_name}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{c.insured_name}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>${c.face_amount?.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}><StatusBadge status={c.status} /></td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{c.risk_level && <RiskBadge level={c.risk_level} />}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{c.days_open}</td>
                  </tr>
                ))}
                {claims.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>No claims found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
