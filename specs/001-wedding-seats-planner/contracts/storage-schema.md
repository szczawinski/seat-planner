# Contract: localStorage Storage Schema

**Version**: 1
**Storage Key**: `wedding-seating-plan`

This document is the authoritative contract for the data persisted to `localStorage`. The `storageService` module is the only code that may read from or write to this key.

---

## Shape

```jsonc
{
  "version": 1,                        // integer; schema version for migration
  "config": {
    "tableCount": 4,                   // integer ≥ 1
    "seatsPerTable": 5,                // integer ≥ 1
    "rawGuestText": "Alice\nBob\n..."  // verbatim textarea content
  },
  "guests": [
    {
      "id": "guest-0",                 // string; stable across the session
      "name": "Alice",                 // string; trimmed, non-empty
      "tableId": "table-1",            // string | null; null = unassigned
      "seatIndex": 0                   // number | null; 0-based; null = unassigned
    }
    // ...
  ],
  "tables": [
    {
      "id": "table-1",                 // string; e.g. "table-1", "table-2"
      "label": "Table 1",             // string; display label
      "capacity": 5,                   // integer ≥ 1; matches config.seatsPerTable
      "seats": ["guest-0", null, ...]  // (string | null)[]; length === capacity
    }
    // ...
  ],
  "assigned": true                     // boolean; true = a valid assignment exists
}
```

---

## Rules

1. **Single writer**: only `storageService.save(plan: SeatingPlan)` writes to `wedding-seating-plan`.
2. **Single reader**: only `storageService.load(): SeatingPlan | null` reads it.
3. **Versioning**: if the loaded `version` field is missing or does not equal the current schema version (`1`), the service discards the stored value and returns `null` (fresh start).
4. **Error resilience**: if `JSON.parse` throws, the service returns `null` rather than crashing.
5. **No partial writes**: the full `SeatingPlan` object is always serialized atomically; there is no incremental patch mechanism.
6. **Max size**: a plan with 200 guests and 40 tables is estimated at ~15 KB JSON — well within the localStorage 5 MB browser limit.

---

## Component Props Contracts

These are the public interfaces for the top-level React components.

### `<GuestInput />`

```ts
interface GuestInputProps {
  value: string;            // controlled textarea value (rawGuestText)
  onChange: (text: string) => void;
}
```

### `<ConfigPanel />`

```ts
interface ConfigPanelProps {
  tableCount: number;
  seatsPerTable: number;
  onTableCountChange: (n: number) => void;
  onSeatsPerTableChange: (n: number) => void;
  onAssign: () => void;     // triggers assignment validation + shuffle
  error: string | null;     // validation error message, or null
}
```

### `<SeatingChart />`

```ts
interface SeatingChartProps {
  tables: Table[];
  selectedGuestId: string | null;
  onGuestClick: (guestId: string) => void;
}
```

### `<TableCard />`

```ts
interface TableCardProps {
  table: Table;
  guests: Guest[];          // full guest list (for id → name lookup)
  selectedGuestId: string | null;
  onGuestClick: (guestId: string) => void;
}
```
