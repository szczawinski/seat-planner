import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { translations, type Lang, type Translation } from './translations'

const STORAGE_KEY = 'wedding-seating-lang'
const DEFAULT_LANG: Lang = 'pl'

interface LanguageContextValue {
  lang: Lang
  t: Translation
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  t: translations[DEFAULT_LANG],
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null
    return stored && stored in translations ? stored : DEFAULT_LANG
  })

  function setLang(next: Lang) {
    setLangState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang(): LanguageContextValue {
  return useContext(LanguageContext)
}
