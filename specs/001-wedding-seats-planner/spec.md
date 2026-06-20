# Feature Specification: Wedding Seating Planner

**Feature Branch**: `001-wedding-seats-planner`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "Web application for planning where each guest of wedding will sit. As and input app will take list of guests, number of tables and at begginging will asign guest to seat and draw these tables will descriped names. App will also have a replace feature so if i click on two guests one after another they will be replaced."

## Clarifications

### Session 2026-06-18

- Q: Should the seating plan persist across browser sessions (survive tab close/refresh) or reset each session? → A: Auto-save to device — plan is automatically preserved and restored on next visit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Up Guest List and Tables (Priority: P1)

A wedding planner opens the app, enters the names of all invited guests (pasted or typed as a list), specifies the number of tables and seats per table, then triggers automatic assignment. The app distributes all guests across the tables and displays the seating chart.

**Why this priority**: This is the foundational workflow — without it the app delivers no value. Every other feature depends on a seating plan existing.

**Independent Test**: Enter 20 guest names, specify 4 tables with 5 seats each, trigger assignment, and confirm all 20 guests appear exactly once across the displayed tables.

**Acceptance Scenarios**:

1. **Given** the user has entered 20 guest names and configured 4 tables with 5 seats each, **When** they trigger "Assign Seats", **Then** all 20 guests are distributed across the 4 tables with no guest appearing more than once and no seat left empty.
2. **Given** the guest count does not divide evenly into tables (e.g., 22 guests, 4 tables), **When** assignment is triggered, **Then** guests are distributed as evenly as possible with no guest omitted.
3. **Given** the guest count exceeds total seat capacity, **When** the user triggers assignment, **Then** the app displays a clear error indicating the shortfall (e.g., "12 seats available, 15 guests — add more tables or increase seats per table").
4. **Given** the guest list is empty, **When** the user triggers assignment, **Then** the app prompts the user to add at least one guest before proceeding.

---

### User Story 2 - View Seating Chart (Priority: P1)

After assignment, the wedding planner sees a visual representation of all tables, each displaying the names of guests assigned to it.

**Why this priority**: The visual chart is the primary deliverable — the planner needs to review and verify the arrangement at a glance.

**Independent Test**: After assignment, all tables are rendered on screen with labeled guest names visible without any additional action.

**Acceptance Scenarios**:

1. **Given** guests have been assigned, **When** the planner views the seating chart, **Then** each table is visually distinct and displays all assigned guest names clearly.
2. **Given** tables are displayed, **When** the planner resizes the browser window, **Then** the layout remains legible and all table names and guest names stay readable.

---

### User Story 3 - Swap Two Guests (Priority: P2)

The wedding planner clicks on a guest name to select them, then clicks on a second guest name to swap their seats. This allows manual adjustments to the auto-generated arrangement.

**Why this priority**: Auto-assignment rarely satisfies all preferences (couples, families, VIPs). Swapping enables targeted manual corrections without re-running the full assignment.

**Independent Test**: Click guest "Alice" (Table 1), then click guest "Bob" (Table 3). Alice now appears at Table 3 and Bob now appears at Table 1.

**Acceptance Scenarios**:

1. **Given** the seating chart is displayed, **When** the planner clicks on a guest name, **Then** that guest is visually highlighted to indicate they are selected.
2. **Given** a guest is selected, **When** the planner clicks on a second different guest, **Then** the two guests swap seats and the chart updates immediately without any page reload.
3. **Given** a guest is selected, **When** the planner clicks the same guest again, **Then** the selection is cancelled and no swap occurs.
4. **Given** a guest is selected, **When** the planner clicks on an empty area (not a guest name), **Then** the selection is cancelled.

---

### Edge Cases

- Uneven distribution: guest count does not divide evenly into tables — some tables will have fewer guests than others; the app handles this gracefully with no omissions.
- Empty guest list when assignment is triggered — app prompts user to add guests.
- Zero tables configured — app prevents assignment and prompts the user.
- Single guest entered — guest is assigned to the first seat at Table 1.
- Guest names with special characters or accented letters — displayed correctly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept a multi-line text input where each non-empty line represents one guest name.
- **FR-002**: System MUST accept a numeric input for the number of tables.
- **FR-003**: System MUST accept a numeric input for the number of seats per table (all tables have equal capacity).
- **FR-004**: System MUST automatically assign all entered guests to seats when assignment is triggered, distributing guests across tables as evenly as possible.
- **FR-005**: System MUST display all tables visually after assignment, each showing the names of the guests assigned to it.
- **FR-006**: System MUST allow the user to select a guest by clicking on their name in the chart.
- **FR-007**: System MUST visually distinguish the currently selected guest (e.g., highlight or border change) so the user knows who is pending a swap.
- **FR-008**: System MUST swap the seats of two guests when the user clicks them sequentially (first click selects, second click confirms swap).
- **FR-009**: System MUST cancel the current selection if the user clicks the already-selected guest or clicks an empty area.
- **FR-010**: System MUST validate that total seat capacity (tables × seats per table) is greater than or equal to the guest count before allowing assignment.
- **FR-011**: System MUST display a descriptive error message when validation fails (insufficient capacity, empty guest list, or zero tables).
- **FR-012**: System MUST automatically save the seating plan to device storage so that it is restored when the user returns to the app after closing or refreshing the browser.

### Key Entities

- **Guest**: Name, assigned table identifier, assigned seat position within the table.
- **Table**: Unique number/label, seat capacity, ordered list of assigned guests.
- **SeatingPlan**: Collection of all tables, complete list of all guests, configuration (table count, seats per table).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can input a guest list of up to 200 names and receive a complete seating assignment in under 3 seconds.
- **SC-002**: Every guest in the input list appears exactly once in the final seating chart — no duplicates and no omissions.
- **SC-003**: Swapping two guests requires exactly 2 clicks and the chart reflects the change immediately (no page reload required).
- **SC-004**: The seating chart displays all tables and guest names legibly on a standard desktop screen (1280×800 or larger) without requiring horizontal scrolling.
- **SC-005**: A first-time user can complete a full seating plan (enter guests → assign seats → swap guests → review result) in under 10 minutes without external assistance.

## Assumptions

- All tables have equal seat capacity; the user specifies a single "seats per table" value applied uniformly.
- Guest names are entered as plain text, one name per line; blank lines are ignored.
- Initial guest-to-seat assignment uses random distribution (no grouping, family, or priority logic in this version).
- The application is for a single user at a time — no real-time collaboration features.
- Desktop/laptop browser is the primary target; mobile responsiveness is out of scope for this initial version.
- No user account or authentication is required — the app is open-access.
- Tables are identified by sequential numbers (Table 1, Table 2, …); custom table naming is out of scope for this version.
- There is no undo/redo functionality; swaps are permanent until the user performs another swap or reassigns.
