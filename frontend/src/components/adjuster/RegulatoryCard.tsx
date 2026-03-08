import { useEffect, useState } from 'react'
import api from '../../utils/api'
import type { RegulatoryTimeline, RegulatoryDeadline } from '../../types/adjuster'

interface Props {
  claimId: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
  on_track:    { label: 'On Track',    className: 'regulatory-status--on-track',    icon: '\u2713' },
  approaching: { label: 'Approaching', className: 'regulatory-status--approaching', icon: '!' },
  overdue:     { label: 'Overdue',     className: 'regulatory-status--overdue',     icon: '\u2717' },
  completed:   { label: 'Completed',   className: 'regulatory-status--completed',   icon: '\u2713' },
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysLabel(deadline: RegulatoryDeadline): string {
  if (deadline.status === 'completed') return 'Complete'
  if (deadline.days_remaining < 0) return `${Math.abs(deadline.days_remaining)} days overdue`
  if (deadline.days_remaining === 0) return 'Due today'
  if (deadline.days_remaining === 1) return '1 day remaining'
  return `${deadline.days_remaining} days remaining`
}

function progressPercent(deadline: RegulatoryDeadline): number {
  if (deadline.status === 'completed') return 100
  if (deadline.days_remaining <= 0) return 100
  const total = deadline.day_count
  const elapsed = total - deadline.days_remaining
  return Math.max(0, Math.min(100, (elapsed / total) * 100))
}

export default function RegulatoryCard({ claimId }: Props) {
  const [data, setData] = useState<RegulatoryTimeline | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/adjuster/claims/${claimId}/regulatory`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [claimId])

  if (loading) {
    return (
      <div className="regulatory-card" style={{ marginBottom: '1.25rem' }}>
        <div className="regulatory-card__header">
          <h4 style={{ margin: 0 }}>Regulatory Timeline</h4>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="regulatory-card" style={{ marginBottom: '1.25rem' }}>
      <div className="regulatory-card__header">
        <div>
          <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>Regulatory Timeline</h4>
          <span className="regulatory-card__state">{data.state_name}</span>
        </div>
        <span className="regulatory-card__statute">{data.statute_reference}</span>
      </div>

      <div className="regulatory-card__deadlines">
        {data.deadlines.map((deadline, i) => {
          const config = STATUS_CONFIG[deadline.status] || STATUS_CONFIG.on_track
          const pct = progressPercent(deadline)

          return (
            <div key={i} className="regulatory-deadline">
              <div className="regulatory-deadline__top">
                <div className="regulatory-deadline__name">
                  <span className={`regulatory-status-dot ${config.className}`}>
                    {config.icon}
                  </span>
                  <span>{deadline.name}</span>
                </div>
                <span className={`regulatory-status-label ${config.className}`}>
                  {config.label}
                </span>
              </div>

              <div className="regulatory-deadline__bar-wrap">
                <div
                  className={`regulatory-deadline__bar ${config.className}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="regulatory-deadline__bottom">
                <span className="regulatory-deadline__date">
                  Due {formatDate(deadline.due_date)}
                </span>
                <span className={`regulatory-deadline__remaining ${config.className}`}>
                  {daysLabel(deadline)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
