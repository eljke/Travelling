import { z } from 'zod'

export const ratesUrl = 'https://www.cbr-xml-daily.ru/daily_json.js'
export const ratesSourceUrl = 'https://www.cbr-xml-daily.ru/'
const feedSchema = z.object({
  Date: z.iso.datetime({ offset: true }),
  PreviousDate: z.iso.datetime({ offset: true }),
  Valute: z.record(
    z.string(),
    z.object({
      Nominal: z.number().positive(),
      Value: z.number().positive(),
      Previous: z.number().positive(),
    }),
  ),
})
export const ratesSchema = z.object({
  effectiveAt: z.iso.date(),
  fetchedAt: z.iso.date(),
  rates: z.record(z.string(), z.number().positive()),
})
export type DailyRates = z.infer<typeof ratesSchema>
export function moscowDay(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' }).format(date)
}
export function parseDailyRates(raw: unknown, today = moscowDay()): DailyRates {
  const feed = feedSchema.parse(raw)
  const previous = feed.Date.slice(0, 10) > today
  const effectiveAt = (previous ? feed.PreviousDate : feed.Date).slice(0, 10)
  if (effectiveAt > today || !feed.Valute.AED || !feed.Valute.USD)
    throw new Error('Invalid rate date or missing currencies')
  return {
    effectiveAt,
    fetchedAt: today,
    rates: Object.fromEntries(
      Object.entries(feed.Valute).map(([code, value]) => [
        code,
        (previous ? value.Previous : value.Value) / value.Nominal,
      ]),
    ),
  }
}
let pending: Promise<DailyRates> | undefined
export function fetchDailyRates() {
  pending ??= fetch(ratesUrl, {
    cache: 'no-cache',
    credentials: 'omit',
    signal: AbortSignal.timeout(10000),
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Rate service: ${response.status}`)
      return response.json() as Promise<unknown>
    })
    .then((data) => parseDailyRates(data))
    .finally(() => {
      pending = undefined
    })
  return pending
}
