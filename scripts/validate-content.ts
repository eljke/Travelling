import { destinations, images } from '../src/content/registry.ts'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
for (const image of Object.values(images))
  for (const path of [image.src, image.small]) {
    if (!path.startsWith('https://') && !existsSync(`public/${path}`))
      throw new Error(`Missing photograph: ${path}`)
  }
for (const bundle of Object.values(destinations)) {
  const covers = new Map<string, string>()
  for (const place of bundle.places) {
    if (!place.imageId) continue
    const path = images[place.imageId].small
    const hash = path.startsWith('https://')
      ? new URL(path).origin + new URL(path).pathname
      : createHash('sha256')
          .update(readFileSync(`public/${path}`))
          .digest('hex')
    if (covers.has(hash))
      throw new Error(`Shared cover photograph: ${covers.get(hash)} and ${place.id}`)
    covers.set(hash, place.id)
  }
  console.log(
    `${bundle.destination.name}: ${bundle.places.length} places, ${bundle.areas.length} areas, ${bundle.sources.length} sources validated`,
  )
}
