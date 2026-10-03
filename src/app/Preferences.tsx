import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  readFavorites,
  saveFavorites,
  readTheme,
  readPlans,
  savePlans,
  plansKey,
} from '../shared/persistence'
import type { Theme } from '../shared/persistence'
import { normalizeItinerary } from '../domain/itinerary'
import type { Itinerary } from '../domain/itinerary'
import { destinations } from '../content/registry'

function loadPlans() {
  return Object.fromEntries(
    Object.entries(readPlans())
      .filter(([id]) => destinations[id])
      .map(([id, plan]) => [id, normalizeItinerary(plan, destinations[id])]),
  )
}

const PreferencesContext = createContext<{
  favorites: string[]
  toggleFavorite: (id: string) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  storageMessage: string
  plans: Record<string, Itinerary>
  savePlan: (destinationId: string, plan: Itinerary) => void
} | null>(null)
export function Preferences({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState(readFavorites)
  const [theme, setTheme] = useState(readTheme)
  const [storageMessage, setStorageMessage] = useState('')
  const [plans, setPlans] = useState(loadPlans)
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === 'travelling:favorites:v1') setFavorites(readFavorites())
      if (event.key === plansKey || event.key === null) setPlans(loadPlans())
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
  const savePlan = (destinationId: string, plan: Itinerary) => {
    const next = {
      ...plans,
      [destinationId]: normalizeItinerary(plan, destinations[destinationId]),
    }
    setPlans(next)
    setStorageMessage(
      savePlans(next)
        ? ''
        : 'Браузер не разрешил сохранение. План доступен до закрытия страницы. Сохраните ссылку на него.',
    )
  }
  return (
    <PreferencesContext.Provider
      value={{ favorites, toggleFavorite, theme, setTheme, storageMessage, plans, savePlan }}
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
