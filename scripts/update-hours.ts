import { readFile, writeFile } from 'node:fs/promises'
import { hoursFeedSchema, hoursSources, parseOfficialHours } from '../src/domain/openingHours'
import type { HoursFeed } from '../src/domain/openingHours'
import { moscowDay } from '../src/domain/exchangeRates'

let previous: HoursFeed = { version: 1, places: [] }
try {
  previous = hoursFeedSchema.parse(JSON.parse(await readFile('public/place-hours.json', 'utf8')))
} catch {
  // First run can start without a previous snapshot.
}
const results = await Promise.allSettled(
  hoursSources.map(async (source) => {
    const response = await fetch(source.url, {
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!response.ok) throw new Error(`${source.placeId}: HTTP ${response.status}`)
    return parseOfficialHours(await response.text(), source, moscowDay())
  }),
)
const places = new Map(previous.places.map((place) => [place.placeId, place]))
for (const result of results) {
  if (result.status === 'fulfilled') {
    places.set(result.value.placeId, result.value)
    console.log(`${result.value.placeId}: ${result.value.text}`)
  } else console.warn(`Keeping last verified schedule: ${String(result.reason)}`)
}
await writeFile(
  'public/place-hours.json',
  `${JSON.stringify(hoursFeedSchema.parse({ version: 1, places: [...places.values()] }), null, 2)}\n`,
)
