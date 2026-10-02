import type { Coordinates, Place } from './model'

export function distanceBetween(a: Coordinates, b: Coordinates): number {
  const radians = (value: number) => (value * Math.PI) / 180
  const dLat = radians(b.lat - a.lat)
  const dLng = radians(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))))
}
export function sortByDistance(places: Place[], origin: Coordinates) {
  return places
    .map((place) => ({ place, distance: distanceBetween(origin, place.coordinates) }))
    .sort((a, b) => a.distance - b.distance)
}
export function getNearbyPlaces(origin: Place, places: Place[], limit = 4) {
  return sortByDistance(
    places.filter(
      (place) => place.id !== origin.id && place.destinationId === origin.destinationId,
    ),
    origin.coordinates,
  ).slice(0, limit)
}
