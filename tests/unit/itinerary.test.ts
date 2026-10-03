import { describe, expect, it } from 'vitest'
import { destinations } from '../../src/content/registry'
import { defaultRouteSettings, evaluateRoute } from '../../src/domain/dayRoute'
import {
  createItinerary,
  fillFromFavorites,
  normalizeItinerary,
  placeInDay,
  summarizeDay,
  summarizeTrip,
} from '../../src/domain/itinerary'
import { tripProposal } from '../../src/domain/tripProposal'
import {
  closedOnDate,
  openBySchedule,
  parseOfficialHours,
  hoursSources,
} from '../../src/domain/openingHours'

const dubai = destinations.dubai
describe('trip plan', () => {
  it('moves stops without duplicates and removes invalid shared places', () => {
    const empty = createItinerary(dubai)
    expect(empty.days.map((day) => day.date)).toEqual([
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
    ])
    const id = dubai.places[0].id
    const first = placeInDay(empty, id, empty.days[0].date)
    const moved = placeInDay(first, id, empty.days[1].date)
    expect(moved.days[0].placeIds).toEqual([])
    expect(moved.days[1].placeIds).toEqual([id])
    expect(
      normalizeItinerary(
        {
          version: 1,
          days: [
            { date: empty.days[0].date, placeIds: [id, id, 'unknown'] },
            { date: '2026-10-11', placeIds: [id] },
          ],
        },
        dubai,
      ).days[0].placeIds,
    ).toEqual([id])
    expect(empty.days.every((day) => !day.placeIds.length)).toBe(true)
  })
  it('groups nearby favorites while preserving prior choices', () => {
    const slugs = ['burj-khalifa', 'dubai-mall', 'dubai-fountain', 'motiongate']
    const ids = slugs.map((slug) => dubai.places.find((place) => place.slug === slug)!.id)
    const empty = createItinerary(dubai)
    const plan = placeInDay(empty, ids[0], empty.days[0].date)
    const next = fillFromFavorites(plan, dubai, ids, 720)
    expect(next.days[0].placeIds[0]).toBe(ids[0])
    expect(new Set(next.days[0].placeIds.slice(0, 3))).toEqual(new Set(ids.slice(0, 3)))
    expect(next.days.flatMap((day) => day.placeIds)).toHaveLength(4)
    expect(plan.days[0].placeIds).toEqual([ids[0]])
  })
  it('includes travel, opening waits and breaks in the daily limit', () => {
    const plan = createItinerary(dubai)
    const favorites = ['dubai-dubai-mall', 'dubai-dubai-fountain', 'dubai-motiongate']
    const next = fillFromFavorites(plan, dubai, favorites, 360)
    expect(next.days.flatMap((day) => day.placeIds)).not.toContain('dubai-dubai-fountain')
    for (const day of next.days) {
      const route = evaluateRoute(
        day.placeIds.map((id) => dubai.places.find((place) => place.id === id)!),
        dubai,
        day.date,
        day.settings ?? defaultRouteSettings,
      )
      expect(route.fits).toBe(true)
    }
    expect(plan.days.every((day) => day.placeIds.length === 0)).toBe(true)
  })
  it('keeps unknown prices out of the subtotal', () => {
    const paid = dubai.places.find((place) => place.pricing.amount === 189)!
    const unknown = dubai.places.find((place) => place.pricing.kind === 'unknown')!
    expect(summarizeDay([paid, unknown], 'AED')).toMatchObject({
      amount: 189,
      unknownPrices: 1,
      lowerBound: true,
    })
  })
})
describe('trip overview', () => {
  it('combines daily tickets and return transport for both families', () => {
    const plan = tripProposal(dubai).plan
    const first = summarizeTrip(plan, dubai, 'family-1')
    const second = summarizeTrip(plan, dubai, 'family-2')
    const both = summarizeTrip(plan, dubai, 'both')
    expect(first.ticketCost + second.ticketCost).toBeCloseTo(both.ticketCost)
    expect(first.transportCost + second.transportCost).toBeCloseTo(both.transportCost)
    expect(first.transportHighCost + second.transportHighCost).toBeCloseTo(both.transportHighCost)
    expect(both.plannedDays).toBe(5)
    expect(both.needsChanges).toBe(0)
    expect(both.transportCost).toBeGreaterThan(0)
    for (const { settings, route, minutes } of both.days) {
      expect(Object.values(minutes).reduce((sum, value) => sum + value, 0)).toBe(
        route.returnAt - Number(settings.start.slice(0, 2)) * 60 - Number(settings.start.slice(3)),
      )
    }
    expect(both.days[4].budget.ticketCost + both.days[4].budget.cost).toBe(0)
    expect(both.days[4].lowerBound).toBe(false)
  })
  it('leaves empty days unpriced and flags unknown tickets and invalid hours', () => {
    const empty = createItinerary(dubai)
    expect(summarizeTrip(empty, dubai, 'family-1')).toMatchObject({
      plannedDays: 0,
      ticketCost: 0,
      transportCost: 0,
      travelMinutes: 0,
      needsChanges: 0,
    })
    const unknown = dubai.places.find((place) => place.pricing.kind === 'unknown')!
    const plan = placeInDay(empty, unknown.id, empty.days[0].date)
    plan.days[0].settings = { ...defaultRouteSettings, start: '10:00', end: '10:00' }
    expect(summarizeTrip(plan, dubai, 'family-1')).toMatchObject({
      plannedDays: 1,
      ticketCost: 0,
      unknownPrices: 1,
      lowerBound: true,
      needsChanges: 1,
    })
  })
  it('reflects saved visits and identifies trips with a different party', () => {
    const plan = placeInDay(createItinerary(dubai), 'dubai-dubai-mall', '2026-10-06')
    plan.days[0].settings = {
      ...defaultRouteSettings,
      adults: 4,
      children: 0,
      visits: { 'dubai-dubai-mall': 90 },
      waits: { 'dubai-dubai-mall': 10 },
    }
    const summary = summarizeTrip(plan, dubai, 'family-2')
    expect(summary.days[0]).toMatchObject({
      differentParty: true,
      minutes: { visits: 90, queues: 10 },
    })
    expect(summary.transportCost).toBe(summary.days[0].route.cost)
    expect(plan.days[0].settings.nolCardsOwned).toBe(false)
  })
})
describe('official hours', () => {
  it('parses a real-shaped schedule and rejects changed pages', () => {
    const source = hoursSources[1]
    const result = parseOfficialHours(
      '<p>Opening hours from <b>8 AM</b> to 9 PM</p>',
      source,
      '2026-10-03',
    )
    expect(result.schedule).toMatchObject({ opens: '08:00', closes: '21:00' })
    expect(() => parseOfficialHours('<p>Tickets 8 AM</p>', source, '2026-10-03')).toThrow()
  })
  it('checks local time, freshness and closed dates', () => {
    const place = {
      ...dubai.places[0],
      openingHours: {
        ...dubai.places[0].openingHours,
        checkedAt: '2026-10-03',
        schedule: { opens: '10:00', closes: '18:00', closedWeekdays: [] },
        closedWeekdays: [5],
      },
    }
    expect(openBySchedule(place, 'Asia/Dubai', new Date('2026-10-03T09:00:00Z'))).toBe(true)
    expect(openBySchedule(place, 'Asia/Dubai', new Date('2026-10-03T15:00:00Z'))).toBe(false)
    expect(openBySchedule(place, 'Asia/Dubai', new Date('2026-10-12T09:00:00Z'))).toBe(false)
    expect(closedOnDate(place, '2026-10-09')).toBe(true)
  })
})
