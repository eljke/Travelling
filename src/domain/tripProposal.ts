import type { DestinationBundle } from './model'
import { createItinerary } from './itinerary'
import { defaultRouteSettings, evaluateRoute, optimizeDay } from './dayRoute'

export type DowntownExtra = 'none' | 'city-walk' | 'sky-views' | 'both'

export function tripProposal(
  bundle: DestinationBundle,
  resortFirst = false,
  aquarium = false,
  downtownExtra: DowntownExtra = 'city-walk',
) {
  const extras =
    downtownExtra === 'both'
      ? ['sky-views', 'city-walk']
      : downtownExtra === 'none'
        ? []
        : [downtownExtra]
  const clusters = [
    [
      ...extras.filter((slug) => slug === 'sky-views'),
      ...(aquarium ? ['dubai-aquarium'] : []),
      'dubai-mall',
      'dubai-fountain',
      ...extras.filter((slug) => slug === 'city-walk'),
    ],
    ['madinat-jumeirah', 'sunset-beach', 'dubai-marina-walk', 'jbr-beach'],
    ['miracle-garden', 'butterfly-garden', 'dubai-outlet-mall'],
    ['dubai-frame', 'al-fahidi', 'al-seef', 'creek-abra'],
    ['ja-beach'],
  ]
  if (resortFirst) [clusters[0], clusters[4]] = [clusters[4], clusters[0]]
  const titles = [
    `Dubai Mall${extras.length ? ` + ${extras.map((slug) => (slug === 'city-walk' ? 'City Walk' : 'Sky Views')).join(' + ')}` : ''} и фонтаны`,
    'Мадинат, Парус и Марина',
    'Два сада и Outlet Mall',
    'Рамка и старый Дубай',
    'День в JA Resort',
  ]
  if (resortFirst) [titles[0], titles[4]] = [titles[4], titles[0]]
  const notes = [
    `Шесть часов в молле, затем 45 минут на еду и вечерние фонтаны. ${extras.includes('city-walk') ? 'После шоу — час на основные улицы City Walk, без Green Planet и долгого ужина. ' : ''}${extras.includes('sky-views') ? 'Sky Views — утром: 45 минут на смотровую и отдельный запас на вход; горку и Edge Walk не включаем. ' : ''}${aquarium ? 'Платные туннель и экспозиции аквариума считаем дополнительно, вне шести часов молла. ' : 'Внешнюю стену аквариума смотрим бесплатно. '}На Бурдж-Халифу любуемся с набережной.`,
    'Каналы и souk Мадината, фото Паруса с Sunset Beach, затем прогулка у воды в Marina/JBR. Лодка по каналам — отдельная платная опция на месте.',
    'Miracle Garden заявляет открытие 8 октября. Сначала сады, затем покупки: не делаем отдельный дальний выезд из JA ради аутлета.',
    'Одна доступная панорама с Рамки вместо нескольких смотровых. Затем улочки Al Fahidi, набережная Al Seef и абра; точку высадки и обратный путь уточняем на пристани.',
    'Сады Palm Tree Court и павлины, пляж, бассейны и прогулка к соседним отелям сети по доступным дорожкам. Конюшня, водные активности и Animal Discovery Zone — по условиям своей брони.',
  ]
  if (resortFirst) [notes[0], notes[4]] = [notes[4], notes[0]]
  const plan = createItinerary(bundle)
  const days = plan.days.map((day, index) => {
    const places = clusters[index].map((slug) =>
      bundle.places.find((place) => place.slug === slug)!,
    )
    const settings = structuredClone(defaultRouteSettings)
    if (places.some((place) => place.slug === 'dubai-mall')) {
      settings.visits['dubai-dubai-mall'] = 360
      settings.visits['dubai-city-walk'] = 60
      settings.visits['dubai-sky-views'] = 45
      settings.breakAfter = 'dubai-dubai-mall'
    }
    // The ferry is a short outing from the same pier; return fare is counted explicitly.
    if (places.some((place) => place.slug === 'creek-abra'))
      settings.visits['dubai-creek-abra'] = 30
    const route = places.some((place) => place.slug === 'dubai-mall')
      ? evaluateRoute(places, bundle, day.date, settings)
      : optimizeDay(places, bundle, day.date, settings)
    return {
      title: titles[index],
      note: notes[index],
      day: { ...day, settings, placeIds: route.stops.map((stop) => stop.place.id) },
      route,
    }
  })
  return { plan: { ...plan, days: days.map((entry) => entry.day) }, days }
}
