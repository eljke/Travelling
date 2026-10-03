import { z } from 'zod'
import type { Coordinates, DestinationBundle, Place } from './model'
import { distanceBetween } from './geo'
import { closedOnDate } from './openingHours'

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
export const routeSettingsSchema = z.object({
  start: time.default('10:00'),
  end: time.default('22:00'),
  adults: z.number().int().min(1).max(12).default(5),
  childAge: z.number().int().min(0).max(17).optional(),
  children: z.number().int().min(0).max(6).default(1),
  preference: z.enum(['balanced', 'fast', 'cheap']).default('balanced'),
  taxi: z.enum(['max', 'standard']).default('max'),
  perKm: z.number().min(1).max(10).default(2.23),
  buffer: z.number().int().min(0).max(90).default(30),
  breakMinutes: z.number().int().min(0).max(120).default(45),
  slots: z.record(z.string(), time).default({}),
  visits: z.record(z.string(), z.number().int().min(15).max(720)).default({}),
  waits: z.record(z.string(), z.number().int().min(0).max(240)).default({}),
  ticketChecks: z
    .record(
      z.string(),
      z.object({
        adults: z.number().int().min(1).max(12),
        children: z.number().int().min(0).max(6),
        childAge: z.number().int().min(0).max(17).optional(),
        slot: time.optional(),
      }),
    )
    .default({}),
  hotelBeachIncluded: z.boolean().default(true),
  safariTransferConfirmed: z.boolean().default(false),
  nolCardsOwned: z.boolean().default(false),
  abraRoundTrip: z.boolean().default(true),
})
export type RouteSettings = z.infer<typeof routeSettingsSchema>
export const defaultRouteSettings: RouteSettings = routeSettingsSchema.parse({ childAge: 11 })
export const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
export function estimateQueue(place: Place, date: string, arrival: number) {
  if (!place.queue) return 0
  const visitDate = new Date(`${date}T12:00:00Z`)
  const month = visitDate.getUTCMonth() + 1
  const weekend = [0, 6].includes(visitDate.getUTCDay())
  const busySeason = !place.queue.seasonal || month >= 10 || month <= 4
  const peak = weekend || arrival >= place.queue.peakAfter * 60
  const minutes = peak ? place.queue.peakMinutes : place.queue.minutes
  return busySeason ? minutes : Math.ceil((minutes * 0.65) / 5) * 5
}
export const clockTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}${minutes >= 1440 ? ' +1 день' : ''}`

// Place-level access distances include station exits and indoor approaches, not just map points.
const metroAccess: Record<string, { station: number; walk: number }> = {
  'ibn-battuta-mall': { station: 0, walk: 5 },
  'dubai-marina-walk': { station: 3, walk: 25 },
  'dubai-marina-mall': { station: 3, walk: 12 },
  'mall-of-the-emirates': { station: 8, walk: 8 },
  'ski-dubai': { station: 8, walk: 10 },
  'burj-khalifa': { station: 13, walk: 25 },
  'dubai-mall': { station: 13, walk: 25 },
  'dubai-aquarium': { station: 13, walk: 30 },
  'dubai-fountain': { station: 13, walk: 30 },
  'sky-views': { station: 13, walk: 7 },
  'dubai-opera': { station: 13, walk: 18 },
  'museum-of-the-future': { station: 15, walk: 8 },
  'difc-gate-avenue': { station: 14, walk: 12 },
}
const stationNames: Record<number, string> = {
  0: 'Ibn Battuta',
  3: 'DMCC',
  8: 'Mall of the Emirates',
  13: 'Burj Khalifa / Dubai Mall',
  14: 'Financial Centre',
  15: 'Emirates Towers',
}
// Conservative estimate from JA to the metro; road geometry and traffic require live directions.
const ibnBattuta: Coordinates = { lat: 25.0441, lng: 55.1182 }
export type TravelLeg = {
  mode: 'taxi' | 'walk' | 'metro' | 'tram' | 'tour'
  minutes: number
  cost: number
  highCost: number
  detail: string
  origin: Coordinates
  destination: Coordinates
}
type StopPoint = { coordinates: Coordinates; slug?: string; areaId?: string }
function taxiLeg(a: StopPoint, b: StopPoint, settings: RouteSettings): TravelLeg {
  const straight = distanceBetween(a.coordinates, b.coordinates)
  const km = straight * (straight > 15 ? 1.3 : 1.55)
  const cars = Math.ceil((settings.adults + settings.children) / (settings.taxi === 'max' ? 6 : 4))
  const low = Math.ceil(Math.max(12, 9 + km * settings.perKm) * cars)
  return {
    mode: 'taxi',
    minutes: Math.ceil((km / (straight > 15 ? 55 : 30)) * 60 + 10),
    cost: low,
    highCost: Math.ceil(low * 1.35 + 12 * cars),
    detail: `${cars} ${settings.taxi === 'max' ? 'Hala Max (до 6 пассажиров)' : 'обычное такси (до 4 пассажиров)'}. Запас на подачу и городской участок включён.`,
    origin: a.coordinates,
    destination: b.coordinates,
  }
}
export function travelOptions(a: StopPoint, b: StopPoint, settings: RouteSettings): TravelLeg[] {
  const taxi = taxiLeg(a, b, settings)
  const options = [taxi]
  const distance = distanceBetween(a.coordinates, b.coordinates)
  // Short walks only within a connected destination area; never across the Creek or Palm water.
  if (
    a.areaId &&
    a.areaId === b.areaId &&
    [
      'downtown',
      'marina',
      'city-walk',
      'jebel-ali',
      'al-barsha',
      'gardens',
      'old-dubai',
      'deira',
      'difc',
    ].includes(a.areaId) &&
    distance < 0.9
  ) {
    options.push({
      mode: 'walk',
      minutes: Math.max(7, Math.ceil(((distance * 1.6) / 3.5) * 60)),
      cost: 0,
      highCost: 0,
      detail: 'Пешком внутри района; заложен запас на переходы и выходы. Проверьте путь на карте.',
      origin: a.coordinates,
      destination: b.coordinates,
    })
  }
  const from = a.slug ? metroAccess[a.slug] : undefined
  const to = b.slug ? metroAccess[b.slug] : undefined
  const isHotel = (point: StopPoint) =>
    !point.slug && distanceBetween(point.coordinates, { lat: 24.9873835, lng: 55.0219208 }) < 0.2
  if ((from && to && from.station !== to.station) || (isHotel(a) && to) || (from && isHotel(b))) {
    const hotelLeg = isHotel(a)
      ? taxiLeg(a, { coordinates: ibnBattuta }, settings)
      : isHotel(b)
        ? taxiLeg({ coordinates: ibnBattuta }, b, settings)
        : undefined
    const start = from?.station ?? 0
    const end = to?.station ?? 0
    const stationCount = Math.abs(start - end)
    const singleFare = start <= 8 === end <= 8 ? 3 : 5
    const fare = singleFare * (settings.adults + settings.children)
    options.push({
      mode: 'metro',
      minutes:
        (from?.walk ?? 0) +
        (to?.walk ?? 0) +
        Math.ceil(stationCount * 2.6) +
        10 +
        (hotelLeg?.minutes ?? 0),
      cost: Math.ceil(fare + (hotelLeg?.cost ?? 0)),
      highCost: Math.ceil(fare + (hotelLeg?.highCost ?? 0)),
      detail: `${hotelLeg ? `${settings.taxi === 'max' ? 'Hala Max' : 'Такси'} между отелем и Ibn Battuta + ` : ''}красная линия: ${stationNames[start]} → ${stationNames[end]}. Silver nol: ${singleFare} AED на пассажира по зонам этих станций; подходы и ожидание включены. Направление поезда сверяем на платформе.`,
      origin: a.coordinates,
      destination: b.coordinates,
    })
  }
  if (a.areaId === 'marina' && b.areaId === 'marina' && distance >= 0.9 && distance < 3) {
    options.push({
      mode: 'tram',
      minutes: Math.ceil(((distance * 1.5) / 15) * 60 + 24),
      cost: 3 * (settings.adults + settings.children),
      highCost: 3 * (settings.adults + settings.children),
      detail:
        'Трамвай в районе Marina / JBR: оценка с подходом и ожиданием, 3 AED на пассажира. Остановку и направление уточните по маршруту.',
      origin: a.coordinates,
      destination: b.coordinates,
    })
  }
  return options
}
function legScore(leg: TravelLeg, preference: RouteSettings['preference']) {
  return preference === 'fast'
    ? leg.minutes
    : preference === 'cheap'
      ? leg.cost + leg.minutes * 0.12
      : leg.minutes + leg.cost * 0.45
}
export function selectTravelOption(options: TravelLeg[], settings: RouteSettings) {
  const taxi = options.find((option) => option.mode === 'taxi')!
  const shortWalk = options.find(
    (option) =>
      option.mode === 'walk' && option.minutes <= 25 && option.minutes <= taxi.minutes + 12,
  )
  if (settings.preference === 'balanced' && shortWalk) return shortWalk
  const cardFee = settings.nolCardsOwned ? 0 : 6 * (settings.adults + settings.children)
  return options
    .filter((option) => {
      if (settings.preference !== 'balanced' || !['metro', 'tram'].includes(option.mode))
        return true
      const savings = taxi.cost - option.cost - cardFee
      return savings >= 20 && savings >= taxi.cost * 0.25 && option.minutes <= taxi.minutes + 15
    })
    .sort((a, b) => {
      const score = (leg: TravelLeg) =>
        legScore(
          { ...leg, cost: leg.cost + (['metro', 'tram'].includes(leg.mode) ? cardFee : 0) },
          settings.preference,
        )
      return score(a) - score(b)
    })[0]
}
function chooseLeg(
  a: StopPoint,
  b: StopPoint,
  settings: RouteSettings,
  departure: number,
  date: string,
  arriveBy = Infinity,
): TravelLeg {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
  const options = travelOptions(a, b, settings).filter(
    (option) =>
      ['walk', 'taxi'].includes(option.mode) ||
      (departure >=
        (option.mode === 'tram' ? (weekday === 0 ? 9 : 6) : weekday === 0 ? 8 : 5) * 60 &&
        departure + option.minutes <= 23 * 60),
  )
  const timely = options.filter((option) => departure + option.minutes <= arriveBy)
  const candidates = timely.length ? timely : options
  if (!candidates.some((option) => option.mode === 'taxi'))
    return candidates.sort(
      (a, b) => legScore(a, settings.preference) - legScore(b, settings.preference),
    )[0]
  return selectTravelOption(candidates, settings)
}
export function groupTicketPrice(
  place: Place,
  settings: RouteSettings,
  date: string,
  currency = 'AED',
) {
  if (place.slug === 'ja-beach' && settings.hotelBeachIncluded)
    return { amount: 0, unknown: false, childEstimated: false }
  if (place.pricing.kind === 'unknown' || place.pricing.currency !== currency)
    return { amount: 0, unknown: true, childEstimated: false }
  if (place.pricing.unit === 'group')
    return {
      amount:
        place.pricing.amount! *
        Math.ceil((settings.adults + settings.children) / place.pricing.groupCapacity!),
      unknown: false,
      childEstimated: false,
    }
  let adult = place.pricing.amount!
  if (place.slug === 'creek-abra' && settings.abraRoundTrip) adult *= 2
  if (place.slug === 'ja-beach' && [0, 5, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay()))
    adult = 200
  const child =
    settings.childAge === undefined
      ? undefined
      : place.pricing.childPrices?.find(
          (price) => settings.childAge! >= price.minAge && settings.childAge! <= price.maxAge,
        )
  return {
    amount: adult * settings.adults + (child?.amount ?? adult) * settings.children,
    unknown: false,
    childEstimated: settings.children > 0 && !child && adult > 0,
  }
}
export type DayRoute = ReturnType<typeof evaluateRoute>
export function evaluateRoute(
  places: Place[],
  bundle: DestinationBundle,
  date: string,
  settings: RouteSettings,
) {
  const hotel = bundle.trip.accommodation!
  const start = toMinutes(settings.start)
  const deadline = toMinutes(settings.end)
  const includedSafari =
    places.length === 1 && places[0].areaId === 'desert' && settings.safariTransferConfirmed
  const hotelPoint: StopPoint = {
    coordinates: hotel.coordinates,
    ...(distanceBetween(hotel.coordinates, { lat: 24.9873835, lng: 55.0219208 }) < 0.2
      ? { areaId: 'jebel-ali' }
      : {}),
  }
  let time = start
  let previous: StopPoint = hotelPoint
  let pause = 0
  let usedTransit = settings.nolCardsOwned
  const stops = places.map((place, index) => {
    const fixedTime = includedSafari ? undefined : settings.slots[place.id]
    const slot = fixedTime ? toMinutes(fixedTime) : undefined
    const schedule = place.openingHours.schedule
    const sessions = place.openingHours.sessions
    let queueMinutes = settings.waits[place.id] ?? estimateQueue(place, date, slot ?? time)
    let visitMinutes =
      settings.visits[place.id] ??
      (place.slug === 'creek-abra' && settings.abraRoundTrip
        ? 30
        : place.areaId === 'hatta'
          ? 180
          : Math.round((place.duration.minMinutes + place.duration.maxMinutes) / 2))
    const arriveBy = Math.min(
      slot === undefined ? Infinity : slot - queueMinutes,
      sessions ? (slot ?? toMinutes(sessions.at(-1)!)) - 30 : Infinity,
      schedule && schedule.opens < schedule.closes
        ? toMinutes(schedule.closes) - visitMinutes - queueMinutes
        : Infinity,
    )
    const leg = chooseLeg(
      previous,
      place,
      { ...settings, nolCardsOwned: usedTransit },
      time,
      date,
      arriveBy,
    )
    usedTransit ||= ['metro', 'tram'].includes(leg.mode)
    if (includedSafari) {
      Object.assign(leg, {
        mode: 'tour',
        cost: 0,
        highCost: 0,
        detail:
          'Трансфер оператора входит в пакет. Забор из JA подтверждён; время дороги — оценка.',
      })
      const back = taxiLeg(place, hotelPoint, settings)
      visitMinutes = Math.max(
        15,
        Math.round((place.duration.minMinutes + place.duration.maxMinutes) / 2) -
          leg.minutes -
          back.minutes,
      )
    }
    const departure = time
    time += leg.minutes
    const arrival = time
    const session = sessions
      ?.map(toMinutes)
      .find((minute) => minute >= time + Math.max(30, queueMinutes))
    if (session !== undefined) time = session - queueMinutes
    if (schedule && schedule.opens < schedule.closes)
      time = Math.max(time, toMinutes(schedule.opens))
    if (place.slug === 'dubai-fountain') time = Math.max(time, 18 * 60)
    const queueStart = time
    queueMinutes = settings.waits[place.id] ?? estimateQueue(place, date, queueStart)
    time += queueMinutes
    const missedSlot = slot !== undefined && time > slot
    if (slot !== undefined) time = Math.max(time, slot)
    const visitStart = time
    time += visitMinutes
    const end = time
    const warnings: string[] = []
    if (place.areaId === 'desert' && !includedSafari)
      warnings.push(
        'Сафари — отдельный тур. Забор из JA, начало и возврат согласуем с оператором; такси в расчёте пока отдельной оценкой.',
      )
    if (closedOnDate(place, date)) warnings.push('На этот день указано закрытие.')
    if (missedSlot)
      warnings.push(
        `Вход по билету в ${fixedTime} не помещается в маршрут: приезжаем позже или место ещё не открыто.`,
      )
    if (sessions && slot !== undefined && !sessions.includes(fixedTime!))
      warnings.push('Вход по билету не помещается в опубликованные сеансы. Проверьте время.')
    if (sessions && session === undefined)
      warnings.push('Посещение не помещается в опубликованные сеансы с регистрацией за 30 минут.')
    if (schedule && schedule.opens < schedule.closes && time > toMinutes(schedule.closes))
      warnings.push('Посещение не помещается в опубликованные часы работы.')
    if (!schedule && !sessions && !fixedTime)
      warnings.push('Часы и время входа нужно подтвердить; в расчёте нет закреплённого слота.')
    if (index === Math.floor((places.length - 1) / 2) && !includedSafari) {
      pause = settings.breakMinutes
      time += pause
    }
    previous = place
    return {
      place,
      leg,
      departure,
      arrival,
      visitStart,
      end,
      visitMinutes,
      queueMinutes,
      queueStart,
      pauseAfter: end === time ? 0 : pause,
      warnings,
    }
  })
  const returnLeg = places.length
    ? chooseLeg(
        previous,
        hotelPoint,
        { ...settings, nolCardsOwned: usedTransit },
        time,
        date,
        deadline - settings.buffer,
      )
    : {
        mode: 'taxi' as const,
        minutes: 0,
        cost: 0,
        highCost: 0,
        detail: '',
        origin: hotel.coordinates,
        destination: hotel.coordinates,
      }
  const returnAt = time + returnLeg.minutes
  if (includedSafari)
    Object.assign(returnLeg, {
      mode: 'tour',
      cost: 0,
      highCost: 0,
      detail: 'Возвращение в отель с оператором, включено в пакет.',
    })
  const legs = [...stops.map((stop) => stop.leg), returnLeg]
  const tickets = places.map((place) =>
    groupTicketPrice(place, settings, date, bundle.exchangeRate.baseCurrency),
  )
  const nolCardFee =
    !settings.nolCardsOwned && legs.some((leg) => ['metro', 'tram'].includes(leg.mode))
      ? 6 * (settings.adults + settings.children)
      : 0
  const cost = legs.reduce((sum, leg) => sum + leg.cost, nolCardFee)
  const highCost = legs.reduce((sum, leg) => sum + leg.highCost, nolCardFee)
  const violations = stops.filter((stop) =>
    stop.warnings.some(
      (warning) => warning.includes('закрытие') || warning.includes('не помещается'),
    ),
  ).length
  return {
    stops,
    returnLeg,
    returnDeparture: time,
    returnAt,
    cost,
    highCost,
    nolCardFee,
    ticketCost: tickets.reduce((sum, ticket) => sum + ticket.amount, 0),
    unknownPrices: tickets.filter((ticket) => ticket.unknown).length,
    childEstimates: tickets.filter((ticket) => ticket.childEstimated).length,
    travelMinutes: legs.reduce((sum, leg) => sum + leg.minutes, 0),
    walkingMinutes: legs
      .filter((leg) => leg.mode === 'walk')
      .reduce((sum, leg) => sum + leg.minutes, 0),
    slack: deadline - returnAt,
    violations,
    fits: returnAt + settings.buffer <= deadline && violations === 0,
    score:
      Math.max(0, returnAt + settings.buffer - deadline) * 1000 +
      violations * 100000 +
      (settings.preference === 'cheap'
        ? cost + (returnAt - start) * 0.12
        : returnAt - start + cost * (settings.preference === 'fast' ? 0.02 : 0.45)),
  }
}
export function optimizeDay(
  places: Place[],
  bundle: DestinationBundle,
  date: string,
  settings: RouteSettings,
): DayRoute {
  const evaluate = (order: Place[]) => evaluateRoute(order, bundle, date, settings)
  if (places.length < 2) return evaluate(places)
  let best = evaluate(places)
  // Small daily selections permit checking every order, including opening-hour waits.
  if (places.length <= 7) {
    const visit = (order: Place[], remaining: Place[]) => {
      if (!remaining.length) {
        const route = evaluate(order)
        if (route.score < best.score) best = route
        return
      }
      remaining.forEach((place, index) =>
        visit(
          [...order, place],
          remaining.filter((_, other) => other !== index),
        ),
      )
    }
    visit([], places)
  } else {
    const remaining = [...places]
    const order: Place[] = []
    let origin = bundle.trip.accommodation!.coordinates
    while (remaining.length) {
      remaining.sort(
        (a, b) => distanceBetween(origin, a.coordinates) - distanceBetween(origin, b.coordinates),
      )
      const place = remaining.shift()!
      order.push(place)
      origin = place.coordinates
    }
    const candidate = evaluate(order)
    if (candidate.score < best.score) best = candidate
    for (let pass = 0; pass < 2; pass++)
      for (let i = 0; i < best.stops.length - 1; i++)
        for (let j = i + 1; j < best.stops.length; j++) {
          const order = best.stops.map((stop) => stop.place)
          const next = evaluate([
            ...order.slice(0, i),
            ...order.slice(i, j + 1).reverse(),
            ...order.slice(j + 1),
          ])
          if (next.score < best.score) best = next
        }
  }
  return best
}
