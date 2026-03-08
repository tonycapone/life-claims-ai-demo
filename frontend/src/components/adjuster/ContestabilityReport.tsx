import { useState } from 'react'
import type { ContestabilityAnalysis } from '../../types/claim'
import { useContestabilityAnalysis } from '../../hooks/useAdjuster'

interface Props {
  claimId: string
  contestabilityAlert: boolean
  existingAnalysis?: ContestabilityAnalysis | null
  onAnalysisComplete?: (analysis: ContestabilityAnalysis) => void
}

export default function ContestabilityReport({
  claimId,
  contestabilityAlert,
  existingAnalysis,
  onAnalysisComplete,
}: Props) {
  const { analyze, loading, error } = useContestabilityAnalysis()
  const [analysis, setAnalysis] = useState<ContestabilityAnalysis | null>(existingAnalysis || null)

  if (!contestabilityAlert) return null

  const handleRunAnalysis = async () => {
    const result = await analyze(claimId)
    if (result) {
      setAnalysis(result)
      onAnalysisComplete?.(result)
    }
  }

  // Show the run button if no analysis exists yet
  if (!analysis) {
    return (
      <div className="contestability-card">
        <div className="contestability-card__header">
          <div className="contestability-card__icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 7V13L10 18L18 13V7L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 8V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="10" cy="13.5" r="0.75" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h4 className="contestability-card__title">Contestability Analysis</h4>
            <p className="contestability-card__subtitle">
              Compare insurance application against medical records
            </p>
          </div>
        </div>

        <p className="contestability-card__description">
          AI-powered comparison of the original insurance application health questionnaire
          against actual medical records to identify potential material misrepresentations.
        </p>

        <button
          className="contestability-card__run-btn"
          onClick={handleRunAnalysis}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Analyzing application against medical records...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1V15M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Run Contestability Analysis
            </>
          )}
        </button>

        {error && (
          <p className="contestability-card__error">{error}</p>
        )}
      </div>
    )
  }

  // Show the full analysis report
  const materialCount = analysis.discrepancies.filter(d => d.severity === 'material').length
  const minorCount = analysis.discrepancies.filter(d => d.severity === 'minor').length

  return (
    <div className="contestability-report">
      {/* Report Header */}
      <div className="contestability-report__header">
        <div className="contestability-report__header-left">
          <div className="contestability-report__icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 7V13L10 18L18 13V7L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 8V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="10" cy="13.5" r="0.75" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h4 className="contestability-report__title">Contestability Analysis Report</h4>
            <p className="contestability-report__subtitle">
              Application vs. Medical Records Comparison
            </p>
          </div>
        </div>
        <div className="contestability-report__badges">
          {materialCount > 0 && (
            <span className="contestability-badge contestability-badge--material">
              {materialCount} Material
            </span>
          )}
          {minorCount > 0 && (
            <span className="contestability-badge contestability-badge--minor">
              {minorCount} Minor
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="contestability-report__summary">
        <p>{analysis.summary}</p>
      </div>

      {/* Discrepancy Table */}
      <div className="contestability-report__discrepancies">
        <div className="contestability-report__section-label">Discrepancies Found</div>
        {analysis.discrepancies.map((d, i) => (
          <div key={i} className="contestability-discrepancy">
            <div className="contestability-discrepancy__header">
              <span className="contestability-discrepancy__number">#{i + 1}</span>
              <span className={`contestability-badge contestability-badge--${d.severity}`}>
                {d.severity}
              </span>
            </div>

            <div className="contestability-discrepancy__grid">
              <div className="contestability-discrepancy__field">
                <span className="contestability-discrepancy__label">Application Question</span>
                <p className="contestability-discrepancy__value">{d.application_question}</p>
              </div>

              <div className="contestability-discrepancy__field">
                <span className="contestability-discrepancy__label">Applicant's Answer</span>
                <p className="contestability-discrepancy__value contestability-discrepancy__answer--false">
                  {d.applicant_answer}
                </p>
              </div>

              <div className="contestability-discrepancy__field contestability-discrepancy__field--full">
                <span className="contestability-discrepancy__label">
                  Medical Record Finding
                  <span className="contestability-discrepancy__date">{d.source_date}</span>
                </span>
                <p className="contestability-discrepancy__value contestability-discrepancy__finding">
                  {d.medical_finding}
                </p>
              </div>

              <div className="contestability-discrepancy__field contestability-discrepancy__field--full">
                <span className="contestability-discrepancy__label">Assessment</span>
                <p className="contestability-discrepancy__value contestability-discrepancy__assessment">
                  {d.assessment}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Materiality Assessment */}
      <div className="contestability-report__materiality">
        <div className="contestability-report__section-label">Materiality Assessment</div>
        <p>{analysis.materiality_assessment}</p>
      </div>

      {/* Recommendation */}
      <div className="contestability-report__recommendation">
        <span className="contestability-report__rec-label">AI Recommendation</span>
        <span className={`contestability-badge contestability-badge--rec-${analysis.recommendation}`}>
          {analysis.recommendation.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  )
}
