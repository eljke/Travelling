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
