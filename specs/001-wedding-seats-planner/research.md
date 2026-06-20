# Research: Wedding Seating Planner

**Date**: 2026-06-18
**Feature**: specs/001-wedding-seats-planner/spec.md

## Decision Log

---

### D-001: Frontend Framework

**Decision**: React 18 with TypeScript via Vite

**Rationale**: React's component model maps naturally to the core entities (Table, GuestCard). `useState`/`useReducer` handle the selection/swap state cleanly without external libraries. TypeScript catches data model mismatches at compile time, which matters for the Guest↔Table relationship. Vite gives near-instant dev builds.

**Alternatives considered**:
- **Vue 3**: Comparable capability; React chosen for wider ecosystem and easier hire/help availability.
- **Svelte**: Less ecosystem, good performance — overkill for this scope.
- **Vanilla JS (no framework)**: Eliminates build step but makes swap-state and re-render management tedious as component count grows. Not worth the long-term cost.

---

### D-002: State Management

**Decision**: React built-in state only (`useState` + `useReducer` in App)

**Rationale**: The app's entire state fits in a single reducer: guest list, table config, the current seating assignment, and the selected guest id. No async operations, no cross-cutting slices, no need for a store library.

**Alternatives considered**:
- **Zustand**: Reasonable choice for slightly larger scope; unnecessary here.
- **Redux Toolkit**: Correct tool for multi-slice apps; overkill for a single-screen planner.

---

### D-003: Persistence (localStorage)

**Decision**: `localStorage` via a thin `storageService` module (serialize/deserialize `SeatingPlan` JSON)

**Rationale**: FR-012 requires the plan to survive page close/refresh. `localStorage` is synchronous, requires no server, and can comfortably hold a JSON payload for 200 guests (~10–20 KB). A dedicated service module keeps storage logic out of components and makes it easy to mock in tests.

**Alternatives considered**:
- **IndexedDB**: Async, more complex API — warranted only for binary data or >5 MB payloads. Not needed here.
- **sessionStorage**: Does not survive tab close; violates FR-012.
- **Server-side storage**: Requires a backend; out of scope per spec assumptions.

**Storage key**: `wedding-seating-plan` (single key, JSON value)

**Schema version**: A `version` field is included in the stored object to enable future migrations without data loss.

---

### D-004: CSS Strategy

**Decision**: CSS Modules (`.module.css` files co-located with each component)

**Rationale**: Scoped class names prevent leakage between components, no runtime overhead, supported natively by Vite. Each component carries its own style file.

**Alternatives considered**:
- **Tailwind CSS**: Requires PostCSS config and purge setup; adds tooling complexity for limited gain at this scale.
- **styled-components**: Runtime CSS-in-JS adds bundle size and a runtime dependency.
- **Global CSS**: Simple but leads to name-collision issues as components grow.

---

### D-005: Testing Stack

**Decision**: Vitest + React Testing Library + jsdom

**Rationale**: Vitest is the natural test runner for Vite projects (shared config, no Jest transform overhead). React Testing Library encourages testing user behavior rather than implementation details, which aligns with the spec's acceptance scenarios. jsdom simulates a browser environment for component tests.

**Alternatives considered**:
- **Jest**: Works with React but requires additional Vite/Babel bridging; slower cold start.
- **Playwright**: End-to-end only; appropriate for integration tests of the running app, not unit/component tests.

---

### D-006: Assignment Algorithm

**Decision**: Fisher-Yates shuffle followed by round-robin table distribution

**Rationale**: The spec calls for random assignment (Assumptions section). Fisher-Yates is an unbiased shuffle. Round-robin distribution ensures the fewest-guest tables always have at most one fewer guest than the most-guest tables, satisfying the "as evenly as possible" requirement in FR-004.

**Algorithm sketch**:
1. Parse guest names → filter blank lines → deduplicate (last occurrence wins for exact duplicates).
2. Shuffle the guest array using Fisher-Yates.
3. Assign guest[i] to table[i % tableCount], seat[Math.floor(i / tableCount)].

**Alternatives considered**:
- **Pure random per-table**: Can leave uneven distributions; rejected.
- **Alphabetical**: Deterministic but not random as specified.

---

### D-007: Build & Dev Tooling

**Decision**: Vite 5 (no ejection, default config)

**Rationale**: Zero-config for React + TypeScript + CSS Modules. Production build outputs static files deployable to any static host (GitHub Pages, Netlify, etc.) with no server required, matching the serverless architecture.

**Alternatives considered**:
- **Create React App**: Slow builds, effectively unmaintained upstream.
- **Next.js**: SSR/SSG overkill for a fully client-side app with no routing.
- **Parcel**: Viable but less ecosystem documentation for this stack.
