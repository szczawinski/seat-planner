# Quickstart & Validation Guide: Wedding Seating Planner

**Date**: 2026-06-18

This guide describes how to run the app locally and validate that each user story works end-to-end. It is not a test suite — it is a human-executable walkthrough for confirming the feature is working correctly.

---

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- A modern desktop browser (Chrome, Firefox, Edge, or Safari)

---

## Setup

```bash
# From the project root
npm install
npm run dev
```

Open the URL printed by Vite (default: `http://localhost:5173`).

---

## Validation Scenarios

### Scenario 1: Basic Assignment (User Story 1 — P1)

**Steps**:
1. In the "Guest Names" textarea, paste:
   ```
   Alice
   Bob
   Carol
   Dave
   Eve
   Frank
   ```
2. Set **Tables** to `2`, **Seats per table** to `3`.
3. Click **Assign Seats**.

**Expected**:
- No error is shown.
- Two table cards appear, each with exactly 3 guest names.
- All 6 names from the list appear — none duplicated, none missing.

---

### Scenario 2: Uneven Distribution (Edge Case)

**Steps**:
1. Enter 7 guest names.
2. Set **Tables** to `2`, **Seats per table** to `4` (total capacity 8 ≥ 7).
3. Click **Assign Seats**.

**Expected**:
- One table shows 4 guests, the other shows 3 (one empty seat).
- All 7 guests appear exactly once.

---

### Scenario 3: Validation Error — Insufficient Capacity

**Steps**:
1. Enter 10 guest names.
2. Set **Tables** to `2`, **Seats per table** to `3` (total 6 < 10).
3. Click **Assign Seats**.

**Expected**:
- An error message is displayed indicating the capacity shortfall (e.g., "6 seats available, 10 guests").
- No table cards are rendered (or the previous assignment is not overwritten with invalid data).

---

### Scenario 4: Validation Error — Empty Guest List

**Steps**:
1. Clear the guest textarea entirely.
2. Click **Assign Seats**.

**Expected**:
- An error message prompts the user to add at least one guest.

---

### Scenario 5: View Seating Chart (User Story 2 — P1)

**Steps**:
1. Complete Scenario 1 successfully.
2. Confirm each table card is visually distinct (different card area or border).
3. Confirm every guest name in the list is visible on a card without scrolling within the card.

**Expected**:
- All 6 names are readable on a 1280×800 browser window.
- Tables do not overlap.

---

### Scenario 6: Swap Two Guests (User Story 3 — P2)

**Steps**:
1. Complete Scenario 1 successfully. Note which table Alice and Bob are on.
2. Click **Alice**. Confirm she is highlighted (e.g., border or background change).
3. Click **Bob** (on a different table if possible, or same table if not).

**Expected**:
- Alice and Bob have exchanged positions — Alice is now where Bob was, and Bob is now where Alice was.
- The chart updates immediately with no page reload.
- The highlight is cleared after the swap.

---

### Scenario 7: Cancel Selection

**Steps**:
1. Complete Scenario 1 successfully.
2. Click **Alice** — she becomes highlighted.
3. Click **Alice** again.

**Expected**:
- Highlight is cleared. No swap occurred.

---

### Scenario 8: Persistence Across Refresh (FR-012)

**Steps**:
1. Complete Scenario 1 successfully and perform one swap (Scenario 6).
2. Note the final positions of all guests.
3. Refresh the browser page (F5 or Ctrl+R).

**Expected**:
- The seating chart is restored exactly as it was before the refresh — same table assignments, same positions after the swap.
- The guest textarea and config values are also restored.

---

## Performance Check (SC-001)

**Steps**:
1. Generate a guest list of 200 names (one per line).
2. Set **Tables** to `20`, **Seats per table** to `10`.
3. Click **Assign Seats** while watching a clock.

**Expected**:
- The chart renders within 3 seconds of clicking the button.

---

## Artifacts Referenced

- Data model: [data-model.md](./data-model.md)
- Storage contract: [contracts/storage-schema.md](./contracts/storage-schema.md)
- Spec: [spec.md](./spec.md)
