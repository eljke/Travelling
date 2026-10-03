import { describe, expect, it } from 'vitest'
import { destinations } from '../../src/content/registry'
import {
  defaultRouteSettings,
  clockTime,
  evaluateRoute,
  groupTicketPrice,
  optimizeDay,
  travelOptions,
  toMinutes,
} from '../../src/domain/dayRoute'
import { closedOnDate } from '../../src/domain/openingHours'
import { createItinerary, normalizeItinerary } from '../../src/domain/itinerary'
import { dubaiDayIdeas } from '../../src/content/dayIdeas'

const dubai = destinations.dubai
const place = (slug: string) => dubai.places.find((place) => place.slug === slug)!
const date = '2026-10-08'
describe('day route', () => {
  it('uses existing places in every day idea', () => {
    expect(
      dubaiDayIdeas
        .flatMap((idea) => idea.slugs)
        .every((slug) => dubai.places.some((place) => place.slug === slug)),
    ).toBe(true)
  })
  it('fits six people in one Max and counts two ordinary taxis', () => {
    const origin = { coordinates: dubai.trip.accommodation!.coordinates }
    const max = travelOptions(origin, place('dubai-mall'), defaultRouteSettings).find(
      (leg) => leg.mode === 'taxi',
    )!
    const standard = travelOptions(origin, place('dubai-mall'), {
      ...defaultRouteSettings,
      taxi: 'standard',
    }).find((leg) => leg.mode === 'taxi')!
    expect(max.detail).toContain('1 Hala Max')
    expect(standard.detail).toContain('2 обычное такси')
    expect(standard.cost).toBeGreaterThanOrEqual(max.cost * 2 - 1)
    expect(
      travelOptions(origin, place('dubai-mall'), defaultRouteSettings).some(
        (leg) => leg.mode === 'metro',
      ),
    ).toBe(true)
  })
  it('uses age policies and falls back conservatively', () => {
    expect(groupTicketPrice(place('dubai-frame'), defaultRouteSettings, date).amount).toBe(270)
    expect(groupTicketPrice(place('terra'), defaultRouteSettings, date).amount).toBe(580)
    expect(groupTicketPrice(place('green-planet'), defaultRouteSettings, date).amount).toBe(930)
    expect(
      groupTicketPrice(place('green-planet'), { ...defaultRouteSettings, childAge: 10 }, date)
        .amount,
    ).toBe(910)
    expect(
      groupTicketPrice(
        place('dubai-frame'),
        { ...defaultRouteSettings, childAge: undefined },
        date,
      ),
    ).toMatchObject({ amount: 300, childEstimated: true })
  })
  it('improves order without dropping stops or breaking return time', () => {
    const stops = ['dubai-mall', 'dubai-marina-walk', 'dubai-aquarium'].map(place)
    const before = evaluateRoute(stops, dubai, date, defaultRouteSettings)
    const after = optimizeDay(stops, dubai, date, defaultRouteSettings)
    expect(after.score).toBeLessThanOrEqual(before.score)
    expect(new Set(after.stops.map((stop) => stop.place.id))).toEqual(
      new Set(stops.map((place) => place.id)),
    )
    expect(after.returnAt + defaultRouteSettings.buffer).toBeLessThanOrEqual(toMinutes('22:00'))
    expect(after.fits).toBe(true)
  })
  it('flags a short day, seasonal closure and published closing time', () => {
    const route = optimizeDay(['dubai-mall', 'dubai-aquarium'].map(place), dubai, date, {
      ...defaultRouteSettings,
      end: '10:00',
    })
    expect(route.fits).toBe(false)
    expect(route.stops).toHaveLength(2)
    expect(closedOnDate(place('miracle-garden'), '2026-10-06')).toBe(true)
    expect(closedOnDate(place('miracle-garden'), date)).toBe(false)
    expect(closedOnDate(place('global-village'), '2026-10-10')).toBe(true)
    expect(
      evaluateRoute([place('green-planet')], dubai, date, {
        ...defaultRouteSettings,
        start: '17:00',
      }).fits,
    ).toBe(false)
  })
  it('waits for sessions and respects a booked time', () => {
    const mosque = evaluateRoute([place('jumeirah-mosque')], dubai, date, defaultRouteSettings)
    expect(['10:00', '14:00'].map(toMinutes)).toContain(mosque.stops[0].visitStart)
    expect(mosque.stops[0].arrival + 30).toBeLessThanOrEqual(mosque.stops[0].visitStart)
    expect(
      evaluateRoute([place('jumeirah-mosque')], dubai, '2026-10-09', defaultRouteSettings).fits,
    ).toBe(false)
    const missed = evaluateRoute([place('dubai-mall')], dubai, date, {
      ...defaultRouteSettings,
      slots: { 'dubai-dubai-mall': '09:00' },
    })
    expect(missed.fits).toBe(false)
    expect(missed.stops[0].warnings.join(' ')).toContain('Вход по билету')
    const booked = evaluateRoute([place('green-planet')], dubai, date, {
      ...defaultRouteSettings,
      slots: { 'dubai-green-planet': '12:00' },
      visits: { 'dubai-green-planet': 45 },
    })
    expect(booked.stops[0].visitStart).toBe(toMinutes('12:00'))
    expect(booked.stops[0].visitMinutes).toBe(45)
  })
  it('chooses a timely ride when the cheaper option misses admission', () => {
    const origin = { coordinates: dubai.trip.accommodation!.coordinates }
    const taxi = travelOptions(origin, place('dubai-mall'), defaultRouteSettings).find(
      (leg) => leg.mode === 'taxi',
    )!
    const slot = toMinutes('09:00') + taxi.minutes + 2
    const route = evaluateRoute([place('dubai-mall')], dubai, date, {
      ...defaultRouteSettings,
      preference: 'cheap',
      slots: { 'dubai-dubai-mall': clockTime(slot) },
    })
    expect(route.stops[0].arrival).toBeLessThanOrEqual(slot)
    expect(route.fits).toBe(true)
  })
  it('keeps hotel walks local and does not cross the Creek on foot', () => {
    const nearby = evaluateRoute([place('ja-beach')], dubai, date, defaultRouteSettings)
    expect(nearby.cost).toBe(0)
    expect(nearby.stops[0].leg.mode).toBe('walk')
    expect(
      travelOptions(place('al-fahidi'), place('gold-souk'), defaultRouteSettings).some(
        (leg) => leg.mode === 'walk',
      ),
    ).toBe(false)
  })
  it('preserves settings in a shared or saved plan', () => {
    const plan = createItinerary(dubai)
    plan.days[0].settings = {
      ...defaultRouteSettings,
      start: '11:00',
      slots: { 'dubai-green-planet': '12:00' },
    }
    expect(normalizeItinerary(JSON.parse(JSON.stringify(plan)), dubai).days[0].settings).toEqual(
      plan.days[0].settings,
    )
  })
})
