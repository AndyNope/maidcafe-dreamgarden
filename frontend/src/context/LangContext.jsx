import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../i18n/translations'

const LangContext = createContext(null)

const STORAGE_KEY = 'dg_lang'
const SUPPORTED   = ['de', 'en']

export function LangProvider({ children }) {
  const [lang, setLangRaw] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED.includes(saved)) return saved
    // Auto-detect browser language
    const browser = navigator.language?.slice(0, 2).toLowerCase()
    return SUPPORTED.includes(browser) ? browser : 'de'
  })

  const setLang = (l) => {
    if (!SUPPORTED.includes(l)) return
    localStorage.setItem(STORAGE_KEY, l)
    setLangRaw(l)
  }

  const t = (section, key) => {
    return translations[lang]?.[section]?.[key]
        ?? translations['de']?.[section]?.[key]
        ?? key
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t, supported: SUPPORTED }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
