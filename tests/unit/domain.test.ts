import { describe, expect, it } from 'vitest'
import { destinations } from '../../src/content/registry'
import {
  convertCurrency,
  formatPrice,
  formatRub,
  formatMoney,
  formatDistance,
  formatTrip,
} from '../../src/shared/format'
import { distanceBetween, getNearbyPlaces, sortByDistance } from '../../src/domain/geo'
import {
  defaultFilters,
  filterPlaces,
  parseFilters,
  serializeFilters,
} from '../../src/domain/filters'
import { destinationSchema, priceSchema, placeSchema } from '../../src/domain/model'
import { parseDailyRates } from '../../src/domain/exchangeRates'

describe('daily rates', () => {
  const feed = {
    Date: '2026-10-03T11:30:00+03:00',
    PreviousDate: '2026-10-02T11:30:00+03:00',
    Valute: {
      AED: { Nominal: 10, Value: 250, Previous: 240 },
      USD: { Nominal: 1, Value: 90, Previous: 88 },
    },
  }
  it('uses the effective day and normalizes nominal units', () => {
    const today = parseDailyRates(feed, '2026-10-02')
    expect(today.effectiveAt).toBe('2026-10-02')
    expect(today.rates).toEqual({ AED: 24, USD: 88 })
    expect(parseDailyRates(feed, '2026-10-03').rates.AED).toBe(25)
    expect(parseDailyRates(feed, '2026-10-04').effectiveAt).toBe('2026-10-03')
  })
  it('rejects missing currencies, negative rates and future data', () => {
    expect(() =>
      parseDailyRates({ ...feed, Valute: { USD: feed.Valute.USD } }, '2026-10-02'),
    ).toThrow()
    expect(() =>
      parseDailyRates(
        { ...feed, Valute: { ...feed.Valute, AED: { Nominal: 0, Value: 25, Previous: 24 } } },
        '2026-10-02',
      ),
    ).toThrow()
    expect(() => parseDailyRates(feed, '2026-10-01')).toThrow()
  })
})

const dubai = destinations.dubai
describe('money', () => {
  it('shows estimates beside amounts and both ends of a range', () => {
    const fx = { ...dubai.exchangeRate, rate: 25 }
    expect(formatMoney(100, fx)).toContain('2 500')
    expect(formatMoney(100, fx, 200)).toContain('5 000')
    expect(formatMoney(0, fx)).toContain('0 ₽')
  })
  it('rounds RUB to a readable estimate', () => {
    expect(convertCurrency(149, 22.6672)).toBe(3400)
    expect(convertCurrency(0, 22.6672)).toBe(0)
    expect(convertCurrency(1, 22.6672)).toBe(23)
  })
  it('keeps free and unknown distinct', () => {
    const free = dubai.places.find((p) => p.pricing.kind === 'free')!.pricing
    const unknown = dubai.places.find((p) => p.pricing.kind === 'unknown')!.pricing
    expect(formatPrice(free)).toBe('Бесплатно')
    expect(formatPrice(unknown)).toBe('Цена уточняется')
    expect(formatRub(unknown, dubai.exchangeRate)).toBe('')
  })
  it('does not convert a different currency using AED rate', () => {
    expect(formatRub({ ...dubai.places[0].pricing, currency: 'USD' }, dubai.exchangeRate)).toBe('')
  })
})
describe('geography', () => {
  it('measures known distances and handles the date line', () => {
    expect(distanceBetween({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111.195, 2)
    expect(distanceBetween({ lat: 0, lng: 179 }, { lat: 0, lng: -179 })).toBeCloseTo(222.39, 2)
    expect(distanceBetween({ lat: 90, lng: 0 }, { lat: -90, lng: 0 })).toBeCloseTo(20015.087, 2)
    expect(distanceBetween(dubai.places[0].coordinates, dubai.places[0].coordinates)).toBe(0)
  })
  it('finds genuinely nearby places without including the origin', () => {
    const burj = dubai.places.find((p) => p.slug === 'burj-khalifa')!
    const idsBefore = dubai.places.map((p) => p.id)
    const nearby = getNearbyPlaces(burj, dubai.places, 4)
    expect(nearby).toHaveLength(4)
    expect(nearby.some((v) => v.place.id === burj.id)).toBe(false)
    expect(nearby.every((v) => v.distance < 1)).toBe(true)
    expect(nearby.map((v) => v.distance)).toEqual(
      [...nearby.map((v) => v.distance)].sort((a, b) => a - b),
    )
    expect(dubai.places.map((p) => p.id)).toEqual(idsBefore)
  })
  it('sorts from JA and excludes other destinations from nearby', () => {
    const ja = dubai.places.find((p) => p.slug === 'ja-beach')!
    expect(sortByDistance(dubai.places, ja.coordinates)[0].place.id).toBe(ja.id)
    expect(
      getNearbyPlaces(ja, [
        ...dubai.places,
        { ...ja, id: 'foreign-place', destinationId: 'tokyo' },
      ]).some((v) => v.place.destinationId !== 'dubai'),
    ).toBe(false)
    expect(formatDistance(0.42)).toBe('420 м')
  })
})
describe('catalog', () => {
  it('combines area, category, budget and favorite filters', () => {
    const marina = dubai.places.find((p) => p.slug === 'jbr-beach')!
    const result = filterPlaces(
      dubai,
      { ...defaultFilters, area: 'marina', category: 'beach', price: 'free', favorites: true },
      [marina.id],
    )
    expect(result.map((p) => p.id)).toEqual([marina.id])
  })
  it('searches English names, Russian descriptions and area names', () => {
    expect(
      filterPlaces(dubai, { ...defaultFilters, q: '  BURJ KHALIFA ' }, []).some(
        (p) => p.slug === 'burj-khalifa',
      ),
    ).toBe(true)
    expect(filterPlaces(dubai, { ...defaultFilters, q: 'Джебель-Али' }, []).length).toBe(7)
    expect(
      filterPlaces(dubai, { ...defaultFilters, q: 'террасы' }, []).some(
        (p) => p.slug === 'madinat-jumeirah',
      ),
    ).toBe(true)
  })
  it('does not treat unknown prices as free or guaranteed payment', () => {
    for (const p of filterPlaces(dubai, { ...defaultFilters, price: 'free' }, []))
      expect(p.pricing.kind).toBe('free')
    for (const p of filterPlaces(dubai, { ...defaultFilters, tag: 'russian-card' }, []))
      expect(p.ticketProviders.some((v) => v.russianCardSupport.status === 'confirmed')).toBe(true)
  })
  it('handles duration boundaries', () => {
    expect(
      filterPlaces(dubai, { ...defaultFilters, duration: 'under-1' }, []).every(
        (p) => p.duration.maxMinutes < 60,
      ),
    ).toBe(true)
    expect(
      filterPlaces(dubai, { ...defaultFilters, duration: 'half-day' }, []).every(
        (p) => p.duration.maxMinutes > 240,
      ),
    ).toBe(true)
  })
})
describe('URL', () => {
  it('roundtrips shareable Unicode filters', () => {
    const value = {
      ...defaultFilters,
      q: 'море & кофе',
      area: 'marina',
      category: 'beach',
      favorites: true,
      price: 'free',
      sort: 'price',
    }
    expect(parseFilters(serializeFilters(value))).toEqual(value)
    expect(serializeFilters(defaultFilters).toString()).toBe('')
  })
  it('normalizes invalid enum values', () => {
    expect(parseFilters(new URLSearchParams('price=banana&duration=nan&sort=bad')).price).toBe('')
    expect(parseFilters(new URLSearchParams('sort=bad')).sort).toBe('editorial')
  })
})
describe('content integrity', () => {
  it('validates real content and evidence references', () => {
    expect(dubai.places.length).toBeGreaterThanOrEqual(30)
    expect(destinationSchema.safeParse(dubai).success).toBe(true)
    const copy = structuredClone(dubai)
    copy.places[0].pricing.sourceIds = ['missing-source']
    expect(destinationSchema.safeParse(copy).success).toBe(false)
  })
  it('rejects incomplete places and contradictory prices', () => {
    expect(placeSchema.safeParse({ ...dubai.places[0], name: '' }).success).toBe(false)
    expect(
      placeSchema.safeParse({ ...dubai.places[0], coordinates: { lat: 100, lng: 55 } }).success,
    ).toBe(false)
    expect(
      priceSchema.safeParse({ ...dubai.places[0].pricing, kind: 'unknown', amount: 50 }).success,
    ).toBe(false)
    expect(
      priceSchema.safeParse({ ...dubai.places[0].pricing, kind: 'fixed', amount: undefined })
        .success,
    ).toBe(false)
  })
  it('rejects duplicate IDs, missing providers and invalid dates', () => {
    const copy = structuredClone(dubai)
    copy.places.push(copy.places[0])
    expect(destinationSchema.safeParse(copy).success).toBe(false)
    copy.places.pop()
    copy.places[0].ticketProviders[0].providerId = 'missing'
    expect(destinationSchema.safeParse(copy).success).toBe(false)
    expect(
      destinationSchema.safeParse({ ...dubai, trip: { ...dubai.trip, endDate: '2026-10-01' } })
        .success,
    ).toBe(false)
    expect(formatTrip(dubai.trip)).toContain('2026')
  })
  it('accepts another country and city without UI changes', () => {
    const copy = structuredClone(dubai)
    copy.country = { id: 'japan', name: 'Japan', nameRu: 'Япония', isoCode: 'JP' }
    copy.destination = {
      ...copy.destination,
      id: 'tokyo',
      countryId: 'japan',
      name: 'Tokyo',
      nameRu: 'Токио',
      timezone: 'Asia/Tokyo',
    }
    copy.trip.destinationId = 'tokyo'
    copy.areas.forEach((a) => {
      a.destinationId = 'tokyo'
    })
    copy.places.forEach((p) => {
      p.destinationId = 'tokyo'
    })
    expect(destinationSchema.safeParse(copy).success).toBe(true)
  })
})
