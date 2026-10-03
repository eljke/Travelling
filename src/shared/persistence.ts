import { z } from 'zod'
import { itinerarySchema } from '../domain/itinerary'
import type { Itinerary } from '../domain/itinerary'

export const plansKey = 'travelling:plans:v1'
export function readPlans(): Record<string, Itinerary> {
  try {
    return z
      .record(z.string(), itinerarySchema)
      .parse(JSON.parse(localStorage.getItem(plansKey) ?? '{}'))
  } catch {
    return {}
  }
}
export function savePlans(plans: Record<string, Itinerary>): boolean {
  try {
    localStorage.setItem(plansKey, JSON.stringify(plans))
    return true
  } catch {
    return false
  }
}

export const favoritesKey = 'travelling:favorites:v1'
export function readFavorites(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(favoritesKey) ?? '[]')
    return Array.isArray(value)
      ? [...new Set(value.filter((item): item is string => typeof item === 'string'))]
      : []
  } catch {
    return []
  }
}
export function saveFavorites(ids: string[]): boolean {
  try {
    localStorage.setItem(favoritesKey, JSON.stringify(ids))
    return true
  } catch {
    return false
  }
}
export type Theme = 'system' | 'light' | 'dark'
export function readTheme(): Theme {
  try {
    const value = localStorage.getItem('travelling:theme')
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}
