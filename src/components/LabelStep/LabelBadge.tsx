import styles from './LabelBadge.module.css'

interface LabelBadgeProps {
  label: string
  color: { bg: string; text: string }
  selected: boolean
  onClick: () => void
  size?: 'sm' | 'md'
}

export default function LabelBadge({
  label,
  color,
  selected,
  onClick,
  size = 'md',
}: LabelBadgeProps) {
  return (
    <button
      type="button"
      className={[styles.badge, styles[size], selected ? styles.selected : styles.unselected]
        .filter(Boolean)
        .join(' ')}
      style={
        selected
          ? { backgroundColor: color.bg, color: color.text, borderColor: color.bg }
          : { borderColor: color.bg, color: color.bg }
      }
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  )
}
