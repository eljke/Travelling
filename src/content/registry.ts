import rawDubai from './destinations/dubai'
import rawImages from './images.json'
import { destinationSchema, imageSchema } from '../domain/model'
import type { DestinationBundle, ImageAsset } from '../domain/model'

export const images: Record<string, ImageAsset> = Object.fromEntries(
  Object.entries(rawImages).map(([key, value]) => [key, imageSchema.parse(value)]),
)
export const destinations: Record<string, DestinationBundle> = Object.fromEntries(
  [rawDubai].map((raw) => {
    const bundle = destinationSchema.parse(raw)
    for (const imageId of [
      bundle.destination.heroImageId,
      ...bundle.places.map((place) => place.imageId),
      ...bundle.places.flatMap((place) => place.gallery.map((photo) => photo.imageId)),
    ])
      if (!images[imageId]) throw new Error(`Unknown image ${imageId}`)
    return [bundle.destination.id, bundle]
  }),
)
