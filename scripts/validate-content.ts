import { destinations, images } from '../src/content/registry.ts'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
const changelog = readFileSync('CHANGELOG.md', 'utf8')
const versions = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}\r?$/gm)].map(
  (match) => match[1],
)
assert.equal(versions[0], version, 'The current release must be the first changelog entry')
assert.equal(new Set(versions).size, versions.length, 'Duplicate changelog version')
const repository = 'https://github.com/eljke/Travelling'
assert(
  changelog.includes(`[Unreleased]: ${repository}/compare/v${version}...HEAD`),
  'Update the Unreleased comparison link',
)
for (const [index, release] of versions.entries()) {
  const target = versions[index + 1]
    ? `${repository}/compare/v${versions[index + 1]}...v${release}`
    : `${repository}/tree/v${release}`
  assert(changelog.includes(`[${release}]: ${target}`), `Missing changelog comparison: ${release}`)
}

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
