import { useLang } from '../../i18n/LanguageContext'
import styles from './StepIndicator.module.css'

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const { t } = useLang()
  const steps = t.steps.map((label) => ({ label }))

  return (
    <nav className={styles.container} aria-label="Wizard progress">
      {steps.map((step, index) => {
        const stepNum = index + 1
        const isCompleted = stepNum < currentStep
        const isActive = stepNum === currentStep
        const nodeClass = [
          styles.node,
          isCompleted ? styles.completed : '',
          isActive ? styles.active : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <div key={stepNum} className={styles.stepItem}>
            <div className={styles.nodeRow}>
              <div
                className={nodeClass}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={[
                    styles.connector,
                    stepNum < currentStep ? styles.connectorDone : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              )}
            </div>
            <span
              className={[styles.stepLabel, isActive ? styles.stepLabelActive : '']
                .filter(Boolean)
                .join(' ')}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
