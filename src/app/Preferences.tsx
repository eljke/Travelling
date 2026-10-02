import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { readFavorites, saveFavorites, readTheme } from '../shared/persistence'
import type { Theme } from '../shared/persistence'

const PreferencesContext = createContext<{
  favorites: string[]
  toggleFavorite: (id: string) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  storageMessage: string
} | null>(null)
export function Preferences({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState(readFavorites)
  const [theme, setTheme] = useState(readTheme)
  const [storageMessage, setStorageMessage] = useState('')
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === 'travelling:favorites:v1') setFavorites(readFavorites())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('travelling:theme', theme)
    } catch {
      /* Theme still works for this session. */
    }
  }, [theme])
  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((v) => v !== id) : [...favorites, id]
    setFavorites(next)
    setStorageMessage(
      saveFavorites(next)
        ? ''
        : 'Браузер не разрешил сохранение. Избранное доступно до закрытия страницы.',
    )
  }
  return (
    <PreferencesContext.Provider
      value={{ favorites, toggleFavorite, theme, setTheme, storageMessage }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}
export function usePreferences() {
  const value = useContext(PreferencesContext)
  if (!value) throw new Error('Preferences provider is required')
  return value
}
