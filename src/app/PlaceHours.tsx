import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { hoursFeedSchema, hoursSources } from '../domain/openingHours'
import type { HoursFeed } from '../domain/openingHours'
import { assetUrl } from '../shared/format'
import { moscowDay } from '../domain/exchangeRates'

const key = 'travelling:hours:v1'
function validate(value: unknown): HoursFeed {
  const feed = hoursFeedSchema.parse(value)
  return {
    ...feed,
    places: feed.places.filter(
      (place) =>
        place.checkedAt <= moscowDay() &&
        hoursSources.some(
          (source) => source.placeId === place.placeId && source.url === place.sourceUrl,
        ),
    ),
  }
}
function readCachedHours(): HoursFeed {
  try {
    return validate(JSON.parse(localStorage.getItem(key) ?? 'null'))
  } catch {
    return { version: 1, places: [] }
  }
}
const HoursContext = createContext<HoursFeed>({ version: 1, places: [] })
export function PlaceHours({ children }: { children: ReactNode }) {
  const [hours, setHours] = useState(readCachedHours)
  useEffect(() => {
    let active = true
    let lastAttempt = 0
    const refresh = async () => {
      if (Date.now() - lastAttempt < 3600000) return
      lastAttempt = Date.now()
      try {
        const response = await fetch(assetUrl('place-hours.json'), {
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) throw new Error('Schedules unavailable')
        const fresh = validate(await response.json())
        if (!active) return
        setHours((previous) => {
          const merged = new Map(previous.places.map((place) => [place.placeId, place]))
          for (const place of fresh.places) {
            if ((merged.get(place.placeId)?.checkedAt ?? '') <= place.checkedAt)
              merged.set(place.placeId, place)
          }
          const next: HoursFeed = { version: 1, places: [...merged.values()] }
          try {
            localStorage.setItem(key, JSON.stringify(next))
          } catch {
            /* Available in memory. */
          }
          return next
        })
      } catch {
        /* Retain the last verified snapshot and its original date. */
      }
    }
    const visible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    void refresh()
    window.addEventListener('online', visible)
    document.addEventListener('visibilitychange', visible)
    return () => {
      active = false
      window.removeEventListener('online', visible)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [])
  return <HoursContext.Provider value={hours}>{children}</HoursContext.Provider>
}
// oxlint-disable-next-line react/only-export-components
export function usePlaceHours() {
  return useContext(HoursContext)
}
