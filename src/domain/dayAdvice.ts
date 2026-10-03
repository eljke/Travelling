import type { DestinationBundle, Place } from './model'
import type { Itinerary } from './itinerary'
import { clockTime, defaultRouteSettings, evaluateRoute, optimizeDay } from './dayRoute'
import { closedOnDate } from './openingHours'
import { distanceBetween } from './geo'

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
    addedPlace?: Place
    move?: { placeId: string; date: string; target: Itinerary['days'][number] }
  }
  const advice: Advice[] = []
  if (!places.length) return advice
  if (current.fits) {
    const planned = new Set([...day.placeIds, ...otherDays.flatMap((other) => other.placeIds)])
    for (const [index, stop] of current.stops.entries()) {
      const idle = stop.visitStart - stop.arrival - stop.queueMinutes
      if (idle < 60) continue
      const previous = places[index - 1]
      const candidates = bundle.places.filter(
        (place) =>
          !planned.has(place.id) &&
          place.pricing.kind === 'free' &&
          !closedOnDate(place, day.date) &&
          distanceBetween(place.coordinates, stop.place.coordinates) <= 1.5 &&
          (!previous || distanceBetween(place.coordinates, previous.coordinates) <= 1.5),
      )
      for (const place of candidates) {
        const order = [...places.slice(0, index), place, ...places.slice(index)]
        const next = evaluateRoute(order, bundle, day.date, settings)
        const target = next.stops.find((row) => row.place.id === stop.place.id)!
        const reduced = idle - (target.visitStart - target.arrival - target.queueMinutes)
        if (
          !next.fits ||
          reduced < 30 ||
          next.returnAt > current.returnAt + 15 ||
          next.highCost > current.highCost + 10 ||
          next.ticketCost > current.ticketCost
        )
          continue
        advice.push({
          title: `Пока ждём — «${place.nameRu}» рядом`,
          note: `До «${stop.place.nameRu}» есть около ${Math.round(idle)} мин свободного времени. Прогулка без входного билета уменьшит ожидание примерно на ${Math.round(reduced)} мин. Порядок остальных мест, билеты, очереди и перерыв сохранены; сравним ниже итоговый бюджет.`,
          day: { ...day, placeIds: order.map((row) => row.id) },
          route: next,
          addedPlace: place,
        })
      }
    }
    return advice.sort((a, b) => a.route.highCost - b.route.highCost).slice(0, 3)
  }
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
