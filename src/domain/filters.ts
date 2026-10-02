import type { DestinationBundle, Place } from './model'

export interface Filters {
  q: string
  area: string
  category: string
  price: string
  duration: string
  tag: string
  favorites: boolean
  sort: string
}
export const defaultFilters: Filters = {
  q: '',
  area: '',
  category: '',
  price: '',
  duration: '',
  tag: '',
  favorites: false,
  sort: 'editorial',
}
export function parseFilters(params: URLSearchParams): Filters {
  const value = { ...defaultFilters }
  for (const key of ['q', 'area', 'category', 'price', 'duration', 'tag', 'sort'] as const)
    value[key] = params.get(key) ?? value[key]
  value.favorites = params.get('favorites') === '1'
  if (!['editorial', 'price', 'nearby'].includes(value.sort)) value.sort = 'editorial'
  if (!['', 'free', 'under-100', '100-250', '250-plus'].includes(value.price)) value.price = ''
  if (!['', 'under-1', '1-2', '2-4', 'half-day'].includes(value.duration)) value.duration = ''
  return value
}
export function serializeFilters(filters: Filters): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters))
    if (value && value !== defaultFilters[key as keyof Filters])
      params.set(key, value === true ? '1' : String(value))
  return params
}
export function filterPlaces(
  bundle: DestinationBundle,
  filters: Filters,
  favorites: readonly string[],
): Place[] {
  const query = filters.q.trim().toLocaleLowerCase('ru')
  const [low, high] = bundle.destination.priceThresholds
  return bundle.places.filter((place) => {
    const area = bundle.areas.find((a) => a.id === place.areaId)!
    const text = [
      place.name,
      place.nameRu,
      place.description,
      place.shortDescription,
      area.name,
      area.nameRu,
      ...place.tags,
    ]
      .join(' ')
      .toLocaleLowerCase('ru')
    if (query && !text.includes(query)) return false
    if (filters.area && place.areaId !== filters.area) return false
    if (
      filters.category &&
      !place.categories.includes(filters.category as Place['categories'][number])
    )
      return false
    if (filters.favorites && !favorites.includes(place.id)) return false
    if (
      filters.tag === 'russian-card' &&
      !place.ticketProviders.some((p) => p.russianCardSupport.status === 'confirmed')
    )
      return false
    if (filters.tag === 'booking' && !place.bookingRecommended) return false
    if (
      filters.tag &&
      !['russian-card', 'booking'].includes(filters.tag) &&
      !place.tags.includes(filters.tag)
    )
      return false
    const amount = place.pricing.amount
    if (
      filters.price &&
      (amount === undefined ||
        (filters.price === 'free' && place.pricing.kind !== 'free') ||
        (filters.price === 'under-100' && !(amount > 0 && amount < low)) ||
        (filters.price === '100-250' && !(amount >= low && amount < high)) ||
        (filters.price === '250-plus' && amount < high))
    )
      return false
    const minutes = place.duration.maxMinutes
    if (
      (filters.duration === 'under-1' && minutes >= 60) ||
      (filters.duration === '1-2' && !(minutes >= 60 && minutes <= 120)) ||
      (filters.duration === '2-4' && !(minutes > 120 && minutes <= 240)) ||
      (filters.duration === 'half-day' && minutes <= 240)
    )
      return false
    return true
  })
}
