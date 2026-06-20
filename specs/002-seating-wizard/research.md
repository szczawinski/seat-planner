# Research: Multi-Step Seating Wizard

**Date**: 2026-06-20 (updated from 2026-06-19)
**Feature**: specs/002-seating-wizard/spec.md
**Builds on**: specs/001-wedding-seats-planner/plan.md (same tech stack, same repo)

## Decision Log

---

### D-001: Wizard State Architecture

**Decision**: Extend the existing `useReducer` in `App.tsx` with a `step: 1 | 2 | 3 | 4` field; all four screens share the same reducer and state tree.

**Rationale**: The app already uses a single `useReducer`. Adding a `step` field costs almost nothing — no new library, no routing, no context boundary. All wizard state (guests, labels, tables, chart) is live in one place, making backward navigation trivially safe.

**Alternatives considered**:
- **React Router with per-route state**: Adds routing overhead; state would need to be lifted to context or a store anyway.
- **Multiple `useState` calls**: Splits what is naturally one coherent state machine.
- **Zustand or Redux**: Overkill for a single-user, single-page, no-async workflow.

---

### D-002: Label Data Structure

**Decision**: Labels are stored as `string[]` on each `Guest` and as a master `string[]` (`availableLabels`) on the `AppState` / `SeatingPlan`. No separate `Label` entity with IDs.

**Rationale**: Labels are simple strings with no lifecycle of their own (no edit, no colour assignment, no delete). String arrays serialise cleanly to JSON and preserve display order.

**Default label set**: `['Magda', 'Piotr', 'Family', 'Friend', 'High school', 'Studies']` — short, composable labels that guests can combine freely (e.g. Magda + Family = Magda's family side).

**Alternatives considered**:
- **Label objects `{ id, text, color }`**: Premature — needed only when labels have user-editable metadata.
- **Full-phrase labels ("Magda's Family")**: Harder to combine; redundant when two labels can be stacked.

---

### D-003: Proximity Algorithm — Table Assignment (Clustering)

**Decision**: Greedy proportional clustering — seed with the guest with the highest summed affinity to all remaining guests, then fill greedily by adding the unassigned guest with the highest cumulative affinity to the current cluster.

**Rationale**: NP-hard problem at this scale; greedy heuristic is standard practice. Reliably keeps high-affinity guests together on the first pass.

**Affinity formula**:
```
affinity(A, B) = |labels(A) ∩ labels(B)| + surnameBonus(A, B)
```

**Alternatives considered**: k-means, simulated annealing, round-robin (used as no-label fallback).

---

### D-004: Proximity Algorithm — Within-Table Seat Arrangement

**Decision**: Greedy Hamiltonian path through the within-cluster affinity graph. Start with the most-connected guest; at each step add the unvisited guest with the highest affinity to the chain tail. Interleave left/right seats so consecutive high-affinity pairs sit across from each other rather than side-by-side.

**Rationale**: Consecutive seatIndices on the same side are physically adjacent. Interleaving (even i → left, odd i → right) ensures the highest-affinity pair (positions 0 and 1) sit directly across from each other, which is socially natural.

**Alternatives considered**: Optimal TSP (exponential), random within-cluster order (loses adjacency benefit).

---

### D-005: localStorage Schema Migration

**Decision**: Schema version field in `SeatingPlan`. Current version is `4`. Migration chain:
- v1 → v2: add `labels: []` to guests, add `availableLabels: []`
- v2 → v3: add `availableLabels: []` if missing (was already migrated)
- v3 → v4: drop — treat v1/v2/v3 as invalid (return null for a clean start)

**Rationale**: By v4 all data migrations have been superseded. A clean start is preferable to carrying forward potentially corrupt or stale label sets from earlier schema iterations.

---

### D-006: Step Indicator Design

**Decision**: Horizontal progress bar with 4 numbered step nodes. Completed steps show ✓ (gold fill), current step is wine-red, future steps are outlined. Step labels are i18n strings (see D-009).

**Rationale**: Linear wizard with 4 steps is universally understood. No routing needed — purely visual state driven by `AppState.step`.

---

### D-007: Label Colour Assignment

**Decision**: Colours derived at render time from `availableLabels.indexOf(labelText) % PALETTE.length`. Never stored in state.

**Palette**: 8 warm Italian hues — wine (`#7B1E2A`), olive (`#4A5E37`), Venetian blue (`#1E4D6B`), Siena brown (`#8B4513`), Florentine purple (`#6B3A7D`), Tuscan orange (`#C4722A`), sage teal (`#2C5F5D`), grape (`#5C3A7A`).

---

### D-008: Surname-Based Affinity Bonus

**Decision**: `computeAffinity(A, B)` adds a `surnameBonus(A, B)` of `+10` when guests share a surname (including Polish gendered suffixes like Kowalski/Kowalska — common prefix ≥ 5 chars, trailing diff ≤ 3 chars each).

**Rationale**: Families often share surnames without sharing labels. The bonus (equivalent to ~10 shared labels) ensures family members cluster together even when no labels are assigned, which matches the primary use case of a wedding seating planner.

**Alternatives considered**: Explicit "family" label — requires the planner to tag every family member; tedious and error-prone.

---

### D-009: Internationalisation (i18n)

**Decision**: Static `Translation` record with three locales — `pl` (Polish, default), `en` (English), `it` (Italian). Locale is held in React context (`LanguageContext`); all UI strings come from `useLang()`. Language selection is not persisted across sessions.

**Rationale**: The wedding is Polish; the app's Italian styling is thematic; English is the universal fallback. Three static objects are zero-dependency and trivial to extend. Session-only selection avoids storing an ephemeral preference in the shared plan state.

**Alternatives considered**: i18next / react-intl — overkill for 3 static locales with no pluralisation complexity beyond what inline functions handle.

---

### D-010: File-Based Persistence

**Decision**: Vite dev server plugin intercepts `POST /api/state` to write `wedding-state.json` in the repo root and `GET /api/state` to read it. `App.tsx` tries `loadFromFile()` first on mount; falls back to `load()` from localStorage. Both are always written on save.

**Rationale**: localStorage can be wiped by browser privacy tools. A file on the machine survives browser clears. The Vite plugin is dev-only; in production builds the fetch silently fails and the app falls back to localStorage.

**Alternatives considered**: IndexedDB — more persistent but API is asynchronous and complex; overkill for a JSON blob this size.

---

### D-011: Guest Rename

**Decision**: Double-click on guest name in Step 2 enters inline edit mode. `RENAME_GUEST` reducer action updates the guest's name while preserving all label assignments (guest identity is tracked by `id`, not `name`).

**Rationale**: Bulk textarea import inevitably produces typos. Renaming at Step 2 avoids losing label work from a re-import. Identity by `id` means labels are not accidentally cleared on rename.

**Alternatives considered**: Edit in textarea → re-import → labels lost. Not acceptable after labels are assigned.
