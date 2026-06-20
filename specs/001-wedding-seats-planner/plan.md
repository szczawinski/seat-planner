# Implementation Plan: Wedding Seating Planner

**Branch**: `001-wedding-seats-planner` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-wedding-seats-planner/spec.md`

## Summary

Build a client-side-only React + TypeScript web application that lets a wedding planner enter a guest list and table configuration, auto-assign guests to seats using a randomized round-robin algorithm, display the arrangement as a visual chart, and allow manual seat swaps via sequential two-click selection. All state is persisted to `localStorage` so the plan survives page refresh or tab close.

## Technical Context

**Language/Version**: TypeScript 5 + React 18

**Primary Dependencies**: Vite 5 (build/dev), React Testing Library + Vitest (testing), CSS Modules (styles)

**Storage**: `localStorage` (browser built-in, no server)

**Testing**: Vitest + React Testing Library + jsdom

**Target Platform**: Desktop web browsers (Chrome, Firefox, Edge, Safari — latest two major versions)

**Project Type**: Single-page web application (static, client-side only — no backend)

**Performance Goals**: Assignment of 200 guests completes in under 3 seconds (SC-001); swap updates chart immediately (SC-003)

**Constraints**: Desktop-only for v1 (1280×800 minimum); no authentication; no server; `localStorage` ≤ 5 MB limit (estimated payload ~15 KB)

**Scale/Scope**: Single user, up to 200 guests, up to 40 tables

## Constitution Check

The project constitution (`/.specify/memory/constitution.md`) contains only template placeholders — no project-specific gates are defined. No violations to resolve.

*Note*: Once the constitution is populated for this project, re-run this check before starting implementation.

## Project Structure

### Documentation (this feature)

```text
specs/001-wedding-seats-planner/
├── plan.md              # This file
├── research.md          # Technology decisions (Phase 0)
├── data-model.md        # Entity definitions and state transitions (Phase 1)
├── quickstart.md        # End-to-end validation guide (Phase 1)
├── contracts/
│   └── storage-schema.md   # localStorage shape + component prop contracts (Phase 1)
└── tasks.md             # Implementation tasks (created by /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── GuestInput/
│   │   ├── GuestInput.tsx
│   │   └── GuestInput.module.css
│   ├── ConfigPanel/
│   │   ├── ConfigPanel.tsx
│   │   └── ConfigPanel.module.css
│   ├── SeatingChart/
│   │   ├── SeatingChart.tsx
│   │   └── SeatingChart.module.css
│   └── TableCard/
│       ├── TableCard.tsx
│       └── TableCard.module.css
├── services/
│   ├── seatingAssigner.ts     # Fisher-Yates shuffle + round-robin distribution
│   └── storageService.ts      # localStorage read/write with schema versioning
├── types/
│   └── index.ts               # Guest, Table, SeatingPlan, PlanConfig types
├── App.tsx                    # Root component + useReducer state
├── App.module.css
└── main.tsx

tests/
├── unit/
│   ├── seatingAssigner.test.ts   # Assignment correctness, even distribution, edge cases
│   └── storageService.test.ts    # Save/load, schema version handling, malformed JSON
└── integration/
    └── seatingPlan.test.tsx      # Full user flows: assign, view, swap, persist

public/
index.html
```

**Structure Decision**: Single frontend project — no backend directory. No `backend/` or `api/` since the app is fully static. Option 1 adapted for a React/Vite SPA.

## Implementation Phases

### Phase A: Project Scaffold

- Initialize Vite + React + TypeScript project at repo root
- Configure Vitest, React Testing Library, jsdom
- Set up CSS Modules support (default in Vite)
- Create `src/types/index.ts` with all entity types

### Phase B: Core Logic

- Implement `seatingAssigner.ts` (parse, validate, shuffle, assign)
- Implement `storageService.ts` (save, load, version check)
- Write unit tests for both services (covers FR-001 to FR-011, FR-012, SC-001, SC-002)

### Phase C: Components

- Implement `TableCard` (displays one table's guests, handles click selection)
- Implement `SeatingChart` (renders all tables in a grid layout)
- Implement `GuestInput` (controlled textarea)
- Implement `ConfigPanel` (table count, seats per table inputs + Assign button + error display)
- Wire all components in `App.tsx` with `useReducer`

### Phase D: Persistence Integration

- Connect `storageService` to `App.tsx` (load on mount, save after every state change)
- Test round-trip: assign → refresh → verify restoration (FR-012)

### Phase E: Integration Tests & Polish

- Write integration tests covering all acceptance scenarios from the spec
- Verify SC-004 (no horizontal scroll at 1280×800)
- Verify SC-005 (first-time user flow)

## Complexity Tracking

No Constitution violations to justify.
