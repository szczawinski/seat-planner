# Implementation Plan: Multi-Step Seating Wizard

**Branch**: `002-seating-wizard` | **Date**: 2026-06-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-seating-wizard/spec.md`

## Summary

Rebuild the wedding seating planner as a 4-step wizard (import → label → configure → chart) with proximity-based greedy clustering, inline guest rename, three-locale i18n (PL/EN/IT), file-based persistence via Vite dev plugin, and surname-affinity bonus. Schema version bumped to 4; previous versions treated as invalid (fresh start).

## Technical Context

**Language/Version**: TypeScript 5.8 + React 19

**Primary Dependencies**: Vite 6, Vitest 3 + React Testing Library 16, @testing-library/jest-dom 6

**Storage**: `localStorage` key `wedding-seating-plan` schema v4; `/api/state` Vite plugin for file-based persistence (dev only)

**Testing**: Vitest + React Testing Library + jsdom

**Target Platform**: Desktop web browsers

**Project Type**: SPA — no backend, no routing

**Performance Goals**: Proximity algorithm < 100ms for 200 guests

**Constraints**: No new npm dependencies; Italian wedding styling preserved; schema v4 (v1/v2/v3 treated as invalid)

**Scale/Scope**: Up to 200 guests, up to 40 tables

## Constitution Check

Constitution file is a template (unpopulated) — no gates to validate. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-seating-wizard/
├── plan.md                          # This file
├── research.md                      # D-001 through D-011 decisions
├── data-model.md                    # Guest v4, SeatingPlan v4, AppState, i18n model
├── quickstart.md                    # 10 end-to-end validation scenarios
├── contracts/
│   └── component-contracts.md      # Component prop contracts + storage schema v4
└── tasks.md                         # Created by /speckit-tasks
```

### Source Code

```text
MODIFIED:
src/types/index.ts                          # Guest: +labels; SeatingPlan: +availableLabels
src/services/storageService.ts             # SCHEMA_VERSION=4; v1/v2/v3 → null
src/services/seatingAssigner.ts            # computeAffinity (surname bonus), greedyClustering,
                                           # greedyHamiltonianPath, assignSeatsProximity
src/App.tsx                                # 4-step wizard useReducer; i18n LanguageProvider;
                                           # dual persistence (file + localStorage)
src/App.module.css                         # Step-aware layout; chartControls; stepNav

MODIFIED EXISTING:
src/components/ConfigPanel/ConfigPanel.tsx  # +onBack, +guestCount props
src/components/ConfigPanel/ConfigPanel.module.css

NEW:
src/components/StepIndicator/
├── StepIndicator.tsx
└── StepIndicator.module.css

src/components/LabelStep/
├── LabelStep.tsx
├── LabelStep.module.css
├── GuestLabelRow.tsx
├── GuestLabelRow.module.css
├── LabelBadge.tsx
└── LabelBadge.module.css

src/components/LanguagePicker/
├── LanguagePicker.tsx
└── LanguagePicker.module.css

src/i18n/
├── translations.ts                        # pl / en / it Translation records
└── LanguageContext.tsx                    # React context + useLang() hook

src/services/fileStateService.ts           # GET/POST /api/state (dev Vite plugin)
src/services/fileExportService.ts          # Download JSON snapshot

UPDATED TESTS:
tests/unit/seatingAssigner.test.ts          # Guest[] input; proximity + surname tests
tests/unit/storageService.test.ts           # v4 schema; v1/v2/v3 → null test
tests/integration/seatingPlan.test.tsx      # Wizard navigation flow

UNCHANGED:
src/components/TableCard/
src/components/SeatingChart/
src/components/GuestInput/
src/index.css
src/main.tsx

VITE CONFIG:
vite.config.ts                             # local-state-persist plugin (GET/POST /api/state)
```

**Structure Decision**: Single SPA — no routing. Wizard state in `App.tsx` `useReducer`. Language in `LanguageContext`. Dual persistence: localStorage (sync) + file via Vite plugin (async, dev only).

## Implementation Phases

### Phase A: Data Model + Services

1. Update `src/types/index.ts` — add `labels: string[]` to `Guest`; add `availableLabels: string[]` to `SeatingPlan`
2. Update `src/services/storageService.ts` — `SCHEMA_VERSION = 4`; `parsePlan`: v4 → load as-is; any other version → null
3. Update `src/services/seatingAssigner.ts` — add `surnameBonus`, `computeAffinity` (label intersection + surname bonus), `greedyClustering`, `greedyHamiltonianPath`, `assignSeatsProximity`; keep `assignSeats` for no-label fallback
4. Create `src/services/fileStateService.ts` — `saveToFile(plan)` → POST /api/state; `loadFromFile()` → GET /api/state; silent fail in production
5. Update unit tests for services

### Phase B: i18n Infrastructure

6. Create `src/i18n/translations.ts` — `Translation` interface; `pl`, `en`, `it` objects; `translateError()` helper
7. Create `src/i18n/LanguageContext.tsx` — `LanguageProvider`, `useLang()` hook
8. Create `src/components/LanguagePicker/LanguagePicker.tsx` + CSS

### Phase C: Wizard Shell + Step Indicator

9. Create `StepIndicator` component — 4-node horizontal bar; step labels from `useLang().steps`
10. Extend `AppState` in `src/App.tsx` — add `step: 1|2|3|4`, `availableLabels: string[]`; wrap in `LanguageProvider`
11. Add all reducer actions; wire step-conditional rendering; wire dual persistence `useEffect`

### Phase D: Label Step (Step 2)

12. Implement `LabelBadge` — pill button, filled/outlined, Italian palette colour
13. Implement `GuestLabelRow` — guest name (double-click to rename) + label toggles
14. Implement `LabelStep` — scrollable guest list + custom label creator + Back/Next nav
15. Wire `TOGGLE_GUEST_LABEL`, `ADD_LABEL`, `RENAME_GUEST` actions

### Phase E: Configure + Chart (Steps 3 & 4)

16. Update `ConfigPanel` — add `onBack`, `guestCount`; guest summary line
17. Wire Step 3 in `App.tsx` — `ASSIGN` calls `assignSeatsProximity`, sets `step = 4`
18. Wire Step 4 in `App.tsx` — `SeatingChart` + "Edit Groups" + "Re-assign" controls
19. Update `RESTORE` action — v4 payload; restore `availableLabels`; `step = 4` if `assigned`

### Phase F: Vite Plugin + Integration Tests

20. Add `local-state-persist` plugin to `vite.config.ts` — GET/POST `/api/state` → `wedding-state.json`
21. Update integration tests — wizard navigation flow; v4 restore; swap still works

### Phase G: Validation

22. Run all 10 quickstart scenarios in `npm run dev`
23. `npm run build` — no TypeScript errors
24. 200-guest performance check — algorithm < 100ms

## Complexity Tracking

No Constitution violations to justify.
