import { useState } from 'react'
import type { Guest } from '../../types'
import { useLang } from '../../i18n/LanguageContext'
import GuestLabelRow from './GuestLabelRow'
import styles from './LabelStep.module.css'

const PALETTE = [
  { bg: '#7B1E2A', text: '#FFFDF7' },
  { bg: '#4A5E37', text: '#FFFDF7' },
  { bg: '#1E4D6B', text: '#FFFDF7' },
  { bg: '#8B4513', text: '#FFFDF7' },
  { bg: '#6B3A7D', text: '#FFFDF7' },
  { bg: '#C4722A', text: '#FFFDF7' },
  { bg: '#2C5F5D', text: '#FFFDF7' },
  { bg: '#5C3A7A', text: '#FFFDF7' },
]

interface LabelStepProps {
  guests: Guest[]
  availableLabels: string[]
  coupleColorMap: Map<string, string>
  onToggleLabel: (guestId: string, label: string) => void
  onAddLabel: (label: string) => void
  onRename: (guestId: string, newName: string) => void
  onPairGuests: (idA: string, idB: string) => void
  onBack: () => void
  onNext: () => void
}

export default function LabelStep({
  guests,
  availableLabels,
  coupleColorMap,
  onToggleLabel,
  onAddLabel,
  onRename,
  onPairGuests,
  onBack,
  onNext,
}: LabelStepProps) {
  const { t } = useLang()
  const [newLabelText, setNewLabelText] = useState('')
  const [checkedForPair, setCheckedForPair] = useState<string[]>([])

  function handlePairCheck(guestId: string) {
    setCheckedForPair((prev) => {
      if (prev.includes(guestId)) return prev.filter((id) => id !== guestId)
      if (prev.length >= 2) return prev
      return [...prev, guestId]
    })
  }

  function handleCreatePair() {
    if (checkedForPair.length === 2) {
      onPairGuests(checkedForPair[0], checkedForPair[1])
      setCheckedForPair([])
    }
  }

  function handleAddLabel() {
    const trimmed = newLabelText.trim()
    if (trimmed && !availableLabels.includes(trimmed)) {
      onAddLabel(trimmed)
      setNewLabelText('')
    }
  }

  const sortedGuests = [...guests].sort((a, b) => {
    const numA = parseInt(a.id.split('-')[1] ?? '0') || 0
    const numB = parseInt(b.id.split('-')[1] ?? '0') || 0
    return numA - numB
  })

  const pairReady = checkedForPair.length === 2
  const pairNames = checkedForPair.map((id) => guests.find((g) => g.id === id)?.name ?? id)

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.heading}>{t.assignGroupsHeading}</h2>
        <p className={styles.subheading}>{t.assignGroupsSubheading}</p>

        <div className={styles.guestList}>
          {sortedGuests.map((guest, i) => (
            <GuestLabelRow
              key={guest.id}
              guest={guest}
              ordinal={i + 1}
              availableLabels={availableLabels}
              labelPalette={PALETTE}
              coupleColor={coupleColorMap.get(guest.id)}
              isCheckedForPair={checkedForPair.includes(guest.id)}
              isPairDisabled={checkedForPair.length >= 2 && !checkedForPair.includes(guest.id)}
              onPairCheck={() => handlePairCheck(guest.id)}
              onToggleLabel={(label) => onToggleLabel(guest.id, label)}
              onRename={(newName) => onRename(guest.id, newName)}
            />
          ))}
        </div>

        {pairReady ? (
          <div className={styles.pairBar}>
            <span className={styles.pairNames}>{pairNames[0]} + {pairNames[1]}</span>
            <button type="button" className={styles.pairButton} onClick={handleCreatePair}>
              {t.createCouple}
            </button>
          </div>
        ) : (
          <p className={styles.pairHint}>{t.createCoupleHint}</p>
        )}

        <div className={styles.addLabel}>
          <input
            type="text"
            className={styles.addLabelInput}
            placeholder={t.newLabelPlaceholder}
            value={newLabelText}
            aria-label={t.newLabelPlaceholder}
            onChange={(e) => setNewLabelText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
          />
          <button type="button" className={styles.addLabelButton} onClick={handleAddLabel}>
            {t.addLabel}
          </button>
        </div>
      </div>

      <div className={styles.nav}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          {t.back}
        </button>
        <button type="button" className={styles.nextButton} onClick={onNext}>
          {t.next}
        </button>
      </div>
    </div>
  )
}
