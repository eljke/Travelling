import type { DestinationBundle, Place } from './model'
import type { Itinerary } from './itinerary'
import { defaultRouteSettings, evaluateRoute, toMinutes } from './dayRoute'
import { hasTicketCommitment } from './families'

export function protectedVisit(place: Place, day: Itinerary['days'][number]) {
  const settings = day.settings ?? defaultRouteSettings
  return hasTicketCommitment(place.id, settings)
}

export function continueDay(
  day: Itinerary['days'][number],
  bundle: DestinationBundle,
  checkpoint: {
    afterId: string
    readyAt: string
    mealDone: boolean
    nolCardsOwned: boolean
    optionalIds: string[]
  },
) {
  const original = day.settings ?? defaultRouteSettings
  const anchorIndex = checkpoint.afterId ? day.placeIds.indexOf(checkpoint.afterId) : -1
  const anchor =
    anchorIndex < 0 ? undefined : bundle.places.find((place) => place.id === checkpoint.afterId)!
  const origin = anchor
    ? {
        name: anchor.nameRu,
        coordinates: anchor.coordinates,
        slug: anchor.slug,
        areaId: anchor.areaId,
      }
    : undefined
  const places = day.placeIds
    .slice(anchorIndex + 1)
    .map((id) => bundle.places.find((place) => place.id === id)!)
  const settings = {
    ...original,
    start: checkpoint.readyAt,
    breakMinutes: checkpoint.mealDone ? 0 : original.breakMinutes,
    nolCardsOwned: checkpoint.nolCardsOwned,
  }
  const remaining = { ...day, placeIds: places.map((place) => place.id), settings }
  const route = evaluateRoute(places, bundle, day.date, settings, origin)
  type Option = { title: string; note: string; day: typeof remaining; route: typeof route }
  const options: Option[] = []
  const validTime = toMinutes(settings.start) < toMinutes(settings.end)
  if (validTime && !route.fits) {
    const fastSettings = { ...settings, preference: 'fast' as const }
    const faster = evaluateRoute(places, bundle, day.date, fastSettings, origin)
    if (faster.fits && faster.returnAt < route.returnAt)
      options.push({
        title: 'Быстрее доехать',
        note: 'Все остановки, время посещений и очереди сохранены. Ниже — новая оценка дороги и расходов.',
        day: { ...remaining, settings: fastSettings },
        route: faster,
      })
    const visits = { ...settings.visits }
    const shortened: string[] = []
    let shortenedRoute = route
    for (const stop of route.stops
      .filter(
        (stop) =>
          !protectedVisit(stop.place, day) &&
          !stop.place.openingHours.sessions &&
          !['desert', 'hatta'].includes(stop.place.areaId) &&
          original.visits[stop.place.id] === undefined &&
          stop.visitMinutes > stop.place.duration.minMinutes,
      )
      .sort(
        (a, b) =>
          b.visitMinutes -
          b.place.duration.minMinutes -
          (a.visitMinutes - a.place.duration.minMinutes),
      )) {
      if (shortenedRoute.violations) break
      const needed = Math.max(0, settings.buffer - shortenedRoute.slack)
      const minutes = Math.max(
        stop.place.duration.minMinutes,
        stop.visitMinutes - Math.ceil(needed / 5) * 5,
      )
      if (minutes === stop.visitMinutes) continue
      visits[stop.place.id] = minutes
      shortened.push(`${stop.place.nameRu}: ${stop.visitMinutes} → ${minutes} мин`)
      shortenedRoute = evaluateRoute(places, bundle, day.date, { ...settings, visits }, origin)
      if (shortenedRoute.fits) {
        options.push({
          title: 'Чуть короче на месте',
          note: `${shortened.join('; ')}. Не ниже разумного времени из карточки. Ваши ручные длительности, купленные посещения, очереди и отдых сохранены.`,
          day: { ...remaining, settings: { ...settings, visits } },
          route: shortenedRoute,
        })
        break
      }
    }
    const optional = places.filter(
      (place) => checkpoint.optionalIds.includes(place.id) && !protectedVisit(place, day),
    )
    const groups = optional.map((place) => [place])
    const ranked = [...optional].sort(
      (a, b) => (b.recommendation?.priority ?? 100) - (a.recommendation?.priority ?? 100),
    )
    for (let count = 2; count <= ranked.length; count++) groups.push(ranked.slice(0, count))
    for (const group of groups) {
      const kept = places.filter((place) => !group.includes(place))
      const next = evaluateRoute(kept, bundle, day.date, settings, origin)
      if (!next.fits) continue
      options.push({
        title: group.length === 1 ? `Без «${group[0].nameRu}»` : 'Сократить маршрут',
        note: `Пропускаем: ${group.map((place) => place.nameRu).join(', ')}. Эти места вы разрешили пропустить. Порядок остальных остановок, билеты и время на месте сохранены.`,
        day: { ...remaining, placeIds: kept.map((place) => place.id) },
        route: next,
      })
      if (options.length >= 3 || group.length > 1) break
    }
  }
  return { day: remaining, route, origin, validTime, options: options.slice(0, 3) }
}
