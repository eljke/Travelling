import { z } from 'zod'
import type { DestinationBundle, Place } from './model'
import { distanceBetween } from './geo'
import { closedOnDate } from './openingHours'
import { routeSettingsSchema } from './dayRoute'

export const itinerarySchema = z.object({
  version: z.literal(1),
  days: z
    .array(
      z.object({
        date: z.iso.date(),
        placeIds: z.array(z.string()).max(100),
        settings: routeSettingsSchema.optional(),
      }),
    )
    .max(366),
})
export type Itinerary = z.infer<typeof itinerarySchema>

export function createItinerary(bundle: DestinationBundle): Itinerary {
  const days: Itinerary['days'] = []
  const date = new Date(`${bundle.trip.startDate}T12:00:00Z`)
  while (date.toISOString().slice(0, 10) <= bundle.trip.endDate) {
    days.push({ date: date.toISOString().slice(0, 10), placeIds: [] })
    date.setUTCDate(date.getUTCDate() + 1)
  }
  return { version: 1, days }
}

export function normalizeItinerary(plan: Itinerary, bundle: DestinationBundle): Itinerary {
  const seen = new Set<string>()
  const places = new Set(bundle.places.map((place) => place.id))
  return {
    version: 1,
    days: createItinerary(bundle).days.map((day) => ({
      ...day,
      settings: plan.days.find((saved) => saved.date === day.date)?.settings,
      placeIds: plan.days
        .filter((saved) => saved.date === day.date)
        .flatMap((saved) =>
          saved.placeIds.filter((id) => {
            if (!places.has(id) || seen.has(id)) return false
            seen.add(id)
            return true
          }),
        ),
    })),
  }
}

export function placeInDay(plan: Itinerary, placeId: string, date: string): Itinerary {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      placeIds: [
        ...day.placeIds.filter((id) => id !== placeId),
        ...(day.date === date ? [placeId] : []),
      ],
    })),
  }
}

export function summarizeDay(places: Place[], currency: string) {
  return {
    minMinutes: places.reduce((sum, place) => sum + place.duration.minMinutes, 0),
    maxMinutes: places.reduce((sum, place) => sum + place.duration.maxMinutes, 0),
    amount: places.reduce(
      (sum, place) => sum + (place.pricing.currency === currency ? (place.pricing.amount ?? 0) : 0),
      0,
    ),
    unknownPrices: places.filter(
      (place) => place.pricing.kind === 'unknown' || place.pricing.currency !== currency,
    ).length,
    lowerBound: places.some((place) => place.pricing.kind === 'from'),
    distance: places.reduce(
      (sum, place, index) =>
        sum + (index ? distanceBetween(places[index - 1].coordinates, place.coordinates) : 0),
      0,
    ),
  }
}

export function fillFromFavorites(
  plan: Itinerary,
  bundle: DestinationBundle,
  favorites: string[],
  dailyMinutes: number,
): Itinerary {
  const next = structuredClone(plan)
  const scheduled = new Set(plan.days.flatMap((day) => day.placeIds))
  const remaining = bundle.places.filter(
    (place) =>
      favorites.includes(place.id) &&
      !scheduled.has(place.id) &&
      place.availability.status !== 'temporarily-closed',
  )
  // ponytail: nearest-neighbor grouping for a small catalog; road routing needs a transport API.
  for (const day of next.days) {
    const places = day.placeIds.map((id) => bundle.places.find((place) => place.id === id)!)
    let minutes = summarizeDay(places, bundle.exchangeRate.baseCurrency).maxMinutes
    while (remaining.length) {
      const origin =
        places.at(-1)?.coordinates ??
        bundle.trip.accommodation?.coordinates ??
        remaining[0].coordinates
      const candidate = remaining
        .filter(
          (place) =>
            !closedOnDate(place, day.date) && minutes + place.duration.maxMinutes <= dailyMinutes,
        )
        .sort(
          (a, b) => distanceBetween(origin, a.coordinates) - distanceBetween(origin, b.coordinates),
        )[0]
      if (!candidate) break
      day.placeIds.push(candidate.id)
      places.push(candidate)
      minutes += candidate.duration.maxMinutes
      remaining.splice(remaining.indexOf(candidate), 1)
    }
  }
  return next
}
