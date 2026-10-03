import type { DestinationBundle } from './model'
import { createItinerary } from './itinerary'
import { defaultRouteSettings, optimizeDay } from './dayRoute'

export function tripProposal(bundle: DestinationBundle, resortFirst = false, aquarium = false) {
  const clusters = [
    ['dubai-mall', ...(aquarium ? ['dubai-aquarium'] : []), 'dubai-fountain'],
    ['madinat-jumeirah', 'sunset-beach', 'dubai-marina-walk', 'jbr-beach'],
    ['miracle-garden', 'butterfly-garden', 'dubai-outlet-mall'],
    ['dubai-frame', 'al-fahidi', 'al-seef', 'creek-abra'],
    ['ja-beach'],
  ]
  if (resortFirst) [clusters[0], clusters[4]] = [clusters[4], clusters[0]]
  const titles = [
    'Dubai Mall и вечерние фонтаны',
    'Мадинат, Парус и Марина',
    'Два сада и Outlet Mall',
    'Рамка и старый Дубай',
    'День в JA Resort',
  ]
  if (resortFirst) [titles[0], titles[4]] = [titles[4], titles[0]]
  const notes = [
    'Внешнюю стену аквариума в молле можно посмотреть без билета. На Бурдж-Халифу любуемся с набережной; подъём оставляем по желанию.',
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
    // The ferry is a short outing from the same pier; return fare is counted explicitly.
    if (places.some((place) => place.slug === 'creek-abra'))
      settings.visits['dubai-creek-abra'] = 30
    const route = optimizeDay(places, bundle, day.date, settings)
    return {
      title: titles[index],
      note: notes[index],
      day: { ...day, settings, placeIds: route.stops.map((stop) => stop.place.id) },
      route,
    }
  })
  return { plan: { ...plan, days: days.map((entry) => entry.day) }, days }
}
