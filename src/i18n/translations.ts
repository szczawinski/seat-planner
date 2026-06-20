export type Lang = 'pl' | 'en' | 'it'

export interface Translation {
  title: string
  subtitle: string
  steps: [string, string, string, string]
  guestInputLabel: string
  guestInputPlaceholder: string
  next: string
  assignGroupsHeading: string
  assignGroupsSubheading: string
  newLabelPlaceholder: string
  addLabel: string
  back: string
  editNameHint: string
  editNameTitle: string
  guestSummary: (guestCount: number, totalSeats: number) => string
  tablesLabel: string
  seatsPerTableLabel: string
  assignButton: string
  assignAriaLabel: string
  editGroups: string
  reassign: string
  leftSide: string
  rightSide: string
  selectedSuffix: string
  idleText: (assignButtonText: string) => string
  errors: {
    ERR_NO_GUESTS: string
    ERR_NO_GUESTS_ASSIGN: string
    ERR_NO_TABLES: string
    ERR_NO_SEATS: string
    ERR_CAPACITY_EXCEEDED: (seats: number, guests: number) => string
  }
  createCouple: string
  createCoupleHint: string
  languageLabel: string
}

const pl: Translation = {
  title: 'Plan Rozmieszczenia Gości',
  subtitle: 'Planer Weselny',
  steps: ['Goście', 'Grupy', 'Stoły', 'Miejsca'],
  guestInputLabel: 'Lista gości (jedno imię na linię)',
  guestInputPlaceholder: 'Anna\nBob\nKarol',
  next: 'Dalej →',
  assignGroupsHeading: 'Przypisz Grupy',
  assignGroupsSubheading: 'Kliknij etykiety, aby przypisać gościa do jednej lub kilku grup.',
  newLabelPlaceholder: 'Nowa etykieta grupy…',
  addLabel: 'Dodaj etykietę',
  back: '← Wstecz',
  editNameHint: '✎',
  editNameTitle: 'Dwukrotnie kliknij, aby edytować imię',
  guestSummary: (guestCount, totalSeats) => {
    const g =
      guestCount === 1
        ? '1 gość'
        : guestCount < 5
          ? `${guestCount} gości`
          : `${guestCount} gości`
    const s =
      totalSeats === 1
        ? '1 miejsce'
        : totalSeats < 5
          ? `${totalSeats} miejsca`
          : `${totalSeats} miejsc`
    return `${g} · ${s} dostępnych`
  },
  tablesLabel: 'Stoły',
  seatsPerTableLabel: 'Miejsc na stół',
  assignButton: 'Przydziel Miejsca',
  assignAriaLabel: 'Przydziel gości do miejsc',
  editGroups: '← Edytuj grupy',
  reassign: 'Przydziel ponownie',
  leftSide: '◄ Lewa',
  rightSide: 'Prawa ►',
  selectedSuffix: ', zaznaczony',
  idleText: (assignButtonText) =>
    `Wpisz listę gości i skonfiguruj stoły powyżej, następnie kliknij ${assignButtonText}, aby zobaczyć rozmieszczenie.`,
  errors: {
    ERR_NO_GUESTS: 'Dodaj co najmniej jednego gościa.',
    ERR_NO_GUESTS_ASSIGN: 'Dodaj co najmniej jednego gościa przed przydzieleniem miejsc.',
    ERR_NO_TABLES: 'Ustaw co najmniej jeden stół.',
    ERR_NO_SEATS: 'Ustaw co najmniej jedno miejsce na stół.',
    ERR_CAPACITY_EXCEEDED: (seats, guests) =>
      `Za mało miejsc: ${seats} miejsc dostępnych dla ${guests} gości. Dodaj więcej stołów lub zwiększ liczbę miejsc.`,
  },
  createCouple: 'Stwórz parę',
  createCoupleHint: 'Zaznacz dokładnie 2 osoby, aby je sparować.',
  languageLabel: 'Język',
}

const en: Translation = {
  title: 'Wedding Seating Planner',
  subtitle: 'Piano dei Posti',
  steps: ['Guests', 'Groups', 'Tables', 'Seats'],
  guestInputLabel: 'Guest Names (one per line)',
  guestInputPlaceholder: 'Alice\nBob\nCarol',
  next: 'Next →',
  assignGroupsHeading: 'Assign Groups',
  assignGroupsSubheading: 'Click labels to assign each guest to one or more groups.',
  newLabelPlaceholder: 'New group label…',
  addLabel: 'Add Label',
  back: '← Back',
  editNameHint: '✎',
  editNameTitle: 'Double-click to edit name',
  guestSummary: (guestCount, totalSeats) =>
    `${guestCount} guest${guestCount !== 1 ? 's' : ''} · ${totalSeats} seat${totalSeats !== 1 ? 's' : ''} available`,
  tablesLabel: 'Tables',
  seatsPerTableLabel: 'Seats per table',
  assignButton: 'Assign Seats',
  assignAriaLabel: 'Assign guests to seats',
  editGroups: '← Edit Groups',
  reassign: 'Re-assign',
  leftSide: '◄ Left',
  rightSide: 'Right ►',
  selectedSuffix: ', selected',
  idleText: (assignButtonText) =>
    `Enter your guest list and configure the tables above, then click ${assignButtonText} to reveal the seating arrangement.`,
  errors: {
    ERR_NO_GUESTS: 'Please add at least one guest.',
    ERR_NO_GUESTS_ASSIGN: 'Please add at least one guest before assigning seats.',
    ERR_NO_TABLES: 'Please set at least one table.',
    ERR_NO_SEATS: 'Please set at least one seat per table.',
    ERR_CAPACITY_EXCEEDED: (seats, guests) =>
      `Not enough seats: ${seats} seat${seats !== 1 ? 's' : ''} available for ${guests} guest${guests !== 1 ? 's' : ''}. Add more tables or increase seats per table.`,
  },
  createCouple: 'Create couple',
  createCoupleHint: 'Select exactly 2 guests to pair them.',
  languageLabel: 'Language',
}

const it: Translation = {
  title: 'Pianificatore di Posti',
  subtitle: 'Piano dei Posti',
  steps: ['Ospiti', 'Gruppi', 'Tavoli', 'Posti'],
  guestInputLabel: 'Nomi degli ospiti (uno per riga)',
  guestInputPlaceholder: 'Alice\nBob\nCarol',
  next: 'Avanti →',
  assignGroupsHeading: 'Assegna Gruppi',
  assignGroupsSubheading: 'Clicca le etichette per assegnare ogni ospite a uno o più gruppi.',
  newLabelPlaceholder: 'Nuova etichetta gruppo…',
  addLabel: 'Aggiungi etichetta',
  back: '← Indietro',
  editNameHint: '✎',
  editNameTitle: 'Doppio clic per modificare il nome',
  guestSummary: (guestCount, totalSeats) =>
    `${guestCount} ${guestCount === 1 ? 'ospite' : 'ospiti'} · ${totalSeats} ${totalSeats === 1 ? 'posto' : 'posti'} disponibili`,
  tablesLabel: 'Tavoli',
  seatsPerTableLabel: 'Posti per tavolo',
  assignButton: 'Assegna i Posti',
  assignAriaLabel: 'Assegna gli ospiti ai posti',
  editGroups: '← Modifica gruppi',
  reassign: 'Riassegna',
  leftSide: '◄ Sinistra',
  rightSide: 'Destra ►',
  selectedSuffix: ', selezionato',
  idleText: (assignButtonText) =>
    `Inserisci la lista degli ospiti e configura i tavoli sopra, poi clicca ${assignButtonText} per vedere la disposizione.`,
  errors: {
    ERR_NO_GUESTS: 'Aggiungi almeno un ospite.',
    ERR_NO_GUESTS_ASSIGN: 'Aggiungi almeno un ospite prima di assegnare i posti.',
    ERR_NO_TABLES: 'Imposta almeno un tavolo.',
    ERR_NO_SEATS: 'Imposta almeno un posto per tavolo.',
    ERR_CAPACITY_EXCEEDED: (seats, guests) =>
      `Posti insufficienti: ${seats} ${seats === 1 ? 'posto' : 'posti'} disponibili per ${guests} ${guests === 1 ? 'ospite' : 'ospiti'}. Aggiungi più tavoli o aumenta i posti per tavolo.`,
  },
  createCouple: 'Crea coppia',
  createCoupleHint: 'Seleziona esattamente 2 ospiti per accoppiarli.',
  languageLabel: 'Lingua',
}

export const translations: Record<Lang, Translation> = { pl, en, it }

export function translateError(errorKey: string, t: Translation): string {
  if (errorKey.startsWith('ERR_CAPACITY_EXCEEDED:')) {
    const parts = errorKey.split(':')
    return t.errors.ERR_CAPACITY_EXCEEDED(parseInt(parts[1]), parseInt(parts[2]))
  }
  const key = errorKey as keyof typeof t.errors
  const val = t.errors[key]
  return typeof val === 'string' ? val : errorKey
}
