import { useState, useEffect } from 'react'
import type { Guest } from '../../types'
import { useLang } from '../../i18n/LanguageContext'
import LabelBadge from './LabelBadge'
import styles from './GuestLabelRow.module.css'

interface GuestLabelRowProps {
  guest: Guest
  availableLabels: string[]
  labelPalette: { bg: string; text: string }[]
  coupleColor?: string
  isCheckedForPair: boolean
  isPairDisabled: boolean
  onPairCheck: () => void
  onToggleLabel: (label: string) => void
  onRename: (newName: string) => void
}

export default function GuestLabelRow({
  guest,
  availableLabels,
  labelPalette,
  coupleColor,
  isCheckedForPair,
  isPairDisabled,
  onPairCheck,
  onToggleLabel,
  onRename,
}: GuestLabelRowProps) {
  const { t } = useLang()
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(guest.name)

  useEffect(() => {
    setEditValue(guest.name)
  }, [guest.name])

  function startEdit() {
    setEditing(true)
    setEditValue(guest.name)
  }

  function commitEdit() {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== guest.name) {
      onRename(trimmed)
    }
    setEditing(false)
  }

  function cancelEdit() {
    setEditValue(guest.name)
    setEditing(false)
  }

  return (
    <div className={styles.row}>
      <input
        type="checkbox"
        className={styles.pairCheckbox}
        checked={isCheckedForPair}
        disabled={isPairDisabled}
        onChange={onPairCheck}
        aria-label={`Pair ${guest.name}`}
      />
      {editing ? (
        <input
          className={styles.nameInput}
          value={editValue}
          autoFocus
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') cancelEdit()
          }}
        />
      ) : (
        <span
          className={styles.name}
          onDoubleClick={startEdit}
          title={t.editNameTitle}
          style={coupleColor ? { borderLeft: `4px solid ${coupleColor}`, paddingLeft: '6px' } : undefined}
        >
          {guest.name}
          <span className={styles.editHint}>{t.editNameHint}</span>
        </span>
      )}
      <div className={styles.badges}>
        {availableLabels.map((label, i) => (
          <LabelBadge
            key={label}
            label={label}
            color={labelPalette[i % labelPalette.length]}
            selected={guest.labels.includes(label)}
            onClick={() => onToggleLabel(label)}
          />
        ))}
      </div>
    </div>
  )
}
