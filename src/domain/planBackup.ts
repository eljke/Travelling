import { z } from 'zod'
import { itinerarySchema, normalizeItinerary } from './itinerary'
import type { Itinerary } from './itinerary'
import type { DestinationBundle } from './model'

export const maxPlanBackupBytes = 200_000
const backupSchema = z.object({
  format: z.literal('trip-plan'),
  version: z.literal(1),
  destinationId: z.string(),
  createdAt: z.iso.datetime(),
  plan: itinerarySchema,
})

export function exportPlan(plan: Itinerary, bundle: DestinationBundle) {
  return JSON.stringify(
    {
      format: 'trip-plan',
      version: 1,
      destinationId: bundle.destination.id,
      createdAt: new Date().toISOString(),
      plan,
    },
    null,
    2,
  )
}

export function importPlan(text: string, bundle: DestinationBundle) {
  if (new TextEncoder().encode(text).length > maxPlanBackupBytes)
    throw new Error('Копия плана должна быть не больше 200 КБ.')
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Не удалось прочитать файл. Нужна копия плана в формате JSON.')
  }
  const result = backupSchema.safeParse(data)
  if (!result.success)
    throw new Error('Это не копия плана поддерживаемого формата. Скачайте её в разделе «План».')
  const backup = result.data
  if (backup.destinationId !== bundle.destination.id)
    throw new Error('Эта копия относится к другому направлению.')
  const plan = normalizeItinerary(backup.plan, bundle)
  const before = backup.plan.days.reduce((sum, day) => sum + day.placeIds.length, 0)
  const after = plan.days.reduce((sum, day) => sum + day.placeIds.length, 0)
  if (before > 0 && after === 0)
    throw new Error(
      'В этой копии нет мест, подходящих к нашим датам и текущему каталогу. Ваш план не изменён.',
    )
  return { plan, createdAt: backup.createdAt, skippedStops: before - after }
}
