import type { Coordinates, DestinationBundle, PriceInfo } from '../domain/model'

export function convertCurrency(amount: number, rate: number): number {
  const converted = amount * rate
  const step = converted < 100 ? 1 : converted < 1000 ? 10 : 50
  return Math.round(converted / step) * step
}
export function formatCurrency(amount: number, currency = 'AED') {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'RUB' ? 0 : 2,
  }).format(amount)
}
export function formatPrice(price: PriceInfo) {
  return price.kind === 'free'
    ? 'Бесплатно'
    : price.amount === undefined
      ? 'Цена уточняется'
      : `${price.kind === 'from' ? 'от ' : ''}${formatCurrency(price.amount, price.currency)}${price.unit === 'group' ? ' за группу' : ''}`
}
export function formatRub(price: PriceInfo, fx: DestinationBundle['exchangeRate']) {
  return price.amount === undefined || price.amount === 0 || price.currency !== fx.baseCurrency
    ? ''
    : `≈ ${formatCurrency(convertCurrency(price.amount, fx.rate), fx.quoteCurrency)}`
}
export function formatMoney(amount: number, fx: DestinationBundle['exchangeRate'], high?: number) {
  const range = high !== undefined && high !== amount
  const local = `${formatCurrency(amount, fx.baseCurrency)}${range ? `–${formatCurrency(high, fx.baseCurrency)}` : ''}`
  const rub = `${formatCurrency(convertCurrency(amount, fx.rate), fx.quoteCurrency)}${range ? `–${formatCurrency(convertCurrency(high, fx.rate), fx.quoteCurrency)}` : ''}`
  return `${local} (≈ ${rub})`
}
export function formatDistance(km: number) {
  return km < 1
    ? `${Math.round((km * 1000) / 10) * 10} м`
    : `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(km)} км`
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}
export function formatTrip(trip: DestinationBundle['trip']) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatRange(new Date(`${trip.startDate}T12:00:00Z`), new Date(`${trip.endDate}T12:00:00Z`))
}
export function formatDuration(duration: { minMinutes: number; maxMinutes: number }) {
  const { minMinutes: min, maxMinutes: max } = duration
  const number = (v: number) =>
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(v)
  if (min === max) return max < 60 ? `${min} мин` : `${number(max / 60)} ч`
  return max < 60 ? `${min}–${max} мин` : `${number(min / 60)}–${number(max / 60)} ч`
}
export function formatCoordinates(point: Coordinates) {
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
}
export function assetUrl(path: string) {
  if (path.startsWith('https://')) return path
  return `${import.meta.env.BASE_URL}${path}`
}
