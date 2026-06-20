# Tasks: Wedding Seating Planner

**Input**: Design documents from `specs/001-wedding-seats-planner/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/storage-schema.md ✓, quickstart.md ✓

**Tests**: Unit tests included for pure business logic (seatingAssigner, storageService). Integration test included for the swap flow. No TDD requirement in spec — tests are written alongside implementation.

**Organization**: Tasks are grouped by user story to enable independent, incremental delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to ([US1], [US2], [US3])

---

## Phase 1: Setup (Project Scaffold)

**Purpose**: Initialize the Vite + React + TypeScript project and configure the test runner.

- [ ] T001 Scaffold Vite + React + TypeScript project at repository root: `npm create vite@latest . -- --template react-ts`
- [ ] T002 Install dev dependencies: `npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`
- [ ] T003 [P] Configure Vitest in `vite.config.ts`: add `test` block with `globals: true`, `environment: 'jsdom'`, `setupFiles: ['tests/setup.ts']`
- [ ] T004 [P] Create `tests/setup.ts` importing `@testing-library/jest-dom` to enable custom matchers
- [ ] T005 [P] Add `"test": "vitest"` and `"test:ui": "vitest --ui"` scripts to `package.json`
- [ ] T006 [P] Delete default Vite boilerplate: remove `src/App.css`, `src/assets/`, clear placeholder content from `src/App.tsx`; set `<title>Wedding Seating Planner</title>` in `index.html`

**Checkpoint**: `npm run dev` starts the dev server; `npm test` runs (no tests yet, exits cleanly)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and services that every user story depends on. Must be complete before any component work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T007 Create `src/types/index.ts` with TypeScript interfaces: `Guest`, `Table`, `PlanConfig`, `SeatingPlan` — exact shapes from `specs/001-wedding-seats-planner/data-model.md`
- [ ] T008 [P] Create `src/services/seatingAssigner.ts` with three exported functions: `parseGuests(rawText: string): string[]` (trim, filter blanks), `validatePlan(guests, tableCount, seatsPerTable): string | null` (returns error message or null), `assignSeats(guests, tableCount, seatsPerTable): { guests: Guest[], tables: Table[] }` (Fisher-Yates shuffle + round-robin distribution)
- [ ] T009 [P] Create `src/services/storageService.ts` with `save(plan: SeatingPlan): void`, `load(): SeatingPlan | null`, `clear(): void`; key = `wedding-seating-plan`; schema version = 1; catches malformed JSON and version mismatch by returning `null`
- [ ] T010 [P] Write unit tests for seatingAssigner in `tests/unit/seatingAssigner.test.ts`: even distribution (20 guests / 4 tables = 5 each), uneven distribution (22 guests / 4 tables — no omissions), over-capacity validation error, empty list validation error, zero tables validation error
- [ ] T011 [P] Write unit tests for storageService in `tests/unit/storageService.test.ts`: save then load returns identical object, missing key returns null, malformed JSON returns null, version mismatch returns null

**Checkpoint**: `npm test` passes all unit tests for seatingAssigner and storageService

---

## Phase 3: User Story 1 — Set Up Guest List and Tables (Priority: P1) 🎯 MVP

**Goal**: User enters guest names and table configuration, clicks "Assign Seats", and receives a computed seating assignment that is auto-saved to device storage.

**Independent Test**: Enter 20 guest names, set 4 tables × 5 seats, click Assign — all 20 guests assigned, plan survives page refresh (quickstart Scenarios 1 and 8).

### Implementation for User Story 1

- [ ] T012 [US1] Create `src/components/GuestInput/GuestInput.tsx` and `GuestInput.module.css`: controlled `<textarea>` with label "Guest Names (one per line)"; accepts `value: string` and `onChange: (text: string) => void` props per `contracts/storage-schema.md`
- [ ] T013 [P] [US1] Create `src/components/ConfigPanel/ConfigPanel.tsx` and `ConfigPanel.module.css`: two `<input type="number">` fields (Tables, Seats per table), an "Assign Seats" button, and an error message area; accepts props per `contracts/storage-schema.md` `ConfigPanelProps`
- [ ] T014 [US1] Implement App-level state in `src/App.tsx` using `useReducer`; define `AppState` (rawGuestText, tableCount, seatsPerTable, guests, tables, assigned, selectedGuestId, error) and actions: `UPDATE_GUEST_TEXT`, `UPDATE_CONFIG`, `ASSIGN`; the `ASSIGN` action calls `validatePlan` and, on success, `assignSeats` from seatingAssigner
- [ ] T015 [US1] Wire `storageService` into `src/App.tsx`: call `load()` inside a `useEffect` on mount to restore saved state; call `save()` inside a second `useEffect` that runs whenever `assigned` is true and state changes (FR-012)
- [ ] T016 [US1] Render `GuestInput` and `ConfigPanel` in `src/App.tsx`, passing reducer state slices and dispatch-wrapped handlers; display validation error from `AppState.error` via `ConfigPanel`'s `error` prop

**Checkpoint**: Guest input + Assign button functional; assignment computed; plan persists across refresh. Chart not yet rendered — verify by logging `state.tables` to console.

---

## Phase 4: User Story 2 — View Seating Chart (Priority: P1)

**Goal**: After assignment, all tables are rendered in a clear visual grid with guest names shown on each table card.

**Independent Test**: After assignment, all tables appear with correct guest names; layout is legible at 1280×800 without horizontal scroll (quickstart Scenarios 2, 4, 5).

### Implementation for User Story 2

- [ ] T017 [US2] Create `src/components/TableCard/TableCard.tsx` and `TableCard.module.css`: renders table label ("Table 1"), a list of guest names (resolving seat guest IDs to names), and empty-seat placeholders; accepts `TableCardProps` from `contracts/storage-schema.md`
- [ ] T018 [P] [US2] Create `src/components/SeatingChart/SeatingChart.tsx` and `SeatingChart.module.css`: renders all tables using CSS Grid (`grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`); shows an idle message ("Enter guests and click Assign Seats") when `tables` is empty; accepts `SeatingChartProps` from `contracts/storage-schema.md`
- [ ] T019 [US2] Wire `SeatingChart` into `src/App.tsx`: pass `tables`, `guests`, `selectedGuestId`, and `onGuestClick` handler; render `SeatingChart` below the input controls
- [ ] T020 [US2] Style `src/App.module.css`: constrain app to `max-width: 1400px`, center with `margin: 0 auto`, ensure no horizontal overflow at 1280px viewport width (SC-004)
- [ ] T021 [US2] Manual verification: open app at 1280×800, assign 20 guests across 4 tables, confirm all names visible without horizontal scroll (quickstart Scenario 5)

**Checkpoint**: Full end-to-end working — enter guests → assign → view chart → refresh → chart restored (US1 + US2 both functional)

---

## Phase 5: User Story 3 — Swap Two Guests (Priority: P2)

**Goal**: Clicking a guest highlights them as selected; clicking a second guest swaps their seats immediately and clears the selection.

**Independent Test**: Click Alice (Table 1), then Bob (Table 3) — Alice now at Table 3, Bob at Table 1; swap is reflected instantly and survives refresh (quickstart Scenarios 6 and 7).

### Implementation for User Story 3

- [ ] T022 [US3] Add `SELECT_GUEST` and `SWAP_GUESTS` actions to the App reducer in `src/App.tsx`: `SELECT_GUEST` sets `selectedGuestId`; `SWAP_GUESTS` atomically updates both `Guest.tableId`/`seatIndex` records and the two `Table.seats` arrays, then clears `selectedGuestId`
- [ ] T023 [US3] Implement `onGuestClick` handler in `src/App.tsx`: if no guest selected → dispatch `SELECT_GUEST`; if same guest clicked → dispatch `SELECT_GUEST` with null (deselect, FR-009); if different guest clicked → dispatch `SWAP_GUESTS` (FR-008)
- [ ] T024 [US3] Update `src/components/TableCard/TableCard.tsx` to accept `selectedGuestId` prop and apply a `selected` CSS class to the matching guest name element; add `.selected` rule in `TableCard.module.css` (e.g., contrasting background or bold border) (FR-007)
- [ ] T025 [US3] Add click handler on empty table area in `src/components/TableCard/TableCard.tsx` to dispatch deselect when `selectedGuestId` is set and the click target is not a guest item (FR-009); stop propagation on guest item click
- [ ] T026 [US3] Write integration test for swap flow in `tests/integration/seatingPlan.test.tsx`: render App, assign guests, click guest A, verify highlight, click guest B, verify positions swapped in rendered output

**Checkpoint**: All three user stories functional. Full flow: enter → assign → view → swap → refresh → restored.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, build verification, and final validation against all quickstart scenarios.

- [ ] T027 [P] Add keyboard accessibility to guest name items in `src/components/TableCard/TableCard.tsx`: set `tabIndex={0}`, add `onKeyDown` handler triggering click on Enter/Space (FR-006 accessibility)
- [ ] T028 [P] Add `aria-label` to the "Assign Seats" button and `role="status"` with `aria-live="polite"` to the error message container in `src/components/ConfigPanel/ConfigPanel.tsx`
- [ ] T029 Run all quickstart.md validation scenarios 1–8 manually; record any failures and fix before T030
- [ ] T030 [P] Run `npm run build` and confirm output in `dist/` with zero TypeScript errors and zero build warnings
- [ ] T031 [P] Performance check: generate 200-guest list, assign, confirm chart renders in under 3 seconds (SC-001)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 complete — **blocks all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 complete
- **Phase 4 (US2)**: Depends on Phase 3 complete (SeatingChart needs assignment state wired in App)
- **Phase 5 (US3)**: Depends on Phase 4 complete (swap interaction is added to existing components)
- **Phase 6 (Polish)**: Depends on Phase 5 complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — foundational services exist
- **US2 (P1)**: Depends on US1 (needs App state + assignment logic already wired)
- **US3 (P2)**: Depends on US2 (adds interaction layer to the rendered chart)

### Within Each Phase

- Tasks marked [P] in the same phase can be worked simultaneously
- T007 (types) must complete before T008 and T009 (services use the types)
- T008 and T009 can run in parallel after T007
- T010 and T011 (unit tests) can run in parallel with T008 and T009 (write tests while implementing)

### Parallel Opportunities

```
Phase 1:  T001 → T002 → [T003, T004, T005, T006] in parallel
Phase 2:  T007 → [T008, T009] in parallel → [T010, T011] in parallel
Phase 3:  T012 → T013 in parallel → T014 → T015 → T016
Phase 4:  T017 → [T018, T020] in parallel → T019 → T021
Phase 5:  T022 → T023 → [T024, T025] in parallel → T026
Phase 6:  [T027, T028, T030, T031] in parallel → T029
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete **Phase 1**: Setup — project scaffold ready
2. Complete **Phase 2**: Foundational — types + services tested
3. Complete **Phase 3**: User Story 1 — input and assignment working
4. Complete **Phase 4**: User Story 2 — visual chart displayed
5. **STOP and VALIDATE**: Run quickstart Scenarios 1, 2, 3, 4, 5, 8
6. Demo / share — app is fully usable for basic planning

### Full Feature (Add US3)

7. Complete **Phase 5**: User Story 3 — swap interactions working
8. **VALIDATE**: Run quickstart Scenarios 6 and 7
9. Complete **Phase 6**: Polish + build check

### Single-developer sequence (no parallelism)

T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023 → T024 → T025 → T026 → T027 → T028 → T029 → T030 → T031

---

## Notes

- [P] tasks = different files, no hard dependency on sibling tasks in same phase
- Each phase ends with a verifiable checkpoint — stop and test before proceeding
- `storageService` is the only code that reads/writes `localStorage` (contract rule)
- Swap logic must update both Guest fields and Table.seats atomically in the reducer (data-model.md invariant)
- Avoid any `any` types — all state must be typed via `src/types/index.ts`
