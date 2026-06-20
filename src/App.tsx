import { useReducer, useEffect, useMemo } from 'react'
import type { Guest, Table } from './types'
import {
  parseGuests,
  validatePlan,
  assignSeatsProximity,
  assignCoupleIds,
} from './services/seatingAssigner'
import { save, load } from './services/storageService'
import { saveToFile, loadFromFile } from './services/fileStateService'
import { LanguageProvider, useLang } from './i18n/LanguageContext'
import { translateError } from './i18n/translations'
import GuestInput from './components/GuestInput/GuestInput'
import ConfigPanel from './components/ConfigPanel/ConfigPanel'
import SeatingChart from './components/SeatingChart/SeatingChart'
import StepIndicator from './components/StepIndicator/StepIndicator'
import LabelStep from './components/LabelStep/LabelStep'
import LanguagePicker from './components/LanguagePicker/LanguagePicker'
import styles from './App.module.css'

const DEFAULT_LABELS = ['Magda', 'Piotr', 'Family', 'Friend', 'High school', 'Studies']

const COUPLE_PALETTE = [
  '#F4A0AA', '#A0BBF4', '#A0F0B0', '#F4E0A0',
  '#C8A0F4', '#F4C0A0', '#A0F0E0', '#F4A0D8',
]

interface AppState {
  step: 1 | 2 | 3 | 4
  rawGuestText: string
  availableLabels: string[]
  tableCount: number
  seatsPerTable: number
  guests: Guest[]
  tables: Table[]
  assigned: boolean
  selectedGuestId: string | null
  error: string | null
}

type AppAction =
  | { type: 'UPDATE_GUEST_TEXT'; payload: string }
  | { type: 'PARSE_AND_ADVANCE' }
  | { type: 'GO_BACK_TO_IMPORT' }
  | { type: 'TOGGLE_GUEST_LABEL'; payload: { guestId: string; label: string } }
  | { type: 'ADD_LABEL'; payload: { label: string } }
  | { type: 'GO_TO_CONFIGURE' }
  | { type: 'GO_BACK_TO_LABELS' }
  | { type: 'UPDATE_TABLE_COUNT'; payload: number }
  | { type: 'UPDATE_SEATS_PER_TABLE'; payload: number }
  | { type: 'ASSIGN' }
  | { type: 'REASSIGN' }
  | { type: 'RENAME_GUEST'; payload: { guestId: string; newName: string } }
  | { type: 'PAIR_GUESTS'; payload: { idA: string; idB: string } }
  | { type: 'SELECT_GUEST'; payload: string | null }
  | { type: 'MOVE_GUEST'; payload: { guestId: string; toTableId: string; toSeatIndex: number } }
  | { type: 'SWAP_GUESTS'; payload: { firstId: string; secondId: string } }
  | {
      type: 'RESTORE'
      payload: {
        rawGuestText: string
        tableCount: number
        seatsPerTable: number
        guests: Guest[]
        tables: Table[]
        assigned: boolean
        availableLabels: string[]
      }
    }

const initialState: AppState = {
  step: 1,
  rawGuestText: '',
  availableLabels: DEFAULT_LABELS,
  tableCount: 4,
  seatsPerTable: 6,
  guests: [],
  tables: [],
  assigned: false,
  selectedGuestId: null,
  error: null,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_GUEST_TEXT':
      return { ...state, rawGuestText: action.payload, error: null }

    case 'PARSE_AND_ADVANCE': {
      const names = parseGuests(state.rawGuestText)
      if (names.length === 0) {
        return { ...state, error: 'ERR_NO_GUESTS' }
      }
      const existingByName = new Map(state.guests.map((g) => [g.name, g]))
      const raw: Guest[] = names.map((name, i) =>
        existingByName.get(name) ?? {
          id: `guest-${i}`,
          name,
          labels: [],
          coupleId: null,
          tableId: null,
          seatIndex: null,
        },
      )
      return { ...state, guests: assignCoupleIds(raw), step: 2, error: null }
    }

    case 'GO_BACK_TO_IMPORT':
      return { ...state, step: 1, error: null }

    case 'TOGGLE_GUEST_LABEL': {
      const { guestId, label } = action.payload
      const newGuests = state.guests.map((g) => {
        if (g.id !== guestId) return g
        const hasLabel = g.labels.includes(label)
        return {
          ...g,
          labels: hasLabel ? g.labels.filter((l) => l !== label) : [...g.labels, label],
        }
      })
      return { ...state, guests: newGuests }
    }

    case 'ADD_LABEL': {
      const label = action.payload.label.trim()
      if (!label || state.availableLabels.includes(label)) return state
      return { ...state, availableLabels: [...state.availableLabels, label] }
    }

    case 'GO_TO_CONFIGURE':
      return { ...state, step: 3, assigned: false, tables: [], error: null }

    case 'GO_BACK_TO_LABELS':
      return { ...state, step: 2, assigned: false, tables: [], selectedGuestId: null, error: null }

    case 'UPDATE_TABLE_COUNT':
      return { ...state, tableCount: action.payload, error: null }

    case 'UPDATE_SEATS_PER_TABLE':
      return { ...state, seatsPerTable: action.payload, error: null }

    case 'ASSIGN': {
      const validationError = validatePlan(state.guests, state.tableCount, state.seatsPerTable)
      if (validationError) {
        return { ...state, error: validationError }
      }
      const { guests, tables } = assignSeatsProximity(
        state.guests,
        state.tableCount,
        state.seatsPerTable,
      )
      return {
        ...state,
        guests,
        tables,
        assigned: true,
        step: 4,
        selectedGuestId: null,
        error: null,
      }
    }

    case 'REASSIGN': {
      const { guests, tables } = assignSeatsProximity(
        state.guests,
        state.tableCount,
        state.seatsPerTable,
      )
      return { ...state, guests, tables, assigned: true, selectedGuestId: null, error: null }
    }

    case 'RENAME_GUEST': {
      const { guestId, newName } = action.payload
      const trimmed = newName.trim()
      if (!trimmed) return state
      return {
        ...state,
        guests: state.guests.map((g) => (g.id === guestId ? { ...g, name: trimmed } : g)),
      }
    }

    case 'PAIR_GUESTS': {
      const { idA, idB } = action.payload
      const existingCoupleCount = new Set(
        state.guests.map((g) => g.coupleId).filter(Boolean),
      ).size
      const newCoupleId = `couple-${existingCoupleCount}`
      return {
        ...state,
        guests: state.guests.map((g) =>
          g.id === idA || g.id === idB ? { ...g, coupleId: newCoupleId } : g,
        ),
      }
    }

    case 'SELECT_GUEST':
      return { ...state, selectedGuestId: action.payload }

    case 'MOVE_GUEST': {
      const { guestId, toTableId, toSeatIndex } = action.payload
      const guest = state.guests.find((g) => g.id === guestId)
      if (!guest) return { ...state, selectedGuestId: null }
      const newGuests = state.guests.map((g) =>
        g.id === guestId ? { ...g, tableId: toTableId, seatIndex: toSeatIndex } : g,
      )
      const newTables = state.tables.map((t) => {
        const newSeats = [...t.seats]
        if (t.id === guest.tableId && guest.seatIndex !== null) {
          newSeats[guest.seatIndex] = null
        }
        if (t.id === toTableId) {
          newSeats[toSeatIndex] = guestId
        }
        return { ...t, seats: newSeats }
      })
      return { ...state, guests: newGuests, tables: newTables, selectedGuestId: null }
    }

    case 'SWAP_GUESTS': {
      const { firstId, secondId } = action.payload
      const first = state.guests.find((g) => g.id === firstId)
      const second = state.guests.find((g) => g.id === secondId)
      if (!first || !second) return { ...state, selectedGuestId: null }

      const newGuests = state.guests.map((g) => {
        if (g.id === firstId) return { ...g, tableId: second.tableId, seatIndex: second.seatIndex }
        if (g.id === secondId) return { ...g, tableId: first.tableId, seatIndex: first.seatIndex }
        return g
      })

      const newTables = state.tables.map((t) => {
        const newSeats = [...t.seats]
        if (t.id === first.tableId && first.seatIndex !== null) {
          newSeats[first.seatIndex] = secondId
        }
        if (t.id === second.tableId && second.seatIndex !== null) {
          newSeats[second.seatIndex] = firstId
        }
        return { ...t, seats: newSeats }
      })

      return { ...state, guests: newGuests, tables: newTables, selectedGuestId: null }
    }

    case 'RESTORE': {
      const p = action.payload
      return {
        ...initialState,
        rawGuestText: p.rawGuestText,
        tableCount: p.tableCount,
        seatsPerTable: p.seatsPerTable,
        guests: p.guests,
        tables: p.tables,
        assigned: p.assigned,
        availableLabels: p.availableLabels.length > 0 ? p.availableLabels : DEFAULT_LABELS,
        step: p.assigned ? 4 : 1,
        selectedGuestId: null,
        error: null,
      }
    }

    default:
      return state
  }
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

function AppContent() {
  const { t } = useLang()
  const [state, dispatch] = useReducer(reducer, initialState)

  // On startup: prefer file-based state (survives browser clears), fall back to localStorage
  useEffect(() => {
    async function init() {
      const fileState = await loadFromFile()
      const saved = fileState ?? load()
      if (saved) {
        dispatch({
          type: 'RESTORE',
          payload: {
            rawGuestText: saved.config.rawGuestText,
            tableCount: saved.config.tableCount,
            seatsPerTable: saved.config.seatsPerTable,
            guests: saved.guests,
            tables: saved.tables,
            assigned: saved.assigned,
            availableLabels: saved.availableLabels,
          },
        })
      }
    }
    init()
  }, [])

  // Persist to both localStorage (instant) and file (async, survives browser clears)
  useEffect(() => {
    if (state.guests.length > 0) {
      const plan = {
        version: 4 as const,
        config: {
          tableCount: state.tableCount,
          seatsPerTable: state.seatsPerTable,
          rawGuestText: state.rawGuestText,
        },
        guests: state.guests,
        tables: state.tables,
        assigned: state.assigned,
        availableLabels: state.availableLabels,
      }
      save(plan)
      saveToFile(plan)
    }
  }, [
    state.guests,
    state.tables,
    state.availableLabels,
    state.assigned,
    state.tableCount,
    state.seatsPerTable,
    state.rawGuestText,
  ])

  function handleGuestClick(guestId: string) {
    if (state.selectedGuestId === null) {
      dispatch({ type: 'SELECT_GUEST', payload: guestId })
    } else if (state.selectedGuestId === guestId) {
      dispatch({ type: 'SELECT_GUEST', payload: null })
    } else {
      dispatch({
        type: 'SWAP_GUESTS',
        payload: { firstId: state.selectedGuestId, secondId: guestId },
      })
    }
  }

  function handleChartClick() {
    if (state.selectedGuestId !== null) {
      dispatch({ type: 'SELECT_GUEST', payload: null })
    }
  }

  function handleEmptySeatClick(tableId: string, seatIndex: number) {
    if (state.selectedGuestId !== null) {
      dispatch({ type: 'MOVE_GUEST', payload: { guestId: state.selectedGuestId, toTableId: tableId, toSeatIndex: seatIndex } })
    }
  }

  const coupleColorMap = useMemo(() => {
    const map = new Map<string, string>()
    const coupleToIndex = new Map<string, number>()
    let idx = 0
    for (const guest of state.guests) {
      if (guest.coupleId !== null) {
        if (!coupleToIndex.has(guest.coupleId)) {
          coupleToIndex.set(guest.coupleId, idx++)
        }
        map.set(guest.id, COUPLE_PALETTE[coupleToIndex.get(guest.coupleId)! % COUPLE_PALETTE.length])
      }
    }
    return map
  }, [state.guests])

  const translatedError = state.error ? translateError(state.error, t) : null

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.languagePickerWrapper}>
          <LanguagePicker />
        </div>
        <div className={styles.ornamentRow}>
          <div className={styles.ornamentLine} />
          <span className={styles.ornamentSymbol}>❦ ✦ ❧</span>
          <div className={styles.ornamentLine} />
        </div>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>
        <div className={styles.headerDivider} />
      </header>

      <div className={styles.stepWrapper}>
        <StepIndicator currentStep={state.step} />
      </div>

      <main className={styles.main}>
        {/* Step 1: Import guests */}
        {state.step === 1 && (
          <section className={styles.controls}>
            <GuestInput
              value={state.rawGuestText}
              onChange={(text) => dispatch({ type: 'UPDATE_GUEST_TEXT', payload: text })}
            />
            {translatedError && (
              <p className={styles.error} role="status" aria-live="polite">
                {translatedError}
              </p>
            )}
            <div className={styles.stepNav}>
              <button
                type="button"
                className={styles.navButton}
                onClick={() => dispatch({ type: 'PARSE_AND_ADVANCE' })}
              >
                {t.next}
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Label assignment */}
        {state.step === 2 && (
          <LabelStep
            guests={state.guests}
            availableLabels={state.availableLabels}
            coupleColorMap={coupleColorMap}
            onToggleLabel={(guestId, label) =>
              dispatch({ type: 'TOGGLE_GUEST_LABEL', payload: { guestId, label } })
            }
            onAddLabel={(label) => dispatch({ type: 'ADD_LABEL', payload: { label } })}
            onRename={(guestId, newName) =>
              dispatch({ type: 'RENAME_GUEST', payload: { guestId, newName } })
            }
            onPairGuests={(idA, idB) =>
              dispatch({ type: 'PAIR_GUESTS', payload: { idA, idB } })
            }
            onBack={() => dispatch({ type: 'GO_BACK_TO_IMPORT' })}
            onNext={() => dispatch({ type: 'GO_TO_CONFIGURE' })}
          />
        )}

        {/* Step 3: Configure and assign */}
        {state.step === 3 && (
          <section className={styles.controls}>
            <ConfigPanel
              tableCount={state.tableCount}
              seatsPerTable={state.seatsPerTable}
              onTableCountChange={(n) => dispatch({ type: 'UPDATE_TABLE_COUNT', payload: n })}
              onSeatsPerTableChange={(n) =>
                dispatch({ type: 'UPDATE_SEATS_PER_TABLE', payload: n })
              }
              onAssign={() => dispatch({ type: 'ASSIGN' })}
              onBack={() => dispatch({ type: 'GO_BACK_TO_LABELS' })}
              guestCount={state.guests.length}
              error={translatedError}
            />
          </section>
        )}

        {/* Step 4: Seating chart */}
        {state.step === 4 && (
          <>
            <div className={styles.chartControls}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => dispatch({ type: 'GO_BACK_TO_LABELS' })}
              >
                {t.editGroups}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => dispatch({ type: 'REASSIGN' })}
              >
                {t.reassign}
              </button>
            </div>
            <section className={styles.chart} onClick={handleChartClick}>
              <SeatingChart
                tables={state.tables}
                guests={state.guests}
                selectedGuestId={state.selectedGuestId}
                coupleColorMap={coupleColorMap}
                onGuestClick={handleGuestClick}
                onEmptySeatClick={handleEmptySeatClick}
              />
            </section>
          </>
        )}
      </main>
    </div>
  )
}
