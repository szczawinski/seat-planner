# Quickstart & Validation Guide: Multi-Step Seating Wizard

**Date**: 2026-06-20 (updated from 2026-06-19)

Validates all wizard features end-to-end. Run `npm run dev` and open the app before starting.

---

## Scenario 1 — Full Wizard with Proximity Assignment

**Goal**: Verify the complete happy path from import to seating chart.

1. Open the app. Step 1 is active in the step indicator.
2. Paste into the guest textarea:
   ```
   Alice Rossi
   Bruno Rossi
   Chiara Rossi
   Davide Esposito
   Elena Esposito
   Francesca Esposito
   Giorgio Bianchi
   Helena Bianchi
   ```
3. Click **Next**. Step 2 opens showing all 8 guests.
4. Assign labels:
   - Alice, Bruno, Chiara → **Magda** + **Family**
   - Davide, Elena, Francesca → **Piotr** + **Family**
   - Giorgio, Helena → **Friend**
5. Click **Next** → Step 3. Set **Tables = 3**, **Seats per table = 3**.
6. Click **Assign Seats**.

**Expected**:
- Step 4 opens with 3 table cards.
- Table containing Alice also contains Bruno and/or Chiara (shared labels).
- Table containing Davide also contains Elena and/or Francesca.
- All 8 guests appear exactly once.

---

## Scenario 2 — Surname Affinity (No Labels)

**Goal**: Verify families cluster without explicit labels.

1. Import 6 guests:
   ```
   Anna Kowalski
   Jan Kowalski
   Maria Kowalska
   Bob Smith
   Carol Smith
   David Jones
   ```
2. Skip Step 2 (assign no labels).
3. Configure 3 tables × 2 seats. Click **Assign Seats**.

**Expected**: Anna, Jan, Maria land on the same table (surname bonus clusters Kowalski/Kowalska). Bob and Carol land together. David is placed at whichever table has capacity.

---

## Scenario 3 — Custom Label Creation

1. Complete Scenario 1 through Step 3 arrival.
2. Return to Step 2 via **Edit Groups**.
3. Type `VIP` in the custom label input and click **Add Label**.
4. Assign `VIP` to Alice and Davide.
5. Click **Next** → **Assign Seats**.

**Expected**:
- `VIP` label appears for all 8 guests in Step 2 with a distinct colour.
- Alice and Davide preferentially end up at the same table (shared `VIP` label raises affinity).

---

## Scenario 4 — Inline Guest Rename

1. Complete Step 1 (import any guests).
2. On Step 2, double-click the name "Alice Rossi".
3. Change the name to "Alice Romano" and press Enter.

**Expected**:
- Row now shows "Alice Romano".
- Any previously assigned label badges are still highlighted.
- Back-navigating to Step 1 shows "Alice Romano" in the textarea.

---

## Scenario 5 — Back Navigation Preserves Labels

1. Complete Scenario 1 through Step 2 (labels assigned, not yet advanced).
2. Click **Back** to Step 1.
3. Remove one guest name, add a new name. Click **Next**.

**Expected**:
- Guests whose names remained have all labels intact.
- Removed guest no longer appears.
- New guest appears with no labels.

---

## Scenario 6 — Validation Errors

**Empty list**:
1. Open app (Step 1). Leave textarea empty. Click **Next**.
   - Expected: inline error; wizard stays on Step 1.

**Insufficient capacity**:
1. Import 10 guests, configure 2 tables × 4 seats (capacity 8 < 10). Click **Assign Seats**.
   - Expected: inline error describing the shortfall; no chart rendered.

---

## Scenario 7 — Swap Guests in Chart

1. Complete a full assignment.
2. Click **Alice** — confirm she is highlighted.
3. Click **Davide**.

**Expected**: Alice and Davide swap positions immediately. No page reload.

---

## Scenario 8 — Persistence Across Refresh

1. Complete Scenario 1 including chart view and one swap.
2. Note all seat positions.
3. Refresh the browser (F5).

**Expected**:
- App opens on Step 4 with identical seating and swap applied.
- All label assignments intact.
- Custom labels (if created) reappear in Step 2.

---

## Scenario 9 — Language Switching

1. Open the app (default: Polish).
2. Select **English** from the language picker in the header.

**Expected**: All text switches to English — step labels, buttons, headings, placeholders. No page reload.

3. Select **Italiano**.

**Expected**: Step indicator shows "Ospiti / Gruppi / Tavoli / Posti". All errors appear in Italian.

4. Refresh the page.

**Expected**: App resets to Polish (language is not persisted).

---

## Scenario 10 — Re-assign

1. Complete Scenario 1 with chart rendered.
2. Click **Re-assign**.

**Expected**:
- Chart re-renders with a new proximity-aware assignment.
- All guests still present; groups tend to stay together (label affinity preserved).

---

## Artifacts Referenced

- Data model: [data-model.md](./data-model.md)
- Component contracts: [contracts/component-contracts.md](./contracts/component-contracts.md)
- Spec: [spec.md](./spec.md)
