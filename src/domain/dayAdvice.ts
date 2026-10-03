import type { DestinationBundle, Place } from './model'
import type { Itinerary } from './itinerary'
import { clockTime, defaultRouteSettings, evaluateRoute, optimizeDay } from './dayRoute'
import { closedOnDate } from './openingHours'

export function dayAdvice(
  day: Itinerary['days'][number],
  bundle: DestinationBundle,
  otherDays: Itinerary['days'] = [],
) {
  const places = day.placeIds.map((id) => bundle.places.find((place) => place.id === id)!)
  const settings = day.settings ?? defaultRouteSettings
  const current = evaluateRoute(places, bundle, day.date, settings)
  type Advice = {
    title: string
    note: string
    day: Itinerary['days'][number]
    route: typeof current
    move?: { placeId: string; date: string; target: Itinerary['days'][number] }
  }
  const advice: Advice[] = []
  if (current.fits || !places.length) return advice
  const improve = (order: Place[], config = settings, date = day.date) =>
    order.length <= 5
      ? optimizeDay(order, bundle, date, config)
      : evaluateRoute(order, bundle, date, config)
  const faster = improve(places, { ...settings, preference: 'fast' })
  if (faster.fits)
    advice.push({
      title: 'Быстрее добраться и поменять порядок',
      note: 'Все места и время посещений сохранены. Проверьте бюджет: более быстрый транспорт может стоить дороже.',
      day: {
        ...day,
        settings: { ...settings, preference: 'fast' },
        placeIds: faster.stops.map((stop) => stop.place.id),
      },
      route: faster,
    })
  const visits = { ...settings.visits }
  const shortened: string[] = []
  const candidates = current.stops
    .filter(
      (stop) =>
        !['desert', 'hatta'].includes(stop.place.areaId) &&
        !stop.place.openingHours.sessions &&
        stop.visitMinutes > stop.place.duration.minMinutes &&
        settings.visits[stop.place.id] === undefined,
    )
    .sort(
      (a, b) =>
        b.visitMinutes -
        b.place.duration.minMinutes -
        (a.visitMinutes - a.place.duration.minMinutes),
    )
  for (const stop of candidates) {
    visits[stop.place.id] = stop.place.duration.minMinutes
    shortened.push(`${stop.place.nameRu}: ${stop.visitMinutes} → ${visits[stop.place.id]} мин`)
    const config = { ...settings, visits }
    const route = improve(places, config)
    if (route.fits) {
      advice.push({
        title: 'Сделать часть посещений короче',
        note: `${shortened.join('; ')}. Оставляем не меньше нижней границы времени из карточки. Запас на очереди и отдых сохранён; выбранное вами время не сокращаем.`,
        day: { ...day, settings: config, placeIds: route.stops.map((stop) => stop.place.id) },
        route,
      })
      break
    }
  }
  for (const place of places) {
    if (settings.slots[place.id]) continue
    const remaining = improve(places.filter((row) => row.id !== place.id))
    if (!remaining.fits) continue
    for (const target of otherDays.filter((target) => target.date !== day.date)) {
      if (closedOnDate(place, target.date)) continue
      const config = target.settings ?? defaultRouteSettings
      const targetPlaces = target.placeIds.map((id) => bundle.places.find((row) => row.id === id)!)
      const next = improve([...targetPlaces, place], config, target.date)
      if (!next.fits) continue
      advice.push({
        title: `Перенести «${place.nameRu}» на другой день`,
        note: `Оба дня помещаются в выбранное время. В другой день возвращение ≈ ${clockTime(next.returnAt)}. Посещения с уже указанным временем билета не переносим.`,
        day: { ...day, placeIds: remaining.stops.map((stop) => stop.place.id) },
        route: remaining,
        move: {
          placeId: place.id,
          date: target.date,
          target: {
            ...target,
            settings: config,
            placeIds: next.stops.map((stop) => stop.place.id),
          },
        },
      })
      break
    }
    if (advice.length >= 3) break
  }
  return advice.slice(0, 3)
}
