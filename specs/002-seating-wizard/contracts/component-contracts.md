# Contracts: Multi-Step Seating Wizard Components

**Date**: 2026-06-20 (updated from 2026-06-19)

All component prop interfaces for the wizard. Existing `SeatingChart`, `TableCard`, `GuestInput` contracts are unchanged.

---

## New Components

### `<StepIndicator />`

Horizontal progress bar showing wizard steps 1–4.

```ts
interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4
}
```

Step labels come from `useLang().steps` (i18n). Node state:
- `index + 1 < currentStep` → completed (✓, gold fill)
- `index + 1 === currentStep` → active (wine-red fill)
- `index + 1 > currentStep` → future (outlined, muted)

---

### `<LabelStep />`

Full Step 2 screen: label assignment + inline rename + custom label creation.

```ts
interface LabelStepProps {
  guests: Guest[]
  availableLabels: string[]
  onToggleLabel: (guestId: string, label: string) => void
  onAddLabel: (label: string) => void
  onRename: (guestId: string, newName: string) => void
  onBack: () => void
  onNext: () => void
}
```

- `onRename` is called when the user confirms an inline name edit (Enter or blur).
- Empty `newName` is a no-op (original name restored).
- All UI strings come from `useLang()`.

---

### `<LabelBadge />`

Reusable label chip used within `GuestLabelRow`.

```ts
interface LabelBadgeProps {
  label: string
  color: { bg: string; text: string }
  selected: boolean
  onClick: () => void
  size?: 'sm' | 'md'   // default 'md'
}
```

`selected=true` → filled background. `selected=false` → outlined.

---

### `<GuestLabelRow />`

One guest row within `LabelStep` — name on the left (editable), label toggles on the right.

```ts
interface GuestLabelRowProps {
  guest: Guest
  availableLabels: string[]
  labelPalette: { bg: string; text: string }[]
  onToggleLabel: (label: string) => void
  onRename: (newName: string) => void
}
```

- Double-click on guest name enters inline edit mode.
- `onRename('')` is ignored; original name is restored.

---

### `<LanguagePicker />`

Language selector rendered in the app header.

```ts
// No props — reads/writes Lang via LanguageContext
function LanguagePicker(): JSX.Element
```

Renders a compact selector with options `pl | en | it`. Switching updates `LanguageContext`; all `useLang()` consumers re-render with the new locale. No persistence — resets to `pl` on page load.

---

## Updated Components

### `<ConfigPanel />` (updated)

```ts
interface ConfigPanelProps {
  tableCount: number
  seatsPerTable: number
  onTableCountChange: (n: number) => void
  onSeatsPerTableChange: (n: number) => void
  onAssign: () => void
  onBack: () => void       // go back to Step 2
  error: string | null
  guestCount: number       // display "X guests · Y seats available"
}
```

Guest summary string: `t.guestSummary(guestCount, tableCount * seatsPerTable)`.

---

## Storage Schema v4

**Key**: `wedding-seating-plan`

```jsonc
{
  "version": 4,
  "config": {
    "tableCount": 4,
    "seatsPerTable": 6,
    "rawGuestText": "Alice\nBob\n..."
  },
  "availableLabels": ["Magda", "Piotr", "Family", "Friend", "High school", "Studies"],
  "guests": [
    {
      "id": "guest-0",
      "name": "Alice",
      "labels": ["Magda", "Family"],
      "tableId": "table-1",
      "seatIndex": 0
    }
  ],
  "tables": [ /* unchanged from v1 */ ],
  "assigned": true
}
```

**Version handling**:
- `version === 4` → load as-is
- any other version → return `null` (fresh start)

**Rules**:
1. Only `storageService.save/load/clear` access `wedding-seating-plan`.
2. Save is triggered by the `useEffect` in `App.tsx` watching `[guests, tables, availableLabels, assigned, tableCount, seatsPerTable, rawGuestText]` — but only when `guests.length > 0`.
3. Save writes to both `localStorage` and `POST /api/state` (file-based, dev-only).
4. On load, `loadFromFile()` (`GET /api/state`) is tried first; falls back to `localStorage`.
5. Language is **not** saved — it is session-only React context.
