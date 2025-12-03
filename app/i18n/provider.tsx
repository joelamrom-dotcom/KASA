'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'he'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isRTL: boolean
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'dashboard': 'Dashboard',
    'families': 'Families',
    'payments': 'Payments',
    'reports': 'Reports',
    'settings': 'Settings',
    'welcome': 'Welcome',
    'loading': 'Loading...',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'create': 'Create',
    'search': 'Search',
    'filter': 'Filter',
    'export': 'Export',
    'import': 'Import'
  },
  he: {
    'dashboard': 'לוח בקרה',
    'families': 'משפחות',
    'payments': 'תשלומים',
    'reports': 'דוחות',
    'settings': 'הגדרות',
    'welcome': 'ברוכים הבאים',
    'loading': 'טוען...',
    'save': 'שמור',
    'cancel': 'ביטול',
    'delete': 'מחק',
    'edit': 'ערוך',
    'create': 'צור',
    'search': 'חפש',
    'filter': 'סנן',
    'export': 'ייצא',
    'import': 'ייבא'
  }
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  const isRTL = language === 'he'

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language, isRTL])

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

