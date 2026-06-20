# Feature Specification: Multi-Step Seating Wizard

**Feature Branch**: `002-seating-wizard`

**Created**: 2026-06-19

**Status**: Active (updated 2026-06-20 to reflect implemented features)

**Input**: User description: "Multi-step wedding seating wizard. Step 1: import guest list (bulk textarea). Step 2: assign group labels to each guest from a predefined set (Magda's Family, Piotr's Family, Magda's Friend, Piotr's Friend) plus custom labels the user can create. Step 3: configure table count and seats per table, then run a proximity-based assignment algorithm where guests sharing more labels sit closer together (same table first, then adjacent seats on the same side). Step 4: view and swap the seating chart. Replace the existing single-screen app with this wizard flow while keeping all current features (left/right seat layout, Italian wedding styling, swap interaction, localStorage persistence)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import Guest List (Priority: P1)

The wedding planner opens the app and pastes or types a list of guest names into a text area (one per line). They review the parsed list and proceed to the next step.

**Why this priority**: Without a guest list, no other step can proceed. This is the entry point of the entire workflow.

**Independent Test**: Paste 20 names into the text area, click "Next" — 20 guest entries appear in Step 2 with no duplicates or blank entries.

**Acceptance Scenarios**:

1. **Given** the planner pastes a list of names (one per line), **When** they click "Next", **Then** Step 2 opens showing each name as a guest entry with no labels assigned.
2. **Given** the raw text contains blank lines or extra whitespace, **When** the planner proceeds, **Then** blank lines are silently ignored and names are trimmed.
3. **Given** the planner returns to Step 1 from Step 2, **When** they modify the list and click "Next" again, **Then** guests whose names still appear retain their previously assigned labels; new guests start with no labels.
4. **Given** the text area is empty, **When** the planner clicks "Next", **Then** the app shows an inline error and stays on Step 1.

---

### User Story 2 - Assign Group Labels (Priority: P1)

The wedding planner sees all guests listed. For each guest they click one or more group label buttons to assign membership. A set of predefined labels is available immediately; the planner can also type a custom label name and add it, after which it appears for all guests.

**Why this priority**: Labels are the data that drives the proximity algorithm. Without labels, the seating is random; with labels, similar people are seated together — the core value proposition of this feature.

**Independent Test**: Assign "Magda's Family" to 5 guests and "Piotr's Family" to 5 other guests. All 10 labels are correctly reflected (highlighted) when the page is reviewed.

**Acceptance Scenarios**:

1. **Given** Step 2 is open, **When** the planner clicks a label button next to a guest, **Then** the label is toggled on (visually highlighted) for that guest.
2. **Given** a label is already selected for a guest, **When** the planner clicks it again, **Then** the label is removed from that guest.
3. **Given** the planner types a new label name in the custom label input and confirms, **When** the label is created, **Then** it appears as a button for every guest and in the master label list.
4. **Given** a custom label exists, **When** the planner assigns it to several guests, **Then** those assignments are preserved when navigating forward and backward through the wizard steps.
5. **Given** Step 2 is open, **When** the planner clicks "Back", **Then** they return to Step 1 and the raw guest text is unchanged.

---

### User Story 2b - Rename Guests (Priority: P2)

The wedding planner notices a misspelling in a guest name while on the label assignment screen. They double-click the name inline and correct it without leaving the wizard step.

**Why this priority**: Names entered in bulk via the textarea often contain typos; correcting them at the label step avoids losing label assignments from re-importing.

**Independent Test**: On Step 2, double-click "Alic" → editable field appears → type "Alice" → confirm → the row now shows "Alice" with labels intact.

**Acceptance Scenarios**:

1. **Given** Step 2 is open, **When** the planner double-clicks a guest name, **Then** the name becomes an inline editable field.
2. **Given** the inline field is active, **When** the planner submits the new name (Enter or blur), **Then** the row updates to the new name and all previously assigned labels are preserved.
3. **Given** the planner clears the name field and submits, **Then** the rename is ignored and the original name is restored.

---

### User Story 3 - Configure Tables and Assign Seats with Proximity (Priority: P1)

The wedding planner specifies the number of tables and seats per table, then triggers assignment. The system places guests who share more labels at the same table and, within a table, in adjacent seats on the same side.

**Why this priority**: This is the differentiating feature — intelligent proximity-based seating that justifies the label step.

**Independent Test**: With 12 guests split into "Magda's Family" (6) and "Piotr's Family" (6), configure 2 tables of 6. After assignment, Table 1 contains predominantly Magda's Family and Table 2 contains predominantly Piotr's Family.

**Acceptance Scenarios**:

1. **Given** tables and seats are configured with sufficient capacity, **When** the planner triggers assignment, **Then** every guest is assigned exactly once and the chart is displayed.
2. **Given** guests share labels, **When** assignment completes, **Then** guests who share the most labels appear at the same table more often than guests with no shared labels.
3. **Given** guests at the same table share labels, **When** the chart is displayed, **Then** the most similar pair among them occupies adjacent seats on the same side.
4. **Given** total seat capacity is less than the guest count, **When** assignment is triggered, **Then** an error explains the shortfall and no assignment is made.
5. **Given** guests have no labels at all, **When** assignment is triggered, **Then** the assignment falls back to random distribution (same behavior as before this feature).

---

### User Story 4 - View Chart and Swap Guests (Priority: P2)

The planner sees the seating chart with all tables rendered in the left/right seat layout. They can click any two guests sequentially to swap their seats. They can also return to the label step to adjust groups and re-run assignment.

**Why this priority**: Manual adjustment after auto-assignment is essential — no algorithm is perfect for every family situation.

**Independent Test**: Assign seats for 10 guests. Click Guest A (highlighted), click Guest B — A and B swap positions. Chart updates immediately. Click "Edit Groups" — Step 2 opens with all labels intact.

**Acceptance Scenarios**:

1. **Given** the chart is displayed, **When** the planner clicks a guest, **Then** the guest is highlighted as selected.
2. **Given** a guest is selected, **When** the planner clicks a different guest, **Then** the two swap seats and the selection clears.
3. **Given** a guest is selected, **When** the planner clicks the same guest, **Then** the selection is cancelled with no swap.
4. **Given** the chart is displayed, **When** the planner clicks "Edit Groups", **Then** they return to Step 2 with all guest labels preserved.
5. **Given** the chart is displayed, **When** the planner clicks "Re-assign", **Then** the proximity algorithm runs again with the current labels and configuration.
6. **Given** the planner refreshes the browser, **Then** the chart is restored exactly as it was (all positions preserved).

---

### User Story 5 - Interface Language Selection (Priority: P2)

The wedding planner prefers to use the app in their native language. They select Polish, English, or Italian from a picker in the header; all labels, buttons, error messages, and step names update immediately.

**Why this priority**: The wedding involves an international guest list; the planner may share the screen with family who speak different languages. Italian is the thematic language of the styling.

**Independent Test**: Switch language to Italian — step labels read "Ospiti / Gruppi / Tavoli / Posti", button text, headings, and error messages are all in Italian.

**Acceptance Scenarios**:

1. **Given** the app loads, **When** the planner selects a language from the picker, **Then** all UI text switches to that language immediately without a page reload.
2. **Given** Italian is selected, **When** the planner views the step indicator, **Then** step labels read "Ospiti", "Gruppi", "Tavoli", "Posti".
3. **Given** Polish is selected, **When** an error is triggered (e.g. empty guest list), **Then** the error message appears in Polish.

---

### User Story 6 - Durable File-Based State Persistence (Priority: P2)

The wedding planner clears browser storage (or opens a different browser profile) and expects the seating plan to be recoverable. The app silently syncs to a local file via the dev server's `/api/state` endpoint when available.

**Why this priority**: localStorage is volatile — it can be wiped by privacy tools or browser updates. A file on the user's machine survives these events.

**Independent Test**: Assign seats, clear localStorage manually in DevTools, refresh the page — the app restores to Step 4 from file.

**Acceptance Scenarios**:

1. **Given** the dev server is running with file API support, **When** any state change is saved, **Then** the plan is written to both localStorage and the server-side file.
2. **Given** the page loads and file-based state exists, **When** localStorage is empty, **Then** the app restores from file.
3. **Given** the file API is unavailable (production build, network error), **Then** the app falls back to localStorage silently with no error shown to the user.

---

### Edge Cases

- Guest count that does not divide evenly into tables — handled gracefully with no omissions.
- A guest with no labels at all — treated as having zero affinity to every other guest; placed at whichever table has remaining capacity.
- Two guests with identical label sets — considered maximally similar; placed at the same table if possible and in adjacent seats.
- Guests sharing a surname — the proximity algorithm grants an additional affinity bonus (equivalent to ~10 shared labels) so families sit together even without explicit label assignment.
- Deleting a custom label that is already assigned to guests — out of scope for this version; planners can ignore unwanted labels.
- Navigating back from Step 4 to Step 2 — all label assignments are preserved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a step indicator showing the current step (1–4) and allowing visual progress tracking throughout the wizard.
- **FR-002**: System MUST accept a multi-line text input (one guest name per non-empty line) in Step 1 and parse it into a guest list when the planner proceeds.
- **FR-003**: System MUST display an inline error and block navigation if the guest list is empty when the planner attempts to leave Step 1.
- **FR-004**: System MUST display all guests in Step 2 with a label toggle button for each available label beside each guest entry.
- **FR-005**: System MUST provide the following predefined labels by default: "Magda", "Piotr", "Family", "Friend", "High school", "Studies".
- **FR-006**: System MUST allow the planner to type a custom label name and add it to the master label list, after which it appears for all guests.
- **FR-007**: System MUST allow the planner to toggle (select/deselect) any label for any guest; a guest may have zero or more labels.
- **FR-008**: System MUST preserve guest label assignments when navigating backward (Step 2 → Step 1) and forward (Step 1 → Step 2) within the same session.
- **FR-009**: System MUST accept numeric inputs for table count and seats per table in Step 3.
- **FR-010**: System MUST implement a proximity-based seating algorithm: guests sharing the most labels are preferentially seated at the same table; within a table, the most similar guests occupy adjacent seats on the same side (left or right).
- **FR-011**: System MUST fall back to random seat distribution if no guest has any label assigned.
- **FR-012**: System MUST display a descriptive error if total seat capacity is insufficient for the guest count, blocking assignment.
- **FR-013**: System MUST display the seating chart in Step 4 using the existing left/right table layout (each table card shows guests on a left side and a right side).
- **FR-014**: System MUST allow the planner to select and swap any two guests' seats in Step 4 with exactly two clicks.
- **FR-015**: System MUST provide an "Edit Groups" action in Step 4 that returns the planner to Step 2 with all labels intact.
- **FR-016**: System MUST provide a "Re-assign" action in Step 4 that re-runs the proximity algorithm with current labels and configuration.
- **FR-017**: System MUST automatically save the complete wizard state (guest list, labels, table configuration, seating chart) to device storage so it is restored on page refresh or browser reopen.
- **FR-018**: System MUST persist the custom label list across sessions so previously created labels reappear on next visit.
- **FR-019**: System MUST allow the planner to rename any guest inline in Step 2 (double-click to edit); the rename must preserve all existing label assignments for that guest.
- **FR-020**: System MUST apply a surname-affinity bonus in the proximity algorithm: guests who share a surname (including Polish gendered variants, e.g. Kowalski/Kowalska) receive a boosted affinity score equivalent to sharing ~10 labels, ensuring families cluster even without explicit label assignment.
- **FR-021**: System MUST allow the planner to switch the UI language between Polish, English, and Italian at any time via a language picker in the header; all UI text (step names, buttons, errors, headings) must update immediately without a page reload.
- **FR-022**: System MUST silently sync the seating plan to a local file via a `/api/state` HTTP endpoint when the dev server is running, and fall back to localStorage-only when the endpoint is unavailable.

### Key Entities

- **Guest**: Name (editable), assigned group labels (zero or more), assigned table identifier, assigned seat position.
- **Label**: Display text; either predefined or user-created. Scoped to the session (affects all guests).
- **SeatingPlan**: Collection of tables, complete guest list with labels, table configuration, wizard step state, available label list.
- **Table**: Unique identifier, seat capacity, ordered seat list with left/right assignment.
- **Language**: Active UI locale — one of `pl` (Polish), `en` (English), `it` (Italian).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A planner can complete the full workflow (import 20 guests → assign labels → assign seats → view chart) in under 5 minutes on a first use.
- **SC-002**: After assignment, guests who share at least one label appear at the same table at least 80% of the time when table capacity allows it.
- **SC-003**: Swapping two guests requires exactly 2 clicks and the chart updates immediately with no page reload.
- **SC-004**: Adding a custom label takes under 10 seconds from typing to seeing it appear on all guest rows.
- **SC-005**: The complete wizard state — including labels, custom label names, and seat positions — is fully restored after a browser refresh.
- **SC-006**: The seating chart remains legible with up to 40 tables on a standard desktop screen (1280×800).
- **SC-007**: Switching the UI language takes effect within one render cycle — no visible flicker or stale text.
- **SC-008**: A guest name correction in Step 2 (double-click → edit → confirm) takes under 5 seconds and all existing label badges remain highlighted.
- **SC-009**: Two guests sharing a surname but having no shared labels are placed at the same table at least 80% of the time when table capacity allows it.

## Assumptions

- The predefined labels ("Magda", "Piotr", "Family", "Friend", "High school", "Studies") are always present on first launch; custom labels can be added but neither predefined nor custom labels can be deleted in this version.
- A guest may belong to multiple labels simultaneously.
- The proximity algorithm is greedy/heuristic — it does not guarantee a globally optimal placement, but it maximises same-table and same-side adjacency for guests with shared labels. Surname matching provides an implicit bonus even when no labels are assigned.
- Surname affinity bonus (+10) applies when two guests share a surname part of ≥ 5 characters, including Polish gendered suffix pairs (e.g. Kowalski/Kowalska differ only in up to 3 trailing characters after a common prefix).
- When navigating back from Step 4 to Step 2 via "Edit Groups", the existing seating assignment is cleared and must be re-run.
- Deleting custom labels is out of scope for this version; planners can ignore unwanted labels.
- File-based persistence requires a dev server running with Vite's plugin for the `/api/state` endpoint; in production builds only localStorage is used.
- Language selection is not persisted across sessions; the app starts in Polish (`pl`) by default.
- The Italian wedding styling established in the base app is preserved throughout the wizard.
- All tables continue to have equal seat capacity (one seats-per-table value applies uniformly).
