import { describe, expect, it } from 'vitest'
import { destinations } from '../../src/content/registry'
import { createItinerary } from '../../src/domain/itinerary'
import { defaultRouteSettings } from '../../src/domain/dayRoute'
import { tripProposal } from '../../src/domain/tripProposal'
import { exportPlan, importPlan } from '../../src/domain/planBackup'

const dubai = destinations.dubai
describe('plan copies', () => {
  it('preserves booked times, visits and transport settings without changing the plan', () => {
    const plan = tripProposal(dubai).plan
    plan.days[0].settings = {
      ...defaultRouteSettings,
      end: '21:00',
      nolCardsOwned: true,
      slots: { 'dubai-dubai-mall': '11:30' },
      visits: { 'dubai-dubai-mall': 120 },
      breakAfter: 'dubai-dubai-mall',
      waits: { 'dubai-dubai-mall': 15 },
      ticketChecks: { 'dubai-dubai-frame:family-1': { adults: 4, children: 0, slot: '12:00' } },
    }
    const before = structuredClone(plan)
    expect(importPlan(exportPlan(plan, dubai), dubai)).toMatchObject({ plan, skippedStops: 0 })
    expect(plan).toEqual(before)
    expect(
      importPlan(exportPlan(createItinerary(dubai), dubai), dubai).plan.days.every(
        (day) => !day.placeIds.length,
      ),
    ).toBe(true)
  })
  it('reports skipped stops and rejects unusable copies', () => {
    const data = JSON.parse(exportPlan(tripProposal(dubai).plan, dubai))
    data.plan.days[0].placeIds.push('missing-place', data.plan.days[0].placeIds[0])
    expect(importPlan(JSON.stringify(data), dubai).skippedStops).toBe(2)
    data.destinationId = 'other'
    expect(() => importPlan(JSON.stringify(data), dubai)).toThrow('другому направлению')
    data.destinationId = 'dubai'
    data.version = 2
    expect(() => importPlan(JSON.stringify(data), dubai)).toThrow('поддерживаемого формата')
    data.version = 1
    data.plan.days = [{ date: '2025-10-06', placeIds: ['dubai-dubai-mall'] }]
    expect(() => importPlan(JSON.stringify(data), dubai)).toThrow('Ваш план не изменён')
    expect(() => importPlan('{broken', dubai)).toThrow('JSON')
    expect(() => importPlan(' '.repeat(200_001), dubai)).toThrow('200 КБ')
  })
})
