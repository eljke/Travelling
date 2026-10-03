import { z } from 'zod'
import type { Place } from './model'

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
export const scheduleSchema = z.object({
  opens: time,
  closes: time,
  closedWeekdays: z.array(z.number().int().min(0).max(6)).default([]),
})
export const hoursFeedSchema = z.object({
  version: z.literal(1),
  places: z
    .array(
      z.object({
        placeId: z.string(),
        text: z.string().min(1).max(800),
        checkedAt: z.iso.date(),
        sourceUrl: z.url().refine((url) => url.startsWith('https://')),
        schedule: scheduleSchema.optional(),
        sessions: z.array(time).min(1).optional(),
        closedWeekdays: z.array(z.number().int().min(0).max(6)).default([]),
      }),
    )
    .max(200),
})
export type HoursFeed = z.infer<typeof hoursFeedSchema>

export const hoursSources = [
  {
    placeId: 'dubai-the-view-at-the-palm',
    url: 'https://www.theviewpalm.ae/en',
    pattern: 'Open Daily:',
  },
  {
    placeId: 'dubai-dubai-frame',
    url: 'https://www.dubaiframe.ae/en/plan-your-visit',
    pattern: 'Opening hours from',
  },
  {
    placeId: 'dubai-ain-dubai',
    url: 'https://www.aindubai.com/en/plan-your-visit',
    pattern: 'Everyday:',
  },
  {
    placeId: 'dubai-green-planet',
    url: 'https://www.thegreenplanetdubai.com/en/parks-opening-hours',
    pattern: 'opens everyday from',
  },
  {
    placeId: 'dubai-jumeirah-mosque',
    url: 'https://www.jumeirahmosque.ae/mosque-visit-public/',
    pattern: 'Guided Visit Timings',
  },
] as const

export function parseOfficialHours(
  html: string,
  source: (typeof hoursSources)[number],
  checkedAt: string,
): HoursFeed['places'][number] {
  const text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&ndash;|&mdash;/g, '–')
    .replace(/\s+/g, ' ')
  const start = text.toLowerCase().indexOf(source.pattern.toLowerCase())
  if (start === -1) throw new Error(`Hours not found: ${source.placeId}`)
  const section = text.slice(start, start + 260)
  const times = [...section.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/gi)]
  const convert = (match: RegExpMatchArray) => {
    const hour = Number(match[1])
    const minute = Number(match[2] ?? 0)
    if (hour < 1 || hour > 12 || minute > 59) throw new Error('Invalid opening time')
    return `${String((hour % 12) + (match[3].toLowerCase() === 'pm' ? 12 : 0)).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  if (times.length < 2) throw new Error(`Incomplete hours: ${source.placeId}`)
  const first = convert(times[0])
  const second = convert(times[1])
  const base = { placeId: source.placeId, checkedAt, sourceUrl: source.url }
  if (source.placeId === 'dubai-jumeirah-mosque') {
    if (!/Saturday to Thursday/i.test(section) || !/Closed on Fridays/i.test(section))
      throw new Error('Mosque opening days changed')
    return {
      ...base,
      text: `Публичные визиты: суббота–четверг, сеансы в ${first} и ${second}. Регистрация за 30 минут; в пятницу закрыто.`,
      closedWeekdays: [5],
      sessions: [first, second],
    }
  }
  const schedule = scheduleSchema.parse({ opens: first, closes: second })
  if (first === second) throw new Error('Ambiguous opening hours')
  return {
    ...base,
    text: `Ежедневно ${first}–${second} по времени Дубая. В праздники и особые даты расписание может меняться.`,
    schedule,
    closedWeekdays: [],
  }
}

export function closedOnDate(place: Place, date: string): boolean {
  return (
    Boolean(place.availability.opensOn && date < place.availability.opensOn) ||
    place.availability.status === 'temporarily-closed' ||
    (place.openingHours.closedWeekdays ?? []).includes(new Date(`${date}T12:00:00Z`).getUTCDay())
  )
}

export function openBySchedule(place: Place, timezone: string, now = new Date()): boolean {
  const schedule = place.openingHours.schedule
  if (!schedule || place.availability.status === 'temporarily-closed') return false
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)!.value
  const date = `${part('year')}-${part('month')}-${part('day')}`
  const age =
    (new Date(`${date}T12:00:00Z`).getTime() -
      new Date(`${place.openingHours.checkedAt}T12:00:00Z`).getTime()) /
    86400000
  if (age < 0 || age > 7 || closedOnDate(place, date)) return false
  const time = `${part('hour')}:${part('minute')}`
  return schedule.opens < schedule.closes
    ? time >= schedule.opens && time < schedule.closes
    : time >= schedule.opens || time < schedule.closes
}
