'use client'

import { useState, useEffect } from 'react'
import { GlobeAltIcon } from '@heroicons/react/24/outline'

type Language = 'en' | 'he'

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved) {
      setLanguage(saved)
      document.documentElement.lang = saved
      document.documentElement.dir = saved === 'he' ? 'rtl' : 'ltr'
    }
  }, [])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
    // Trigger a re-render by dispatching a custom event
    window.dispatchEvent(new Event('languagechange'))
  }

  return (
    <div className="flex items-center gap-2">
      <GlobeAltIcon className="h-5 w-5 text-gray-500" />
      <select
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value as Language)}
        className="border rounded-lg px-2 py-1 text-sm bg-white"
      >
        <option value="en">English</option>
        <option value="he">עברית</option>
      </select>
    </div>
  )
}

