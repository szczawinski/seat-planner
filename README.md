# Wedding Seating Planner

A Polish-wedding-themed SPA for creating and managing guest seating charts. Built with React 19 + TypeScript + Vite.

**Live app**: https://seats-planner-927684761676.europe-central2.run.app

---

## What it does

A 4-step wizard that takes you from a raw guest list to a printable seating chart:

1. **Import** — paste guest names, one per line
2. **Groups** — assign group labels to each guest (Magda, Piotr, Family, Friend, High school, Studies, or custom); rename guests inline; mark couples manually
3. **Tables** — configure table count and seats per table
4. **Seats** — view the auto-assigned chart; click two guests to swap them; re-run the algorithm any time

### Smart seating algorithm

- Guests who share labels sit at the same table (greedy clustering by affinity)
- Within a table, similar guests sit in adjacent seats on the same side
- Couples (auto-detected by matching surnames, or manually marked) always sit next to each other on the same side
- Surname affinity bonus: guests sharing a Polish surname (including gendered variants like Kowalski/Kowalska) cluster together even without explicit labels

### Couple detection

- **Automatic**: adjacent lines in the import list with matching surnames are detected as a couple
- **Manual**: in Step 2, check the checkbox next to any two guests and click "Stwórz parę" — they are paired and shown in a matching colour in both Steps 2 and 4

### Other features

- 3 UI languages: Polish, English, Italian
- State auto-saved to localStorage and (in dev) to `wedding-state.json` via Vite plugin
- Inline guest rename with label preservation
- Italian wedding calligraphy styling (Playfair Display + Cormorant Garamond)

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.8 |
| Build | Vite 6 |
| Styling | CSS Modules |
| Tests | Vitest 3 + React Testing Library |
| Deployment | Google Cloud Run (nginx:alpine, europe-central2) |

---

## Running locally

```bash
npm install
npm run dev
```

App starts at http://localhost:5173 (or next available port).

The dev server also serves `/api/state` — any saved plan is written to `wedding-state.json` in the project root and restored on next load even if localStorage is cleared.

## Running tests

```bash
npm test
```

50 tests across unit (seatingAssigner, storageService) and integration (full wizard flow).

## Building

```bash
npm run build
```

Outputs to `dist/`. TypeScript is compiled with `tsc -b` before Vite bundles.

---

## Deployment

The app is deployed to Google Cloud Run using the included `Dockerfile` (multi-stage: Node 20 build → nginx:alpine serve on port 8080).

```bash
gcloud run deploy seats-planner \
  --source . \
  --region europe-central2 \
  --platform managed \
  --allow-unauthenticated \
  --project <your-gcp-project>
```

Cloud Build handles the Docker build automatically. No local Docker required.

---

## Project structure

```
src/
├── App.tsx                        # 4-step wizard — useReducer state machine
├── components/
│   ├── GuestInput/                # Step 1: textarea
│   ├── LabelStep/                 # Step 2: label toggles, couple pairing, rename
│   │   ├── LabelStep.tsx
│   │   ├── GuestLabelRow.tsx      # checkbox + name + label badges
│   │   └── LabelBadge.tsx
│   ├── ConfigPanel/               # Step 3: table/seat count
│   ├── SeatingChart/              # Step 4: grid of TableCards
│   ├── TableCard/                 # Left/right seat layout per table
│   ├── StepIndicator/             # 1–2–3–4 progress bar
│   └── LanguagePicker/            # PL / EN / IT switcher
├── i18n/
│   ├── translations.ts            # pl, en, it strings
│   └── LanguageContext.tsx        # React context + useLang()
├── services/
│   ├── seatingAssigner.ts         # proximity algorithm + couple detection
│   ├── storageService.ts          # localStorage schema v4
│   └── fileStateService.ts        # /api/state dev persistence
└── types/index.ts                 # Guest, Table, SeatingPlan interfaces

specs/002-seating-wizard/          # Speckit design documents
tests/                             # Vitest unit + integration tests
Dockerfile                         # Multi-stage build for Cloud Run
nginx.conf                         # SPA routing on port 8080
```

---

## Speckit

This project uses [Speckit](https://github.com/speckit-io/speckit) for specification-driven development. Design documents live in `specs/002-seating-wizard/`:

- `spec.md` — user stories and functional requirements
- `plan.md` — technical implementation plan
- `data-model.md` — entity schema and state machine
- `tasks.md` — implementation task checklist
- `contracts/component-contracts.md` — component prop contracts
- `quickstart.md` — end-to-end validation scenarios
