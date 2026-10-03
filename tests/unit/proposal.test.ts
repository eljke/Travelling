import { describe, expect, it } from 'vitest'
import { destinations } from '../../src/content/registry'
import { tripProposal } from '../../src/domain/tripProposal'

const dubai = destinations.dubai
describe('trip proposal', () => {
  it('fits mandatory places and seasonal queues across five days', () => {
    const proposal = tripProposal(dubai)
    const ids = proposal.plan.days.flatMap((day) => day.placeIds)
    for (const slug of [
      'dubai-mall',
      'madinat-jumeirah',
      'miracle-garden',
      'butterfly-garden',
      'dubai-outlet-mall',
    ])
      expect(ids).toContain(`dubai-${slug}`)
    expect(new Set(ids).size).toBe(ids.length)
    expect(proposal.days.every(({ route }) => route.fits)).toBe(true)
    expect(proposal.plan.days[2].placeIds).toContain('dubai-miracle-garden')
    expect(proposal.plan.days[0].placeIds).toContain('dubai-dubai-mall')
    expect(proposal.plan.days[0].placeIds).toContain('dubai-city-walk')
    const mall = proposal.days[0].route.stops.find((stop) => stop.place.slug === 'dubai-mall')!
    expect(mall.visitMinutes).toBe(360)
    expect(mall.pauseAfter).toBe(45)
    expect(proposal.days[0].route.stops.at(-1)!.visitStart).toBeGreaterThan(18 * 60)
    expect(proposal.days[0].route.returnAt + 30).toBeLessThanOrEqual(22 * 60)
    const fountain = proposal.days[0].route.stops.find(
      (stop) => stop.place.slug === 'dubai-fountain',
    )!
    expect(fountain.visitStart - fountain.arrival - fountain.queueMinutes).toBeLessThan(60)
    expect(proposal.plan.days[4].placeIds).toEqual(['dubai-ja-beach'])
    expect(proposal.days[4].route.ticketCost).toBe(0)
    expect(proposal.days[3].route.ticketCost).toBe(282)
  })
  it('switches the resort day and includes an optional aquarium without dropping essentials', () => {
    const proposal = tripProposal(dubai, true, true)
    expect(proposal.plan.days[0].placeIds).toEqual(['dubai-ja-beach'])
    expect(proposal.plan.days[4].placeIds).toContain('dubai-dubai-aquarium')
    expect(proposal.days[4].route.fits).toBe(false)
    expect(
      proposal.days[4].route.stops.find((stop) => stop.place.slug === 'dubai-mall')!.visitMinutes,
    ).toBe(360)
    expect(proposal.days[4].route.ticketCost).toBeGreaterThan(0)
  })
  it('offers one extra and rejects both without cutting the mall or rest', () => {
    for (const extra of ['none', 'sky-views', 'city-walk'] as const) {
      const proposal = tripProposal(dubai, false, false, extra)
      expect(proposal.days.every(({ route }) => route.fits)).toBe(true)
      expect(
        proposal.days[0].route.stops.find((stop) => stop.place.slug === 'dubai-mall')!.visitMinutes,
      ).toBe(360)
    }
    const both = tripProposal(dubai, false, false, 'both').days[0]
    expect(both.route.fits).toBe(false)
    expect(both.day.placeIds).toHaveLength(4)
    expect(both.day.settings!.breakMinutes).toBe(45)
    expect(both.day.settings!.buffer).toBe(30)
  })
})
