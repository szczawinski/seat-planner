# Data Model: Multi-Step Seating Wizard

**Date**: 2026-06-20 (updated from 2026-06-19)
**Feature**: specs/002-seating-wizard/spec.md
**Extends**: specs/001-wedding-seats-planner/data-model.md

## Changes from v1

| Entity | Change |
|--------|--------|
| `Guest` | Add `labels: string[]`; `name` is now editable via inline rename |
| `SeatingPlan` | Add `availableLabels: string[]`; bump `version` to `4` |
| `AppState` | Add `step`, `availableLabels`; extended action set |
| `StepIndicator` *(new UI)* | Current step drives visual indicator |
| `LabelStep` *(new UI)* | Step 2 screen with label toggle + rename + custom label creation |
| `LanguagePicker` *(new UI)* | Header component; language held in React context, not plan state |

---

## Updated Entities

### Guest (v4)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `string` | Required, unique | Generated on parse: `guest-${index}` |
| `name` | `string` | Required, non-empty, trimmed | Editable via inline rename in Step 2 |
| `labels` | `string[]` | Required, may be empty `[]` | Each string matches an entry in `availableLabels` |
| `tableId` | `string \| null` | — | `null` before Step 3 assignment |
| `seatIndex` | `number \| null` | 0-based | `null` before Step 3 assignment |

**Validation rules**:
- When navigating Step 1 → Step 2 with a modified guest list: guests whose names persist keep their existing `labels`; new names get `labels: []`; removed names are dropped.
- Rename preserves `labels` because identity is tracked by `id`, not `name`.

---

### SeatingPlan (v4)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `version` | `number` | Must equal `4` for current schema | Any other version returns `null` (fresh start) |
| `config` | `PlanConfig` | Required | Table count, seats per table, raw guest text |
| `guests` | `Guest[]` | Required | Includes `labels` |
| `tables` | `Table[]` | Required | Unchanged from v1 |
| `assigned` | `boolean` | Required | `true` when Step 4 chart is rendered |
| `availableLabels` | `string[]` | Required; `[]` is valid | Ordered list; index determines label colour |

**Schema versions**: v1, v2, v3 are all treated as invalid → return `null` → fresh start with `DEFAULT_LABELS`.

---

### PlanConfig (unchanged from v1)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `tableCount` | `number` | Required, ≥ 1, integer | |
| `seatsPerTable` | `number` | Required, ≥ 1, integer | |
| `rawGuestText` | `string` | Required | Preserved verbatim for Step 1 textarea |

---

### Table (unchanged from v1)

See `specs/001-wedding-seats-planner/data-model.md` — no changes.

---

## AppState (wizard extension)

```
AppState {
  step: 1 | 2 | 3 | 4
  rawGuestText: string
  guests: Guest[]               // includes labels from Step 2
  availableLabels: string[]     // master label list (predefined + custom)
  tableCount: number
  seatsPerTable: number
  tables: Table[]
  assigned: boolean
  selectedGuestId: string | null
  error: string | null
}
```

**Default initial `availableLabels`**:
```
['Magda', 'Piotr', 'Family', 'Friend', 'High school', 'Studies']
```

---

## Action Set

| Action | Payload | Effect |
|--------|---------|--------|
| `UPDATE_GUEST_TEXT` | `string` | Updates `rawGuestText`, clears `error` |
| `PARSE_AND_ADVANCE` | — | Parses names → creates/merges Guest objects → `step = 2` |
| `GO_BACK_TO_IMPORT` | — | `step = 1` (labels preserved on guests) |
| `TOGGLE_GUEST_LABEL` | `{ guestId, label }` | Adds or removes label from guest's `labels[]` |
| `ADD_LABEL` | `{ label }` | Appends new label text to `availableLabels` if not duplicate |
| `RENAME_GUEST` | `{ guestId, newName }` | Updates guest name; ignores empty string |
| `GO_TO_CONFIGURE` | — | `step = 3`; clears previous assignment |
| `GO_BACK_TO_LABELS` | — | `step = 2`; clears assignment |
| `UPDATE_TABLE_COUNT` | `number` | Updates `tableCount`, clears `error` |
| `UPDATE_SEATS_PER_TABLE` | `number` | Updates `seatsPerTable`, clears `error` |
| `ASSIGN` | — | Runs proximity algorithm → `assigned = true` → `step = 4` |
| `REASSIGN` | — | Re-runs proximity algorithm; stays on `step = 4` |
| `SELECT_GUEST` | `string \| null` | Sets `selectedGuestId` |
| `SWAP_GUESTS` | `{ firstId, secondId }` | Atomically swaps seat positions; clears selection |
| `RESTORE` | `Partial<AppState>` | Loads persisted v4 plan on mount |

---

## State Transitions (wizard flow)

```
IDLE (step=1)
  │  PARSE_AND_ADVANCE (non-empty list)
  ▼
LABEL_STEP (step=2)
  │  GO_BACK_TO_IMPORT          GO_TO_CONFIGURE
  ◄──────────────────            ────────────────►
                                 step=3, assignment cleared
CONFIGURE_STEP (step=3)
  │  ASSIGN (valid config)       GO_BACK_TO_LABELS
  ▼  ─────────────────          ◄────────────────
CHART (step=4)                   step=2, assignment cleared
  │  SWAP_GUESTS / SELECT_GUEST
  │  REASSIGN → re-runs proximity algorithm → stays step=4
  │  GO_BACK_TO_LABELS → step=2, assignment cleared
  └─ persistent (auto-saved after every mutation when guests.length > 0)
```

---

## Proximity Algorithm Data Flow

```
Input:  Guest[] (with labels), tableCount, seatsPerTable
         │
         ├─ computeAffinity(A, B)
         │    = |labels(A) ∩ labels(B)| + surnameBonus(A, B)
         │
         │    surnameBonus(A, B) = 10 if shared surname part
         │      (common prefix ≥ 5 chars, trailing diff ≤ 3 chars)
         │
         ├─ greedyClustering()
         │    For t = 0..tableCount-1:
         │      targetSize = Math.ceil(remaining.length / (tableCount - t))
         │      seed = argmax Σ affinity(g, remaining)
         │      fill cluster greedily until targetSize
         │
         ├─ For each cluster → greedyHamiltonianPath()
         │    path[0] = most-connected guest in cluster
         │    path[i+1] = argmax affinity(path[i], remaining)
         │
         └─ Assign positions (interleaved left/right):
              even i → left side: seatIndex = Math.floor(i/2)
              odd  i → right side: seatIndex = leftCount + Math.floor(i/2)
              leftCount = Math.ceil(capacity / 2)

Output: Guest[] (with tableId/seatIndex), Table[]
```

**No-label fallback**: if all guests have `labels.length === 0`, falls back to Fisher-Yates shuffle + round-robin assignment.

---

## Label Colour Derivation

Colours are never stored — derived at render time:

```
PALETTE = [
  { bg: '#7B1E2A', text: '#FFFDF7' },  // wine
  { bg: '#4A5E37', text: '#FFFDF7' },  // olive
  { bg: '#1E4D6B', text: '#FFFDF7' },  // Venetian blue
  { bg: '#8B4513', text: '#FFFDF7' },  // Siena brown
  { bg: '#6B3A7D', text: '#FFFDF7' },  // Florentine purple
  { bg: '#C4722A', text: '#FFFDF7' },  // Tuscan orange
  { bg: '#2C5F5D', text: '#FFFDF7' },  // sage teal
  { bg: '#5C3A7A', text: '#FFFDF7' },  // grape
]

labelColour(label) = PALETTE[availableLabels.indexOf(label) % PALETTE.length]
```

---

## i18n: Language Model

Language is **not** part of `SeatingPlan` — it is session-only React context.

```
Lang = 'pl' | 'en' | 'it'

Translation {
  title, subtitle: string
  steps: [string, string, string, string]   // step indicator labels
  guestInputLabel, guestInputPlaceholder: string
  next, back, addLabel, editGroups, reassign: string
  assignGroupsHeading, assignGroupsSubheading: string
  newLabelPlaceholder: string
  editNameHint, editNameTitle: string
  guestSummary: (guestCount: number, totalSeats: number) => string
  tablesLabel, seatsPerTableLabel, assignButton, assignAriaLabel: string
  leftSide, rightSide, selectedSuffix: string
  idleText: (assignButtonText: string) => string
  errors: {
    ERR_NO_GUESTS: string
    ERR_NO_GUESTS_ASSIGN: string
    ERR_NO_TABLES: string
    ERR_NO_SEATS: string
    ERR_CAPACITY_EXCEEDED: (seats: number, guests: number) => string
  }
  languageLabel: string
}
```

Default locale: `pl`. Step labels per locale:
- `pl`: Goście / Grupy / Stoły / Miejsca
- `en`: Guests / Groups / Tables / Seats
- `it`: Ospiti / Gruppi / Tavoli / Posti
