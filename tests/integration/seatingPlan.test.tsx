import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import App from '../../src/App'
import type { SeatingPlan } from '../../src/types'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('wedding-seating-lang', 'en')
})

/** Navigate through the wizard to assign seats and land on step 4. */
function assignSeats(guestList: string, tables: number, seatsPerTable: number) {
  // Step 1: enter guests and advance
  const textarea = screen.getByRole('textbox', { name: /guest names/i })
  fireEvent.change(textarea, { target: { value: guestList } })
  fireEvent.click(screen.getByRole('button', { name: /next/i }))

  // Step 2: skip label assignment
  fireEvent.click(screen.getByRole('button', { name: /next/i }))

  // Step 3: configure and assign
  const tableInput = screen.getByLabelText(/tables/i)
  fireEvent.change(tableInput, { target: { value: String(tables) } })

  const seatsInput = screen.getByLabelText(/seats per table/i)
  fireEvent.change(seatsInput, { target: { value: String(seatsPerTable) } })

  fireEvent.click(screen.getByRole('button', { name: /assign/i }))
}

describe('Full seating plan flow', () => {
  it('assigns guests and displays table cards', () => {
    render(<App />)
    assignSeats('Alice\nBob\nCarol\nDave', 2, 2)

    expect(screen.getByText('Table 1')).toBeInTheDocument()
    expect(screen.getByText('Table 2')).toBeInTheDocument()

    const allNames = ['Alice', 'Bob', 'Carol', 'Dave']
    allNames.forEach((name) => expect(screen.getByText(name)).toBeInTheDocument())
  })

  it('shows an error when guest count exceeds capacity', () => {
    render(<App />)
    assignSeats('A\nB\nC\nD\nE', 2, 2)

    expect(screen.getByRole('status')).toHaveTextContent(/4 seat/)
  })

  it('shows error for empty guest list', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/guest/)
  })

  it('highlights first selected guest', () => {
    render(<App />)
    assignSeats('Alice\nBob', 2, 2)

    const aliceBtn = screen.getByRole('button', { name: /alice/i })
    fireEvent.click(aliceBtn)

    expect(aliceBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('swaps two guests when clicked sequentially', () => {
    render(<App />)
    assignSeats('Alice\nBob', 2, 2)

    // Capture stable table-card containers before swap
    const aliceInitialCard = screen
      .getByRole('button', { name: /alice/i })
      .closest('[data-testid="table-card"]')!
    const bobInitialCard = screen
      .getByRole('button', { name: /bob/i })
      .closest('[data-testid="table-card"]')!

    fireEvent.click(screen.getByRole('button', { name: /alice/i }))
    fireEvent.click(screen.getByRole('button', { name: /bob/i }))

    // Re-query after React re-renders
    const aliceFinalCard = screen
      .getByRole('button', { name: /alice/i })
      .closest('[data-testid="table-card"]')!
    const bobFinalCard = screen
      .getByRole('button', { name: /bob/i })
      .closest('[data-testid="table-card"]')!

    expect(aliceFinalCard).toBe(bobInitialCard)
    expect(bobFinalCard).toBe(aliceInitialCard)
  })

  it('deselects guest when same guest is clicked twice', () => {
    render(<App />)
    assignSeats('Alice\nBob', 2, 2)

    const aliceBtn = screen.getByRole('button', { name: /alice/i })
    fireEvent.click(aliceBtn)
    expect(aliceBtn).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(aliceBtn)
    expect(aliceBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('restores a saved v4 plan directly onto step 4', async () => {
    const plan: SeatingPlan = {
      version: 4,
      config: { tableCount: 2, seatsPerTable: 2, rawGuestText: 'Alice\nBob\nCarol\nDave' },
      guests: [
        { id: 'guest-0', name: 'Alice', labels: ['Magda', 'Family'], tableId: 'table-1', seatIndex: 0 },
        { id: 'guest-1', name: 'Bob', labels: [], tableId: 'table-1', seatIndex: 1 },
        { id: 'guest-2', name: 'Carol', labels: ['Piotr', 'Family'], tableId: 'table-2', seatIndex: 0 },
        { id: 'guest-3', name: 'Dave', labels: [], tableId: 'table-2', seatIndex: 1 },
      ],
      tables: [
        { id: 'table-1', label: 'Table 1', capacity: 2, seats: ['guest-0', 'guest-1'] },
        { id: 'table-2', label: 'Table 2', capacity: 2, seats: ['guest-2', 'guest-3'] },
      ],
      assigned: true,
      availableLabels: ['Magda', 'Piotr', 'Family', 'Friend', 'High school', 'Studies'],
    }
    localStorage.setItem('wedding-seating-plan', JSON.stringify(plan))

    render(<App />)

    // RESTORE dispatch is async (awaits loadFromFile) — use findByText to wait
    expect(await screen.findByText('Table 1')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })
})
