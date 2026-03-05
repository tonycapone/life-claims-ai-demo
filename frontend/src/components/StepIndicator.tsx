interface Props {
  currentStep: number
  totalSteps?: number
}

const STEPS = ['Policy', 'Beneficiary', 'Death Info', 'Documents', 'Identity', 'Payout', 'Review']

export default function StepIndicator({ currentStep, totalSteps = 7 }: Props) {
  return (
    <div className="step-indicator">
      {STEPS.slice(0, totalSteps).map((label, i) => {
        const step = i + 1
        const isComplete = step < currentStep
        const isActive = step === currentStep
        return (
          <div key={step} className="step-item">
            <div
              className={`step-circle ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
              title={label}
            >
              {isComplete ? '✓' : step}
            </div>
            {step < totalSteps && (
              <div className={`step-line ${isComplete ? 'complete' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
