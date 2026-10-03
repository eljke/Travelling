import { describe, expect, it } from 'vitest'
import { destinations } from '../../src/content/registry'
import { defaultRouteSettings, evaluateRoute, groupTicketPrice } from '../../src/domain/dayRoute'
import {
  familyTicketPrice,
  familyRouteBudget,
  ticketChecks,
  needsTicket,
} from '../../src/domain/families'

const bundle = destinations.dubai
const date = '2026-10-08'
const place = (slug: string) => bundle.places.find((place) => place.slug === slug)!
describe('family budgets', () => {
  it('keeps purchases separate and rechecks a changed party or booked time', () => {
    const settings = structuredClone(defaultRouteSettings)
    const id = place('dubai-frame').id
    const first = ticketChecks(id, 'family-1', settings)[0]
    settings.ticketChecks[first.key] = first.expected
    expect(ticketChecks(id, 'both', settings).map((check) => check.checked)).toEqual([true, false])
    const second = ticketChecks(id, 'family-2', settings)[0]
    settings.ticketChecks[second.key] = second.expected
    settings.childAge = 12
    expect(ticketChecks(id, 'both', settings).map((check) => check.checked)).toEqual([true, false])
    settings.childAge = 11
    settings.slots[id] = '12:00'
    expect(ticketChecks(id, 'both', settings).every((check) => check.changed)).toBe(true)
    settings.adults = 4
    settings.children = 0
    expect(ticketChecks(id, 'family-1', settings)).toMatchObject([
      { checked: false, label: 'Весь состав · 4 человек' },
    ])
    expect(needsTicket(place('ja-beach'), settings, date)).toBe(false)
    expect(needsTicket(place('dubai-frame'), settings, date)).toBe(true)
  })
  it('sums personal child tickets and shares one group package', () => {
    for (const slug of ['green-planet', 'dubai-frame', 'lahbab-desert']) {
      const attraction = place(slug)
      const first = familyTicketPrice(attraction, 'family-1', defaultRouteSettings, date)
      const second = familyTicketPrice(attraction, 'family-2', defaultRouteSettings, date)
      const all = groupTicketPrice(attraction, defaultRouteSettings, date)
      expect(first.amount + second.amount).toBeCloseTo(all.amount)
    }
    expect(
      familyTicketPrice(place('dubai-frame'), 'family-1', defaultRouteSettings, date).amount,
    ).toBe(200)
    expect(
      familyTicketPrice(place('dubai-frame'), 'family-2', defaultRouteSettings, date).amount,
    ).toBe(70)
  })
  it('splits shared transport while keeping its full cost', () => {
    const route = evaluateRoute([place('dubai-mall')], bundle, date, defaultRouteSettings)
    const first = familyRouteBudget(route, 'family-1', defaultRouteSettings, date)
    const second = familyRouteBudget(route, 'family-2', defaultRouteSettings, date)
    expect(first.cost + second.cost).toBeCloseTo(route.cost)
    expect(first.highCost + second.highCost).toBeCloseTo(route.highCost)
    expect(route.stops[0].leg.detail).toContain('1 Hala Max')
  })
})
