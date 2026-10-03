import { describe, expect, it } from 'vitest'
import { destinations } from '../../src/content/registry'
import {
  defaultRouteSettings,
  evaluateRoute,
  clockTime,
  toMinutes,
} from '../../src/domain/dayRoute'
import { continueDay } from '../../src/domain/dayContinuation'
import { createItinerary } from '../../src/domain/itinerary'
import { tripProposal } from '../../src/domain/tripProposal'

const dubai = destinations.dubai
const place = (slug: string) => dubai.places.find((row) => row.slug === slug)!
const checkpoint = {
  afterId: 'dubai-dubai-mall',
  readyAt: '17:45',
  mealDone: true,
  nolCardsOwned: false,
  optionalIds: [],
}

describe('day continuation', () => {
  it('starts at the visited mall and excludes completed visits and the meal', () => {
    const day = tripProposal(dubai).days[0].day
    const copy = structuredClone(day)
    const result = continueDay(day, dubai, checkpoint)
    expect(result.route.stops.map((stop) => stop.place.slug)).toEqual([
      'dubai-fountain',
      'city-walk',
    ])
    expect(result.route.stops[0].leg.origin).toEqual(place('dubai-mall').coordinates)
    expect(result.route.stops[0].departure).toBe(toMinutes('17:45'))
    expect(result.route.stops[0].leg.mode).toBe('walk')
    expect(result.route.stops.reduce((sum, stop) => sum + stop.pauseAfter, 0)).toBe(0)
    expect(result.route.fits).toBe(true)
    expect(day).toEqual(copy)
  })
  it('skips only explicitly optional places while keeping manual durations and queues', () => {
    const day = tripProposal(dubai).days[0].day
    const late = { ...checkpoint, readyAt: '18:30' }
    const strict = continueDay(day, dubai, late)
    expect(strict.route.fits).toBe(false)
    expect(strict.options.every((option) => option.day.placeIds.length === 2)).toBe(true)
    const flexible = continueDay(day, dubai, { ...late, optionalIds: ['dubai-city-walk'] })
    const option = flexible.options.find((row) => row.day.placeIds.length === 1)!
    expect(option.route.fits).toBe(true)
    expect(option.route.stops[0].place.slug).toBe('dubai-fountain')
    expect(option.route.stops[0].visitMinutes).toBe(45)
    expect(option.route.stops[0].queueMinutes).toBe(30)
    expect(day.settings!.visits['dubai-dubai-mall']).toBe(360)
  })
  it('protects fixed entries and purchases that need rechecking after a party change', () => {
    const frame = place('dubai-frame')
    for (const settings of [
      { ...defaultRouteSettings, slots: { [frame.id]: '12:00' } },
      {
        ...defaultRouteSettings,
        ticketChecks: { [`${frame.id}:family-2`]: { adults: 1, children: 1, childAge: 10 } },
      },
    ]) {
      const day = { ...createItinerary(dubai).days[0], placeIds: [frame.id], settings }
      const result = continueDay(day, dubai, {
        ...checkpoint,
        afterId: '',
        readyAt: '21:00',
        optionalIds: [frame.id],
      })
      expect(result.route.fits).toBe(false)
      expect(result.options).toEqual([])
    }
  })
  it('shortens an ordinary visit only as much as needed and preserves explicit durations', () => {
    const marina = place('dubai-marina-walk')
    const full = evaluateRoute([marina], dubai, '2026-10-06', defaultRouteSettings)
    const settings = {
      ...defaultRouteSettings,
      end: clockTime(full.returnAt + defaultRouteSettings.buffer - 15),
    }
    const day = { ...createItinerary(dubai).days[0], placeIds: [marina.id], settings }
    const result = continueDay(day, dubai, {
      ...checkpoint,
      afterId: '',
      readyAt: '10:00',
      mealDone: false,
    })
    const shorter = result.options.find((row) => row.title === 'Чуть короче на месте')!
    expect(shorter.route.fits).toBe(true)
    expect(shorter.route.stops[0].visitMinutes).toBeGreaterThan(marina.duration.minMinutes)
    expect(shorter.route.stops[0].visitMinutes).toBeLessThan(full.stops[0].visitMinutes)
    const manual = { ...day, settings: { ...settings, visits: { [marina.id]: 90 } } }
    expect(
      continueDay(manual, dubai, {
        ...checkpoint,
        afterId: '',
        readyAt: '10:00',
        mealDone: false,
      }).options.some((row) => row.title === 'Чуть короче на месте'),
    ).toBe(false)
  })
  it('calculates a real return from the final stop and rejects an expired day', () => {
    const day = tripProposal(dubai).days[0].day
    const result = continueDay(day, dubai, {
      ...checkpoint,
      afterId: 'dubai-city-walk',
      readyAt: '20:00',
    })
    expect(result.route.stops).toEqual([])
    expect(result.route.returnLeg.origin).toEqual(place('city-walk').coordinates)
    expect(result.route.returnLeg.destination).toEqual(dubai.trip.accommodation!.coordinates)
    expect(result.route.returnLeg.minutes).toBeGreaterThan(0)
    expect(result.route.returnLeg.cost).toBeGreaterThan(0)
    expect(result.route.ticketCost).toBe(0)
    expect(result.route.returnAt).toBeGreaterThan(toMinutes('20:00'))
    const expired = continueDay(day, dubai, { ...checkpoint, readyAt: '22:30' })
    expect(expired.validTime).toBe(false)
    expect(expired.options).toEqual([])
  })
  it('keeps the more recommended optional stop when two long visits must be skipped', () => {
    const ranked = ['city-walk', 'dubai-marina-walk', 'souk-al-bahar'].map((slug, index) => ({
      ...place(slug),
      recommendation: { priority: [50, 100, 1][index], reason: 'Приоритет для проверки маршрута' },
    }))
    const bundle = {
      ...dubai,
      places: dubai.places.map((row) => ranked.find((candidate) => candidate.id === row.id) ?? row),
    }
    const day = {
      ...createItinerary(bundle).days[0],
      placeIds: ranked.map((row) => row.id),
      settings: {
        ...defaultRouteSettings,
        end: '14:00',
        visits: { [ranked[0].id]: 360, [ranked[1].id]: 360, [ranked[2].id]: 15 },
      },
    }
    const result = continueDay(day, bundle, {
      ...checkpoint,
      afterId: '',
      readyAt: '10:00',
      optionalIds: day.placeIds,
    })
    expect(result.options).toHaveLength(1)
    expect(result.options[0].day.placeIds).toEqual([ranked[2].id])
    expect(result.options[0].route.fits).toBe(true)
  })
  it('uses the confirmed operator return after the safari has finished', () => {
    const safari = dubai.places.find((row) => row.areaId === 'desert')!
    const day = {
      ...createItinerary(dubai).days[0],
      placeIds: [safari.id],
      settings: { ...defaultRouteSettings, safariTransferConfirmed: true },
    }
    const result = continueDay(day, dubai, { ...checkpoint, afterId: safari.id, readyAt: '20:00' })
    expect(result.route.returnLeg.mode).toBe('tour')
    expect(result.route.returnLeg.cost).toBe(0)
    expect(result.route.returnLeg.minutes).toBeGreaterThan(0)
    expect(result.route.returnLeg.destination).toEqual(dubai.trip.accommodation!.coordinates)
  })
})
