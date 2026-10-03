import type { Place } from './model'
import type { DayRoute, RouteSettings } from './dayRoute'
import { groupTicketPrice } from './dayRoute'

export type BudgetScope = 'family-1' | 'family-2' | 'both'
export const families = {
  'family-1': { label: 'Семья 1 · 4 взрослых', adults: 4, children: 0, share: 4 / 6 },
  'family-2': { label: 'Семья 2 · взрослый и ребёнок', adults: 1, children: 1, share: 2 / 6 },
  both: { label: 'Обе семьи · 6 человек', adults: 5, children: 1, share: 1 },
}
export const hasFamilyComposition = (settings: RouteSettings) =>
  settings.adults === 5 && settings.children === 1

export function ticketChecks(placeId: string, scope: BudgetScope, settings: RouteSettings) {
  const separate = hasFamilyComposition(settings)
  const scopes: BudgetScope[] = separate
    ? scope === 'both'
      ? ['family-1', 'family-2']
      : [scope]
    : ['both']
  return scopes.map((familyScope) => {
    const party = separate ? families[familyScope] : settings
    const key = `${placeId}:${familyScope}`
    const expected = {
      adults: party.adults,
      children: party.children,
      childAge: party.children ? settings.childAge : undefined,
      slot: settings.slots[placeId],
    }
    const saved = settings.ticketChecks[key]
    const checked = Boolean(
      saved &&
      saved.adults === expected.adults &&
      saved.children === expected.children &&
      saved.childAge === expected.childAge &&
      saved.slot === expected.slot,
    )
    return {
      key,
      label: separate
        ? families[familyScope].label
        : `Весь состав · ${settings.adults + settings.children} человек`,
      expected,
      checked,
      changed: Boolean(saved && !checked),
    }
  })
}

export function needsTicket(place: Place, settings: RouteSettings, date: string) {
  const price = groupTicketPrice(place, settings, date)
  return place.pricing.kind !== 'free' && (price.unknown || price.amount > 0)
}
export function hasTicketCommitment(placeId: string, settings: RouteSettings) {
  return (
    Boolean(settings.slots[placeId]) ||
    Object.keys(settings.ticketChecks).some((key) => key.startsWith(`${placeId}:`))
  )
}
export function familyTicketPrice(
  place: Place,
  scope: BudgetScope,
  settings: RouteSettings,
  date: string,
  currency = 'AED',
) {
  if (!hasFamilyComposition(settings) || scope === 'both')
    return groupTicketPrice(place, settings, date, currency)
  const family = families[scope]
  if (place.pricing.unit === 'group') {
    const full = groupTicketPrice(place, settings, date, currency)
    return { ...full, amount: full.amount * family.share }
  }
  return groupTicketPrice(
    place,
    { ...settings, adults: family.adults, children: family.children },
    date,
    currency,
  )
}
export function familyRouteBudget(
  route: DayRoute,
  scope: BudgetScope,
  settings: RouteSettings,
  date: string,
  currency = 'AED',
) {
  const share = hasFamilyComposition(settings) ? families[scope].share : 1
  return {
    cost: route.cost * share,
    highCost: route.highCost * share,
    ticketCost: route.stops.reduce(
      (sum, stop) => sum + familyTicketPrice(stop.place, scope, settings, date, currency).amount,
      0,
    ),
  }
}
