import { z } from 'zod'
import type { DestinationBundle, Place } from './model'
import { distanceBetween } from './geo'
import { closedOnDate } from './openingHours'
import { familyRouteBudget, familyTicketPrice, hasFamilyComposition } from './families'
import type { BudgetScope } from './families'
import {
  routeSettingsSchema,
  defaultRouteSettings,
  evaluateRoute,
  toMinutes,
  clockTime,
} from './dayRoute'

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

export function summarizeTrip(plan: Itinerary, bundle: DestinationBundle, scope: BudgetScope) {
  const places = new Map(bundle.places.map((place) => [place.id, place]))
  const days = plan.days.map((day) => {
    const settings = day.settings ?? defaultRouteSettings
    const route = evaluateRoute(
      day.placeIds.map((id) => places.get(id)!),
      bundle,
      day.date,
      settings,
    )
    const budget = familyRouteBudget(
      route,
      scope,
      settings,
      day.date,
      bundle.exchangeRate.baseCurrency,
    )
    const minutes = {
      visits: route.stops.reduce((sum, stop) => sum + stop.visitMinutes, 0),
      travel: route.travelMinutes,
      queues: route.stops.reduce((sum, stop) => sum + stop.queueMinutes, 0),
      waiting: route.stops.reduce(
        (sum, stop) => sum + stop.visitStart - stop.arrival - stop.queueMinutes,
        0,
      ),
      breaks: route.stops.reduce((sum, stop) => sum + stop.pauseAfter, 0),
    }
    return {
      day,
      settings,
      route,
      budget,
      minutes,
      needsChanges:
        day.placeIds.length > 0 &&
        (!route.fits || toMinutes(settings.end) <= toMinutes(settings.start)),
      differentParty: day.placeIds.length > 0 && !hasFamilyComposition(settings),
      lowerBound:
        route.unknownPrices > 0 ||
        route.stops.some(
          (stop) =>
            stop.place.pricing.kind === 'from' &&
            familyTicketPrice(
              stop.place,
              scope,
              settings,
              day.date,
              bundle.exchangeRate.baseCurrency,
            ).amount > 0,
        ),
    }
  })
  return {
    days,
    ticketCost: days.reduce((sum, day) => sum + day.budget.ticketCost, 0),
    transportCost: days.reduce((sum, day) => sum + day.budget.cost, 0),
    transportHighCost: days.reduce((sum, day) => sum + day.budget.highCost, 0),
    travelMinutes: days.reduce((sum, day) => sum + day.minutes.travel, 0),
    queueMinutes: days.reduce((sum, day) => sum + day.minutes.queues, 0),
    unknownPrices: days.reduce((sum, day) => sum + day.route.unknownPrices, 0),
    lowerBound: days.some((day) => day.lowerBound),
    plannedDays: days.filter((day) => day.day.placeIds.length).length,
    needsChanges: days.filter((day) => day.needsChanges).length,
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
    const settings = { ...(day.settings ?? defaultRouteSettings) }
    settings.end = clockTime(
      Math.min(toMinutes(settings.end), toMinutes(settings.start) + dailyMinutes),
    )
    day.settings = settings
    while (remaining.length) {
      const origin =
        places.at(-1)?.coordinates ??
        bundle.trip.accommodation?.coordinates ??
        remaining[0].coordinates
      const candidates = remaining
        .filter((place) => !closedOnDate(place, day.date))
        .map((place) => {
          const orders = Array.from({ length: Math.max(1, places.length) }, (_, index) => {
            const position = places.length ? index + 1 : 0
            const order = [...places.slice(0, position), place, ...places.slice(position)]
            const route = bundle.trip.accommodation
              ? evaluateRoute(order, bundle, day.date, settings)
              : undefined
            return { order, route }
          })
            .filter(({ order, route }) =>
              route
                ? route.fits
                : summarizeDay(order, bundle.exchangeRate.baseCurrency).maxMinutes <= dailyMinutes,
            )
            .sort((a, b) => (a.route?.score ?? 0) - (b.route?.score ?? 0))
          return { place, best: orders[0] }
        })
      const candidate = candidates
        .filter((candidate) => candidate.best)
        .sort(
          (a, b) =>
            distanceBetween(origin, a.place.coordinates) -
            distanceBetween(origin, b.place.coordinates),
        )[0]
      if (!candidate) break
      places.splice(0, places.length, ...candidate.best.order)
      day.placeIds = places.map((place) => place.id)
      remaining.splice(remaining.indexOf(candidate.place), 1)
    }
  }
  return next
}
