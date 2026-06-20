# Data Model: Wedding Seating Planner

**Date**: 2026-06-18
**Feature**: specs/001-wedding-seats-planner/spec.md

## Core Entities

---

### Guest

Represents a single wedding guest.

| Field        | Type            | Constraints                              | Notes                                   |
|--------------|-----------------|------------------------------------------|-----------------------------------------|
| `id`         | `string`        | Required, unique, stable across sessions | Generated from name + index at parse time (e.g., `guest-0`, `guest-1`) |
| `name`       | `string`        | Required, non-empty, trimmed             | Preserves original casing and accented characters |
| `tableId`    | `string \| null` | —                                        | `null` before assignment                |
| `seatIndex`  | `number \| null` | 0-based; < table capacity                | `null` before assignment                |

**Validation rules**:
- Blank lines in input are silently skipped.
- Leading/trailing whitespace is trimmed before storing.
- Duplicate names (exact string match after trimming) are allowed — they represent different guests with the same name. IDs distinguish them.

---

### Table

Represents one table at the wedding venue.

| Field      | Type       | Constraints                       | Notes                                                  |
|------------|------------|-----------------------------------|--------------------------------------------------------|
| `id`       | `string`   | Required, unique (e.g., `table-1`) | Stable sequential identifier                          |
| `label`    | `string`   | Required, non-empty               | Display name shown in the chart (e.g., `"Table 1"`)   |
| `capacity` | `number`   | Required, ≥ 1, integer            | Same for all tables (from user input)                  |
| `seats`    | `(string \| null)[]` | Length === `capacity`  | Each entry is a `Guest.id` or `null` for an empty seat |

**Invariants**:
- `seats.length` always equals `capacity`.
- A guest id appears in at most one `seats` array across all tables.
- After assignment, no guest id is `null` in any seat at a filled position; trailing `null`s represent genuinely empty seats (when guests < total capacity).

---

### SeatingPlan

The root document — the entire persisted state of one planning session.

| Field          | Type       | Constraints              | Notes                                                    |
|----------------|------------|--------------------------|----------------------------------------------------------|
| `version`      | `number`   | Required, integer, ≥ 1   | Schema version; current value: `1`                       |
| `config`       | `PlanConfig` | Required               | User-supplied configuration                              |
| `guests`       | `Guest[]`  | Required, may be empty   | Canonical list; IDs are the source of truth             |
| `tables`       | `Table[]`  | Required, may be empty   | Populated after assignment is triggered                  |
| `assigned`     | `boolean`  | Required                 | `true` if the current `tables` reflects a valid assignment |

---

### PlanConfig

Configuration values entered by the user before triggering assignment.

| Field          | Type     | Constraints        | Notes                              |
|----------------|----------|--------------------|------------------------------------|
| `tableCount`   | `number` | Required, ≥ 1, integer | Number of tables                |
| `seatsPerTable`| `number` | Required, ≥ 1, integer | Seats per table (uniform)       |
| `rawGuestText` | `string` | Required           | Preserved verbatim for the text area (allows editing after assignment) |

---

## State Transitions

```
┌─────────────────────────────────────────────┐
│                IDLE / SETUP                 │
│  (guest text empty, no assignment)          │
└────────────────────┬────────────────────────┘
                     │ user enters guests + config,
                     │ triggers "Assign Seats"
                     ▼
┌─────────────────────────────────────────────┐
│              VALIDATION                     │
│  • guest list non-empty?                    │
│  • tableCount ≥ 1?                          │
│  • total capacity ≥ guest count?            │
└────────┬───────────────────────┬────────────┘
         │ FAIL                  │ PASS
         ▼                       ▼
┌────────────────┐   ┌───────────────────────────┐
│  ERROR STATE   │   │       ASSIGNED             │
│  (error msg    │   │  (tables rendered, swap    │
│   displayed)   │   │   interactions enabled)    │
└────────────────┘   └───────┬───────────────────┘
                             │ user clicks a guest
                             ▼
                   ┌─────────────────────┐
                   │  GUEST SELECTED     │
                   │  (first guest       │
                   │   highlighted)      │
                   └──┬──────────────┬───┘
                      │ click same   │ click different
                      │ guest or     │ guest
                      │ empty area   │
                      ▼              ▼
                   ASSIGNED       ASSIGNED
                   (deselect)     (swap applied,
                                   deselect)
```

---

## Relationships

```
SeatingPlan
  ├── config: PlanConfig           (1-to-1)
  ├── guests: Guest[]              (1-to-many)
  └── tables: Table[]              (1-to-many)
        └── seats: (guestId|null)[] → references Guest.id
```

A `Guest` is linked to a `Table` via `Guest.tableId` (forward reference) and via `Table.seats[seatIndex]` (reverse reference). Both must be kept in sync whenever a swap occurs.

---

## Persistence Schema (localStorage)

**Key**: `wedding-seating-plan`

**Value**: JSON-serialized `SeatingPlan` object.

**On save**: Called after every state-changing operation (assignment trigger, swap completion).

**On load**: Called once at app startup. If the key is absent or the JSON is malformed, the app starts with a fresh empty state. If `version` differs from the current schema version, a migration function is applied before use (or the plan is discarded with a user-visible notice).

**Current schema version**: `1`
