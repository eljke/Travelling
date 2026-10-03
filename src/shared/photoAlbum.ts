import { z } from 'zod'

const photoMetadata = z.object({
  id: z.string().uuid(),
  destinationId: z.string().max(80),
  placeId: z.string().max(100),
  caption: z.string().max(300),
  people: z.array(z.string().min(1).max(60)).max(20),
  date: z.iso.date().or(z.literal('')),
  addedAt: z.iso.datetime(),
})
export type AlbumPhoto = z.infer<typeof photoMetadata> & { image: Blob }
const backupSchema = z.object({
  version: z.literal(1),
  photos: z
    .array(
      photoMetadata.extend({
        image: z
          .string()
          .max(8_000_000)
          .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/),
      }),
    )
    .max(200),
})

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('travelling-photos', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('photos', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
async function transaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', mode)
    const request = operation(tx.objectStore('photos'))
    tx.oncomplete = () => {
      db.close()
      resolve(request.result)
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error)
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}
export function readAlbum(): Promise<AlbumPhoto[]> {
  return transaction('readonly', (store) => store.getAll())
}
export async function savePhoto(photo: AlbumPhoto): Promise<void> {
  photoMetadata.parse(photo)
  await transaction('readwrite', (store) => store.put(photo))
}
export async function deletePhoto(id: string): Promise<void> {
  await transaction('readwrite', (store) => store.delete(id))
}

export async function preparePhoto(file: Blob): Promise<Blob> {
  if (file.size > 30_000_000) throw new Error('Снимок больше 30 МБ. Выберите уменьшенную копию.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Подойдут JPEG, PNG и WebP. Для HEIC выберите экспорт в JPEG.')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Не удалось открыть снимок. Попробуйте другой файл.')
  }
  try {
    const ratio = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio))
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
    const context = canvas.getContext('2d')!
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Не удалось сохранить снимок.'))),
        'image/jpeg',
        0.88,
      ),
    )
  } finally {
    bitmap.close()
  }
}
function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
export async function exportAlbum(photos: AlbumPhoto[]): Promise<Blob> {
  const rows = []
  for (const photo of photos) rows.push({ ...photo, image: await asDataUrl(photo.image) })
  return new Blob([JSON.stringify({ version: 1, photos: rows })], { type: 'application/json' })
}
export async function importAlbum(
  file: File,
  allowedPlaceIds: Set<string>,
  destinationId: string,
): Promise<number> {
  if (file.size > 100_000_000)
    throw new Error('Копия альбома больше 100 МБ. Разделите её на несколько частей.')
  const backup = backupSchema.parse(JSON.parse(await file.text()))
  const photos: AlbumPhoto[] = []
  for (const row of backup.photos) {
    if (row.destinationId !== destinationId || !allowedPlaceIds.has(row.placeId))
      throw new Error('В этой копии есть места из другой поездки.')
    // Decode locally; imported files never initiate network requests.
    const binary = atob(row.image.split(',')[1])
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    const image = await preparePhoto(new Blob([bytes], { type: 'image/jpeg' }))
    photos.push({ ...row, image })
  }
  const existing = new Set((await readAlbum()).map((photo) => photo.id))
  const fresh = photos.filter((photo) => !existing.has(photo.id))
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite')
    const store = tx.objectStore('photos')
    const ids = new Set<string>()
    for (const photo of fresh) {
      if (!ids.has(photo.id)) store.add(photo)
      ids.add(photo.id)
    }
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error)
    }
  })
  return new Set(fresh.map((photo) => photo.id)).size
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
