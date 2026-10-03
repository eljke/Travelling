import { z } from 'zod'
import { scheduleSchema } from './openingHours'

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/)
const date = z.iso.date()
const url = z.url().refine((value) => value.startsWith('https://'), 'Use an HTTPS source')
const references = z.array(id).min(1)
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})
export const categories = [
  'attraction',
  'viewpoint',
  'architecture',
  'museum',
  'beach',
  'waterpark',
  'theme-park',
  'desert',
  'old-city',
  'walk',
  'experience',
  'nature',
  'food-view',
  'hidden-gem',
] as const
export const sourceSchema = z.object({
  id,
  type: z.enum(['official', 'ticket-provider', 'review', 'map', 'other']),
  title: z.string().min(1),
  url,
  accessedAt: date,
  note: z.string().optional(),
})
export const paymentSchema = z.object({
  status: z.enum(['confirmed', 'likely', 'unavailable', 'unknown']),
  note: z.string().min(1),
  scope: z.enum(['online', 'deposit', 'russian-visa-mastercard', 'unspecified']),
  checkedAt: date,
  sourceIds: references,
})
const variantSchema = z.object({
  label: z.string(),
  type: z.enum(['adult', 'child', 'standard', 'premium', 'combination']),
  amount: z.number().nonnegative(),
  sourceIds: references,
})
export const priceSchema = z
  .object({
    kind: z.enum(['free', 'from', 'fixed', 'unknown']),
    amount: z.number().nonnegative().optional(),
    currency: z.string().length(3),
    note: z.string(),
    variants: z.array(variantSchema).default([]),
    checkedAt: date,
    sourceIds: references,
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'free' && value.amount !== 0)
      ctx.addIssue({ code: 'custom', message: 'Free prices must be zero' })
    if (
      ['fixed', 'from'].includes(value.kind) &&
      !(typeof value.amount === 'number' && value.amount > 0)
    )
      ctx.addIssue({ code: 'custom', message: 'Paid prices require a positive amount' })
    if (value.kind === 'unknown' && value.amount !== undefined)
      ctx.addIssue({ code: 'custom', message: 'Unknown prices cannot contain an amount' })
  })
export const imageSchema = z.object({
  src: z.string().regex(/^images\/[a-z0-9-]+\.webp$/),
  small: z.string().regex(/^images\/[a-z0-9-]+\.webp$/),
  alt: z.string(),
  author: z.string(),
  license: z.string(),
  licenseUrl: url,
  sourceUrl: url,
  checkedAt: date,
  adaptation: z.string(),
})
export const placeSchema = z.object({
  id,
  slug: id,
  destinationId: id,
  areaId: id,
  name: z.string().min(1),
  nameRu: z.string().min(1),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  coordinates: coordinatesSchema,
  coordinateNote: z.string(),
  categories: z.array(z.enum(categories)).min(1),
  tags: z.array(z.string()),
  imageId: id,
  gallery: z.array(z.object({ imageId: id, caption: z.string().min(1) })).default([]),
  imageNote: z.string().optional(),
  duration: z
    .object({
      minMinutes: z.number().positive(),
      maxMinutes: z.number().positive(),
      note: z.string(),
    })
    .refine((v) => v.maxMinutes >= v.minMinutes),
  openingHours: z.object({
    text: z.string(),
    checkedAt: date,
    sourceIds: references,
    schedule: scheduleSchema.optional(),
    closedWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
  }),
  availability: z.object({
    status: z.enum(['open', 'temporarily-closed', 'check-dates']),
    note: z.string(),
    checkedAt: date,
    sourceIds: references,
  }),
  pricing: priceSchema,
  ticketProviders: z.array(
    z.object({
      providerId: id,
      url,
      linkType: z.enum(['direct', 'catalog']),
      price: priceSchema.optional(),
      russianCardSupport: paymentSchema,
      checkedAt: date,
    }),
  ),
  reviewInsights: z
    .object({
      positives: z.array(z.string()),
      negatives: z.array(z.string()),
      tips: z.array(z.string()),
      consensus: z.string(),
      sampleNote: z.string(),
      sourceIds: references,
      checkedAt: date,
    })
    .optional(),
  officialWebsite: url,
  bookingRecommended: z.boolean(),
  bestTime: z.array(z.string()),
  transport: z.object({ text: z.string(), sourceIds: references }),
  sourceIds: references,
  updatedAt: date,
})
export const destinationSchema = z
  .object({
    country: z.object({ id, name: z.string(), nameRu: z.string(), isoCode: z.string().length(2) }),
    destination: z.object({
      id,
      countryId: id,
      name: z.string(),
      nameRu: z.string(),
      tagline: z.string(),
      description: z.string(),
      center: coordinatesSchema,
      heroImageId: id,
      timezone: z.string(),
      priceThresholds: z
        .tuple([z.number().positive(), z.number().positive()])
        .default([100, 250])
        .refine(([low, high]) => high > low),
      climate: z.object({ text: z.string(), sourceIds: references, checkedAt: date }),
      featuredAreaId: id,
      featuredAreaComparisons: z.array(id),
    }),
    trip: z
      .object({
        destinationId: id,
        startDate: date,
        endDate: date,
        arrivalDate: date.optional(),
        departureDate: date.optional(),
        accommodation: z
          .object({
            name: z.string().min(1),
            address: z.string(),
            coordinates: coordinatesSchema,
            website: url,
            sourceIds: references,
            checkedAt: date,
          })
          .optional(),
      })
      .refine(
        (v) =>
          v.endDate >= v.startDate &&
          (!v.arrivalDate || v.arrivalDate <= v.startDate) &&
          (!v.departureDate || v.departureDate >= v.endDate),
      ),
    exchangeRate: z.object({
      baseCurrency: z.string().length(3),
      quoteCurrency: z.string().length(3),
      rate: z.number().positive(),
      usdRub: z.number().positive().optional(),
      effectiveAt: date,
      checkedAt: date,
      sourceIds: references,
    }),
    areas: z
      .array(
        z.object({
          id,
          destinationId: id,
          name: z.string(),
          nameRu: z.string(),
          description: z.string(),
          center: coordinatesSchema,
        }),
      )
      .min(1),
    providers: z.array(
      z.object({ id, name: z.string(), website: url, russianCardSupport: paymentSchema }),
    ),
    paymentRestrictions: z
      .array(z.object({ title: z.string(), support: paymentSchema }))
      .default([]),
    sources: z.array(sourceSchema).min(1),
    places: z.array(placeSchema).min(1),
  })
  .superRefine((bundle, ctx) => {
    const report = (message: string) => ctx.addIssue({ code: 'custom', message })
    for (const [name, rows] of Object.entries({
      areas: bundle.areas,
      providers: bundle.providers,
      sources: bundle.sources,
      places: bundle.places,
    })) {
      if (new Set(rows.map((r) => r.id)).size !== rows.length) report(`Duplicate ${name} id`)
    }
    if (new Set(bundle.places.map((p) => p.slug)).size !== bundle.places.length)
      report('Duplicate place slug')
    if (
      bundle.destination.countryId !== bundle.country.id ||
      bundle.trip.destinationId !== bundle.destination.id
    )
      report('Invalid country or trip reference')
    if (!bundle.areas.some((a) => a.id === bundle.destination.featuredAreaId))
      report('Invalid featured area')
    for (const areaId of bundle.destination.featuredAreaComparisons)
      if (!bundle.areas.some((a) => a.id === areaId)) report(`Invalid comparison area ${areaId}`)
    const sources = new Set(bundle.sources.map((s) => s.id))
    const visit = (value: unknown): void => {
      if (Array.isArray(value)) value.forEach(visit)
      else if (typeof value === 'object' && value !== null)
        for (const [key, child] of Object.entries(value)) {
          if (key === 'sourceIds')
            for (const sourceId of child as string[]) {
              if (!sources.has(sourceId)) report(`Missing source ${sourceId}`)
            }
          else visit(child)
        }
    }
    visit(bundle)
    for (const area of bundle.areas)
      if (area.destinationId !== bundle.destination.id) report(`Invalid destination for ${area.id}`)
    for (const place of bundle.places) {
      if (
        place.destinationId !== bundle.destination.id ||
        !bundle.areas.some((a) => a.id === place.areaId)
      )
        report(`Invalid place geography: ${place.id}`)
      for (const offer of place.ticketProviders)
        if (!bundle.providers.some((p) => p.id === offer.providerId))
          report(`Unknown provider ${offer.providerId}`)
    }
  })
export type Place = z.infer<typeof placeSchema>
export type DestinationBundle = z.infer<typeof destinationSchema>
export type Coordinates = z.infer<typeof coordinatesSchema>
export type PriceInfo = z.infer<typeof priceSchema>
export type ImageAsset = z.infer<typeof imageSchema>
export type PaymentSupport = z.infer<typeof paymentSchema>
export type SourceReference = z.infer<typeof sourceSchema>
