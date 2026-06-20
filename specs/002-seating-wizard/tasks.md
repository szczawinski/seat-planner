# Tasks: Multi-Step Seating Wizard

**Input**: Design documents from `specs/002-seating-wizard/`

**Prerequisites**: plan.md ✓, spec.md ✓, data-model.md ✓, contracts/ ✓, research.md ✓, quickstart.md ✓

**Tests**: Existing unit and integration tests are updated (not new TDD) to reflect changed type signatures and wizard flow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US6)

---

## Phase 1: Foundational — Data Model + Services

**Purpose**: Types, storage schema (v4), proximity algorithm, and file persistence — shared prerequisites all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Update `src/types/index.ts` — add `labels: string[]` to `Guest` interface; add `availableLabels: string[]` to `SeatingPlan` interface
- [x] T002 Update `src/services/storageService.ts` — set `SCHEMA_VERSION = 4`; extract `parsePlan(data)` as a named export; `parsePlan`: if `data.version === 4` return `data as SeatingPlan`, else return `null`; `load()` calls `parsePlan(JSON.parse(raw))`
- [x] T003 Update `src/services/seatingAssigner.ts` — add `surnameParts(fullName)` and `surnamePartsMatch(a, b)` helpers; add `surnameBonus(a: Guest, b: Guest): number` (+10 on surname match); add `computeAffinity(a: Guest, b: Guest): number` (label intersection + surnameBonus); add `greedyClustering(guests, tableCount, seatsPerTable): Guest[][]`; add `greedyHamiltonianPath(cluster: Guest[]): Guest[]`; add `assignSeatsProximity(guests, tableCount, seatsPerTable)` (falls back to `assignSeats` when all labels empty); keep `assignSeats(guestList: Guest[], ...)` for no-label fallback
- [x] T004 [P] Create `src/services/fileStateService.ts` — `saveToFile(plan: SeatingPlan): Promise<void>` sends POST to `/api/state` with JSON body, fails silently on error; `loadFromFile(): Promise<SeatingPlan | null>` sends GET to `/api/state`, returns `parsePlan(await res.json())` or null on error/non-200
- [x] T005 [P] Update `tests/unit/seatingAssigner.test.ts` — pass `Guest[]` (with `labels: []`) to all existing tests; add tests: `computeAffinity` returns label intersection count; `surnameBonus` returns 10 for Kowalski/Kowalska, 0 for unrelated; `greedyClustering` places high-affinity guests in same cluster; `greedyHamiltonianPath` starts with most-connected guest; no-label guests get valid distribution via `assignSeatsProximity`
- [x] T006 [P] Update `tests/unit/storageService.test.ts` — update `mockPlan` fixtures to v4 schema (add `labels: []`, `availableLabels: []`, `version: 4`); add test: v1/v2/v3 data returns `null`; add test: v4 data is returned as-is; add test: corrupt JSON returns `null`

**Checkpoint**: Run `npx vitest run tests/unit` — all unit tests pass before proceeding.

---

## Phase 2: i18n Infrastructure (Prerequisite for all UI phases)

**Purpose**: Translation records and context — required by every UI component.

**⚠️**: Complete before any React component work.

- [x] T007 Create `src/i18n/translations.ts` — define `Lang = 'pl' | 'en' | 'it'`; define `Translation` interface with all string fields and function fields (`guestSummary`, `idleText`, `errors.ERR_CAPACITY_EXCEEDED`); implement `pl`, `en`, `it` objects; export `translations: Record<Lang, Translation>`; export `translateError(errorKey: string, t: Translation): string` (handles `ERR_CAPACITY_EXCEEDED:seats:guests` prefix)
- [x] T008 Create `src/i18n/LanguageContext.tsx` — `LangContext` with `{ lang: Lang; t: Translation; setLang: (l: Lang) => void }`; `LanguageProvider` wraps children with `useState<Lang>('pl')`; `useLang()` hook returns context value
- [x] T009 [P] Create `src/components/LanguagePicker/LanguagePicker.tsx` and `LanguagePicker.module.css` — compact selector showing `PL | EN | IT` options; calls `useLang().setLang()`; Italian parchment styling matching app aesthetic

---

## Phase 3: User Story 1 — Import Guest List (Priority: P1) 🎯 MVP

**Goal**: Replace single-screen layout with a 4-step wizard shell. Step 1 renders the guest import textarea with a step indicator above it and a language picker in the header.

**Independent Test**: Open the app — StepIndicator shows Step 1 active. Paste 5 guest names, click Next — app advances to Step 2 showing 5 guests. Leave textarea empty, click Next — inline error stays on Step 1.

- [x] T010 [US1] Create `src/components/StepIndicator/StepIndicator.tsx` — accepts `{ currentStep: 1|2|3|4 }`; renders 4 horizontal nodes with labels from `useLang().steps`; completed (✓ gold fill), active (wine-red fill), future (outlined muted); connector lines between nodes
- [x] T011 [P] [US1] Create `src/components/StepIndicator/StepIndicator.module.css` — horizontal flex layout, node circles, connector lines; Italian palette (gold `#B8952A`, wine `#7B1E2A`, muted `#C4B49A`); Playfair Display font for step labels
- [x] T012 [US1] Rewrite `src/App.tsx` — wrap entire app in `<LanguageProvider>`; define `AppState` with `step: 1|2|3|4`, `rawGuestText`, `availableLabels` (initial: `['Magda', 'Piotr', 'Family', 'Friend', 'High school', 'Studies']`), `tableCount`, `seatsPerTable`, `guests`, `tables`, `assigned`, `selectedGuestId`, `error`; define all `AppAction` types; implement `reducer`; add `UPDATE_GUEST_TEXT` and `PARSE_AND_ADVANCE` (parses names, merges labels for recurring names, sets `step=2` or sets `error='ERR_NO_GUESTS'`) and `GO_BACK_TO_IMPORT` (sets `step=1`) cases; render `<LanguagePicker />` in header; render `<StepIndicator currentStep={state.step} />`; render Step 1 (GuestInput + Next button + error) when `state.step === 1`

**Checkpoint**: `npm run dev` — paste names, click Next → Step 2 placeholder visible. Empty list → inline error.

---

## Phase 4: User Story 2 — Assign Group Labels (Priority: P1)

**Goal**: Step 2 shows every guest with toggle buttons for each available label, plus a custom label creator. Back navigation preserves labels.

**Independent Test**: On Step 2 with 8 guests — click "Magda" next to Alice, badge fills. Click again, badge empties. Type "VIP", click Add — VIP appears for every guest. Click Back — returns to Step 1 with guest text intact.

- [x] T013 [P] [US2] Create `src/components/LabelStep/LabelBadge.tsx` and `LabelBadge.module.css` — pill button; `selected=true` → filled `color.bg`; `selected=false` → outlined; accepts `{ label, color: { bg, text }, selected, onClick, size?: 'sm'|'md' }`; Italian font styling
- [x] T014 [P] [US2] Create `src/components/LabelStep/GuestLabelRow.tsx` and `GuestLabelRow.module.css` — guest name on left (Cormorant Garamond); `LabelBadge` row on right; accepts `{ guest, availableLabels, labelPalette, onToggleLabel, onRename }`; derives colour from `labelPalette[availableLabels.indexOf(label) % 8]`; double-click on name → inline `<input>` for rename (Enter or blur confirms; empty string restores original)
- [x] T015 [US2] Create `src/components/LabelStep/LabelStep.tsx` and `LabelStep.module.css` — full Step 2 screen; scrollable `GuestLabelRow` list; text input + "Add Label" button (empty/duplicate no-op); Back and Next buttons; heading and subheading from `useLang()`; accepts `{ guests, availableLabels, onToggleLabel, onAddLabel, onRename, onBack, onNext }`
- [x] T016 [US2] Add to `reducer` in `src/App.tsx` — `TOGGLE_GUEST_LABEL { guestId, label }` (toggle label in guest's `labels[]`); `ADD_LABEL { label }` (append to `availableLabels` if not duplicate); `GO_TO_CONFIGURE` (sets `step=3`, clears `assigned/tables/error`); `GO_BACK_TO_LABELS` (sets `step=2`, clears `assigned/tables/selectedGuestId/error`); render `<LabelStep />` when `state.step === 2`

**Checkpoint**: Navigate Step 1 → Step 2. Toggle labels, add custom label, navigate back — labels intact on return.

---

## Phase 5: User Story 2b — Rename Guests (Priority: P2)

**Goal**: Double-click on a guest name in Step 2 enters inline edit mode. Confirming the rename updates the name without clearing label assignments.

**Independent Test**: On Step 2, double-click "Alic" — editable field appears. Type "Alice", press Enter — row shows "Alice" with all labels intact. Clear the field and press Enter — original name is restored.

- [x] T017 [US2b] Add `RENAME_GUEST { guestId, newName }` action to `reducer` in `src/App.tsx` — trims `newName`; if empty, ignores; otherwise updates `guest.name`; wire `onRename` prop from Step 2 render to `dispatch({ type: 'RENAME_GUEST', payload: { guestId, newName } })`

**Checkpoint**: Double-click name in Step 2 → editable. Rename → name updates, labels preserved. Clear field → name unchanged.

---

## Phase 6: User Story 3 — Configure Tables and Assign with Proximity (Priority: P1)

**Goal**: Step 3 shows the table configurator with a Back button and guest count summary. Triggering assignment runs the proximity algorithm and advances to Step 4.

**Independent Test**: With 12 guests (6 "Magda"+"Family", 6 "Piotr"+"Family"), configure 2 tables × 6. Click Assign. Step 4 opens — Table 1 contains predominantly Magda's side, Table 2 predominantly Piotr's side.

- [x] T018 [US3] Update `src/components/ConfigPanel/ConfigPanel.tsx` — add `onBack: () => void` and `guestCount: number` props; render "← Back" button calling `onBack`; render guest summary line using `t.guestSummary(guestCount, tableCount * seatsPerTable)`; all strings from `useLang()`
- [x] T019 [P] [US3] Update `src/components/ConfigPanel/ConfigPanel.module.css` — add styles for `.backButton` (muted, borderless) and `.guestSummary` (small italic, gold tint) matching Italian parchment aesthetic
- [x] T020 [US3] Wire Step 3 in `src/App.tsx` — render `<ConfigPanel onBack={...} guestCount={state.guests.length} .../>` when `state.step === 3`; `ASSIGN` reducer case: call `validatePlan`, on error set `state.error`; on success call `assignSeatsProximity(state.guests, state.tableCount, state.seatsPerTable)`, set `step=4`, `assigned=true`
- [x] T021 [US3] Add `REASSIGN` action to `reducer` in `src/App.tsx` — re-runs `assignSeatsProximity` with current guests and config; updates `guests` and `tables`; stays on `step=4`

**Checkpoint**: Step 3 renders with guest count and Back button. Assign advances to Step 4. Insufficient capacity shows error. No-label guests still get assigned.

---

## Phase 7: User Story 4 — View Chart and Swap Guests (Priority: P2)

**Goal**: Step 4 renders the full seating chart. "Edit Groups" returns to Step 2 with labels intact. "Re-assign" reruns the algorithm. Swap still works with two clicks.

**Independent Test**: Assign 10 guests. Click Alice (highlighted). Click Bob — swap occurs. Chart updates immediately. Click "Edit Groups" — Step 2 opens with all labels present.

- [x] T022 [US4] Wire Step 4 in `src/App.tsx` — render `<SeatingChart />` when `state.step === 4`; render "Edit Groups" button (dispatches `GO_BACK_TO_LABELS`) and "Re-assign" button (dispatches `REASSIGN`) in `chartControls` row; implement `handleGuestClick` (SELECT_GUEST on first click, SWAP_GUESTS on second, deselect on same-guest click); `handleChartClick` deselects on chart background click
- [x] T023 [US4] Update `RESTORE` action in `src/App.tsx` reducer — accept v4 `SeatingPlan` shape; restore `availableLabels` (fall back to `DEFAULT_LABELS` if empty); if `plan.assigned === true` set `step=4`, else set `step=1`; restore all other `AppState` fields
- [x] T024 [US4] Update `tests/integration/seatingPlan.test.tsx` — update `assignSeats` test helper to navigate the wizard (fill textarea → click Next → skip label step → configure tables/seats → click Assign); update swap test to use `data-testid="table-card"` for stable references; add test: loading a saved v4 plan via `localStorage` restores Step 4 with `availableLabels`

**Checkpoint**: Full round trip: import → label → configure → chart. Swap works. Edit Groups returns labels intact.

---

## Phase 8: User Story 5 — Interface Language Selection (Priority: P2)

**Goal**: A language picker in the header allows switching between Polish, English, and Italian. All UI text updates immediately.

**Independent Test**: Open app (PL default). Switch to English — step labels read "Guests / Groups / Tables / Seats", all buttons in English. Switch to Italian — step labels read "Ospiti / Gruppi / Tavoli / Posti". Refresh — app resets to Polish.

- [x] T025 [US5] Wire `<LanguagePicker />` into `AppContent` header in `src/App.tsx` — already imported; ensure it renders inside `<LanguageProvider>` wrapper; confirm all `useLang()` calls throughout the app use the same context; confirm refreshing resets to `pl` (no persistence)

**Checkpoint**: Switch language → all text updates. Refresh → Polish.

---

## Phase 9: User Story 6 — Durable File-Based State Persistence (Priority: P2)

**Goal**: State is synced to a local file via the Vite dev server; on load, file takes priority over localStorage. Falls back silently in production.

**Independent Test**: Assign seats, clear localStorage in DevTools, refresh — app restores from file to Step 4.

- [x] T026 [US6] Add `local-state-persist` plugin to `vite.config.ts` — plugin `configureServer` intercepts `GET /api/state` (reads `./wedding-state.json` or 404) and `POST /api/state` (writes `./wedding-state.json` from request body)
- [x] T027 [US6] Wire dual persistence in `src/App.tsx` — on mount: `useEffect` calls `loadFromFile()` first, falls back to `load()` from `localStorage`; dispatches `RESTORE` if plan found; on state change: `useEffect` watching `[guests, tables, availableLabels, assigned, tableCount, seatsPerTable, rawGuestText]` calls `save(plan)` (localStorage) and `saveToFile(plan)` (file, async) when `guests.length > 0`; plan written with `version: 4 as const`

**Checkpoint**: Save state, clear localStorage, refresh → Step 4 restored from file. Build with `npm run build` → no errors (file API calls fail silently).

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Validation, build correctness, and performance.

- [x] T028 Run all 10 scenarios from `specs/002-seating-wizard/quickstart.md` manually in `npm run dev` browser session and confirm each expected outcome matches
- [x] T029 Run `npm run build` — resolve any TypeScript compilation errors
- [x] T030 [P] Performance check — load 200 guests into Step 1, advance to Step 3, trigger Assign; confirm chart renders in under 100ms (verify in browser DevTools Performance panel)

---

## Phase 11: User Story 7 — Couple Detection and Visual Coloring (Priority: P2)

**Goal**: `assignCoupleIds` runs on guest import; couples get shared colour in Steps 2 and 4. Couple-aware seat placement keeps pairs adjacent on same side.

**Independent Test**: Import "Marek Kałudzki\nIzabela Kałudzka" → both rows show same-colour left border in Step 2. Assign seats → both appear at same table, same side, adjacent, with same-colour border.

- [x] T031 Add `coupleId: string | null` to `Guest` interface in `src/types/index.ts`; update `parsePlan` in `src/services/storageService.ts` to normalise missing `coupleId` via `{ ...g, coupleId: g.coupleId ?? null }`
- [x] T032 [P] Add `assignCoupleIds(guests: Guest[]): Guest[]` to `src/services/seatingAssigner.ts` — scans adjacent pairs using existing `surnameParts`/`surnamePartsMatch`; assigns `couple-N` ids
- [x] T033 [P] Add `arrangeClusterWithCouples(cluster, leftCount)` and update `assignSeatsProximity` in `src/services/seatingAssigner.ts` — packs couple units sequentially so both members land on the same side in adjacent seats; falls back to random when all labels empty AND no couples
- [x] T034 Add `COUPLE_PALETTE` constant and `coupleColorMap` `useMemo` to `src/App.tsx`; call `assignCoupleIds(raw)` in `PARSE_AND_ADVANCE` reducer case; pass `coupleColorMap` to `LabelStep` and `SeatingChart`
- [x] T035 [P] Update `src/components/LabelStep/GuestLabelRow.tsx` — add `coupleColor?: string` and `isCheckedForPair`/`isPairDisabled`/`onPairCheck` props; render checkbox and apply `borderLeft` when colour present
- [x] T036 [P] Update `src/components/SeatingChart/SeatingChart.tsx` and `src/components/TableCard/TableCard.tsx` — accept and thread `coupleColorMap: Map<string, string>`; apply `borderLeft` on `SeatItem` when guest has a couple colour
- [x] T037 Update `tests/unit/storageService.test.ts` — add `coupleId: null` to all `mockPlan` guest fixtures so `parsePlan` round-trip test passes

---

## Phase 12: User Story 8 — Manual Couple Pairing (Priority: P2)

**Goal**: Checkboxes in Step 2 let the planner select exactly 2 guests and click "Stwórz parę" to assign them a shared coupleId. Checkboxes reset afterwards.

**Independent Test**: Check "Anna Nowak" and "Jan Kowalski" — "Stwórz parę" bar appears with both names. Click button → both names gain shared colour, checkboxes clear.

- [x] T038 Add `PAIR_GUESTS { idA, idB }` action to `src/App.tsx` reducer — computes next `couple-N` from existing unique coupleIds; overwrites both guests' coupleId; add `onPairGuests` prop to `LabelStep` and wire dispatch
- [x] T039 [P] Update `src/components/LabelStep/LabelStep.tsx` — add `checkedForPair: string[]` local state; `handlePairCheck` limits selection to 2; show `.pairBar` (name + button) when 2 selected, `.pairHint` otherwise; add `onPairGuests` prop; add `createCouple`/`createCoupleHint` to all three translation locales in `src/i18n/translations.ts`

---

## Phase 13: Cloud Run Deployment

**Goal**: App is containerised and deployed to Google Cloud Run as a publicly accessible static site.

- [x] T040 Create `Dockerfile` — multi-stage: `node:20-alpine` build stage runs `npm ci && npm run build`; `nginx:alpine` serve stage copies `dist/` and listens on port 8080
- [x] T041 [P] Create `nginx.conf` — `listen 8080`; `try_files $uri $uri/ /index.html` for SPA routing; gzip enabled
- [x] T042 [P] Create `.dockerignore` — exclude `node_modules/`, `dist/`, `.git/`, `*.log`, `wedding-state.json`, `.specify/`, `specs/`, `tests/`
- [x] T043 Deploy via `gcloud run deploy seats-planner --source . --region europe-central2 --allow-unauthenticated --project cusina-ai`; fix TS2783 double-`coupleId` spread error in `storageService.ts` that surfaced only under `tsc -b`
- [x] T044 [P] Initialise git repo, add `.gitignore`, push all code to `https://github.com/szczawinski/seat-planner`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately; BLOCKS all user stories
- **i18n (Phase 2)**: Requires Phase 1 types; BLOCKS all UI phases
- **US1 (Phase 3)**: Requires Phase 1 + Phase 2
- **US2 (Phase 4)**: Requires US1 complete (T010–T012) — LabelStep lives inside wizard shell
- **US2b (Phase 5)**: Requires US2 complete (T013–T016) — rename extends GuestLabelRow
- **US3 (Phase 6)**: Requires US2b complete — ConfigPanel Back button links to Step 2
- **US4 (Phase 7)**: Requires US3 complete — Step 4 needs ASSIGN flow
- **US5 (Phase 8)**: Requires Phase 2 complete; can run parallel to US2–US4
- **US6 (Phase 9)**: Requires Phase 1 complete (fileStateService + storageService types)
- **Polish (Phase 10)**: Requires all user stories complete

### Parallel Opportunities Within Phases

- T004, T005, T006 can run in parallel after T001–T003
- T008, T009 can run in parallel after T007
- T010, T011 can run in parallel (TSX vs CSS)
- T013, T014 can run in parallel (different files)
- T018, T019 can run in parallel (TSX vs CSS)
- T029, T030 can run in parallel

---

## Parallel Example: Foundational Phase

```text
Sequential: T001 → T002 → T003
Then parallel:
  Task A: T004 (fileStateService)
  Task B: T005 (seatingAssigner tests)
  Task C: T006 (storageService tests)
```

## Parallel Example: US2 (Label Step)

```text
Parallel first pass:
  Task A: T013 (LabelBadge component + CSS)
  Task B: T014 (GuestLabelRow component + CSS)
Then sequential:
  T015 (LabelStep — depends on LabelBadge + GuestLabelRow)
  T016 (App.tsx wiring — depends on LabelStep)
```

---

## Implementation Strategy

### MVP First (US1–US3, skip rename/i18n/file initially)

1. Complete Phase 1: Foundational
2. Complete Phase 2: i18n (minimal — just `pl` locale)
3. Complete Phase 3: US1 (wizard shell + Step 1)
4. Complete Phase 4: US2 (label step)
5. Complete Phase 6: US3 (configure + assign)
6. **STOP and validate**: Chart renders, proximity algorithm places similar guests together
7. Add Phase 5: US2b (rename)
8. Add Phase 7: US4 (swap, persist, edit groups)
9. Add Phase 8: US5 (i18n EN + IT)
10. Add Phase 9: US6 (file persistence)
11. Polish

### Incremental Delivery

1. Foundational + i18n → unit tests pass
2. + US1 → wizard shell visible, Step 1 navigates to Step 2 skeleton
3. + US2 → labels can be toggled and persist on back-navigation
4. + US3 → proximity assignment produces a chart
5. + US2b → guest names editable inline
6. + US4 → swap, refresh restore, re-assign all work
7. + US5 + US6 → language switching and file persistence
8. + Polish → build clean, all 10 quickstart scenarios pass

---

## Notes

- `[P]` tasks touch different files and have no incomplete-task dependencies — safe to run concurrently
- `[US1–US6]` labels provide traceability to `spec.md` user stories
- Each story phase ends with an independently testable checkpoint
- Run `npx vitest run` before each commit
- `storageService.save()` and `saveToFile()` are called in a `useEffect` watching state, not inside the reducer — keep reducers pure
- `SCHEMA_VERSION = 4`; v1/v2/v3 all return null → fresh start with `DEFAULT_LABELS`
