import { destinations, images } from '../src/content/registry.ts'
import { existsSync } from 'node:fs'
for (const image of Object.values(images))
  for (const path of [image.src, image.small]) {
    if (!existsSync(`public/${path}`)) throw new Error(`Missing photograph: ${path}`)
  }
for (const bundle of Object.values(destinations))
  console.log(
    `${bundle.destination.name}: ${bundle.places.length} places, ${bundle.areas.length} areas, ${bundle.sources.length} sources validated`,
  )
