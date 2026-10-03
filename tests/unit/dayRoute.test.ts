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
  estimateQueue,
  selectTravelOption,
} from '../../src/domain/dayRoute'
import { closedOnDate } from '../../src/domain/openingHours'
import { createItinerary, normalizeItinerary } from '../../src/domain/itinerary'
import { dubaiDayIdeas } from '../../src/content/dayIdeas'
import { dayAdvice } from '../../src/domain/dayAdvice'

const dubai = destinations.dubai
const place = (slug: string) => dubai.places.find((place) => place.slug === slug)!
const date = '2026-10-08'
describe('day route', () => {
  it('walks between connected places but takes a taxi to keep a tight booking', () => {
    const places = [place('dubai-mall'), place('souk-al-bahar')]
    expect(evaluateRoute(places, dubai, '2026-10-06', defaultRouteSettings).stops[1].leg.mode).toBe(
      'walk',
    )
    const booked = evaluateRoute(places, dubai, '2026-10-06', {
      ...defaultRouteSettings,
      slots: { 'dubai-souk-al-bahar': '15:00' },
    })
    expect(booked.stops[1].leg.mode).toBe('taxi')
    expect(booked.stops[1].visitStart).toBe(toMinutes('15:00'))
    expect(booked.fits).toBe(true)
  })
  it('fills a long wait nearby without moving a booked visit or increasing the ticket budget', () => {
    const day = {
      ...createItinerary(dubai).days[0],
      placeIds: ['dubai-dubai-mall', 'dubai-dubai-fountain'],
      settings: { ...defaultRouteSettings, slots: { 'dubai-dubai-fountain': '18:30' } },
    }
    const before = evaluateRoute(
      day.placeIds.map((id) => dubai.places.find((row) => row.id === id)!),
      dubai,
      day.date,
      day.settings,
    )
    const suggestion = dayAdvice(day, dubai).find(
      (row) => row.addedPlace?.slug === 'souk-al-bahar',
    )!
    expect(suggestion.route.fits).toBe(true)
    expect(suggestion.day.placeIds).toEqual([
      'dubai-dubai-mall',
      'dubai-souk-al-bahar',
      'dubai-dubai-fountain',
    ])
    expect(suggestion.route.stops.at(-1)!.visitStart).toBe(toMinutes('18:30'))
    expect(suggestion.route.ticketCost).toBe(before.ticketCost)
    expect(suggestion.day.settings).toEqual(day.settings)
    expect(
      dayAdvice(day, dubai, [{ ...day, date: '2026-10-09', placeIds: ['dubai-souk-al-bahar'] }]),
    ).not.toContainEqual(suggestion)
  })
  it('prefers a taxi unless transit saves enough time-adjusted money', () => {
    const options = travelOptions(
      place('mall-of-the-emirates'),
      place('sky-views'),
      defaultRouteSettings,
    )
    const taxi = options.find((option) => option.mode === 'taxi')!
    const metro = options.find((option) => option.mode === 'metro')!
    expect(metro.cost).toBe(30)
    expect(selectTravelOption(options, defaultRouteSettings).mode).toBe('taxi')
    const owned = { ...defaultRouteSettings, nolCardsOwned: true }
    const chosen = selectTravelOption(options, owned)
    if (chosen.mode === 'metro') {
      expect(taxi.cost - metro.cost).toBeGreaterThanOrEqual(20)
      expect(metro.minutes - taxi.minutes).toBeLessThanOrEqual(15)
    }
    const route = evaluateRoute([place('mall-of-the-emirates'), place('sky-views')], dubai, date, {
      ...defaultRouteSettings,
      preference: 'cheap',
    })
    expect(route.nolCardFee).toBe(
      route.stops.some((stop) => stop.leg.mode === 'metro') || route.returnLeg.mode === 'metro'
        ? 36
        : 0,
    )
    const withCards = evaluateRoute(
      [place('mall-of-the-emirates'), place('sky-views')],
      dubai,
      date,
      { ...defaultRouteSettings, preference: 'cheap', nolCardsOwned: true },
    )
    expect(withCards.nolCardFee).toBe(0)
  })
  it('adjusts queues by season and arrival while keeping manual overrides', () => {
    const frame = place('dubai-frame')
    expect(dubai.places.filter((place) => place.queue).length).toBeGreaterThanOrEqual(20)
    expect(estimateQueue(frame, '2026-10-08', 11 * 60)).toBe(45)
    expect(estimateQueue(frame, '2026-10-08', 17 * 60)).toBe(90)
    expect(estimateQueue(frame, '2026-10-10', 11 * 60)).toBe(90)
    expect(estimateQueue(frame, '2026-07-08', 11 * 60)).toBeLessThan(45)
    const route = evaluateRoute([frame], dubai, '2026-10-10', {
      ...defaultRouteSettings,
      waits: { [frame.id]: 15 },
    })
    expect(route.stops[0].queueMinutes).toBe(15)
    const automatic = evaluateRoute([frame], dubai, '2026-10-10', defaultRouteSettings)
    expect(automatic.stops[0].queueMinutes).toBe(90)
  })
  it('counts the queue separately and keeps it before booked admission', () => {
    const frame = place('dubai-frame')
    const settings = { ...defaultRouteSettings, preference: 'fast' as const, breakMinutes: 0 }
    const without = evaluateRoute([frame], dubai, date, { ...settings, waits: { [frame.id]: 0 } })
    const withQueue = evaluateRoute([frame], dubai, date, settings)
    expect(withQueue.returnAt - without.returnAt).toBe(45)
    expect(withQueue.stops[0].visitMinutes).toBe(without.stops[0].visitMinutes)
    const booked = evaluateRoute([frame], dubai, date, {
      ...settings,
      slots: { [frame.id]: clockTime(without.stops[0].arrival + 10) },
    })
    expect(booked.fits).toBe(false)
    expect(booked.stops[0].warnings.join(' ')).toContain('Вход по билету')
  })
  it('suggests realistic shorter visits without cutting queues or breaks', () => {
    const mall = place('dubai-mall')
    const settings = { ...defaultRouteSettings, end: '15:30', preference: 'fast' as const }
    const day = { date, placeIds: [mall.id], settings }
    expect(evaluateRoute([mall], dubai, date, settings).fits).toBe(false)
    const shorter = dayAdvice(day, dubai).find((advice) => advice.title.includes('короче'))!
    expect(shorter.route.fits).toBe(true)
    expect(shorter.day.settings!.visits[mall.id]).toBeGreaterThanOrEqual(mall.duration.minMinutes)
    expect(shorter.day.settings!.breakMinutes).toBe(settings.breakMinutes)
    expect(shorter.day.settings!.waits).toEqual(settings.waits)
    expect(day.settings.visits).toEqual({})
  })
  it('does not move booked visits to another day', () => {
    const frame = place('dubai-frame')
    const settings = { ...defaultRouteSettings, end: '11:00', slots: { [frame.id]: '12:00' } }
    const day = { date, placeIds: [frame.id], settings }
    expect(dayAdvice(day, dubai, createItinerary(dubai).days).some((advice) => advice.move)).toBe(
      false,
    )
  })
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
  it('prices a private vehicle for the whole party', () => {
    expect(groupTicketPrice(place('lahbab-desert'), defaultRouteSettings, date)).toMatchObject({
      amount: 1000,
      unknown: false,
      childEstimated: false,
    })
    expect(
      groupTicketPrice(place('lahbab-desert'), { ...defaultRouteSettings, adults: 6 }, date).amount,
    ).toBe(2000)
  })
  it('uses hotel access and external weekday passes separately', () => {
    expect(groupTicketPrice(place('ja-beach'), defaultRouteSettings, date).amount).toBe(0)
    const external = { ...defaultRouteSettings, hotelBeachIncluded: false }
    expect(groupTicketPrice(place('ja-beach'), external, date).amount).toBe(900)
    expect(groupTicketPrice(place('ja-beach'), external, '2026-10-09').amount).toBe(1200)
  })
  it('counts confirmed safari transfers inside the six-hour package', () => {
    const settings = {
      ...defaultRouteSettings,
      start: '15:00',
      safariTransferConfirmed: true,
      slots: { [place('lahbab-desert').id]: '18:00' },
    }
    const route = evaluateRoute([place('lahbab-desert')], dubai, date, settings)
    expect(route.returnAt - toMinutes(settings.start)).toBe(360)
    expect(route.cost).toBe(0)
    expect(route.ticketCost).toBe(1000)
    expect(route.stops[0].leg.mode).toBe('tour')
    expect(route.returnLeg.mode).toBe('tour')
    expect(route.stops[0].pauseAfter).toBe(0)
    expect(route.fits).toBe(true)
    expect(
      evaluateRoute([place('lahbab-desert')], dubai, date, defaultRouteSettings).cost,
    ).toBeGreaterThan(0)
    expect(
      evaluateRoute([place('lahbab-desert'), place('dubai-mall')], dubai, date, settings).cost,
    ).toBeGreaterThan(0)
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
      start: '09:00',
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
