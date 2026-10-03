import { useState } from 'react'
import { Download } from 'lucide-react'
import type { DestinationBundle } from '../domain/model'
import type { Itinerary } from '../domain/itinerary'
import type { BudgetScope } from '../domain/families'
import { downloadFile } from './download'

export default function DayCardDownload({
  day,
  bundle,
  scope,
}: {
  day: Itinerary['days'][number]
  bundle: DestinationBundle
  scope: BudgetScope
}) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  return (
    <section className="day-download" aria-label="Карточка дня без интернета">
      <div>
        <h3>Маршрут с собой</h3>
        <p className="fine-print">
          Один HTML-файл с фото, дорогой и билетами. Открывается в браузере без интернета. После
          изменения плана скачайте новую копию; карты и сайты требуют сети.
        </p>
      </div>
      <button
        className="button secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setMessage('')
          try {
            const { createDayCard } = await import('./dayCard')
            const { blob, missingPhotos } = await createDayCard(day, bundle, scope)
            downloadFile(blob, `${bundle.destination.id}-${day.date}.html`)
            setMessage(
              missingPhotos
                ? `Карточка сохранена. Не удалось сохранить фото: ${missingPhotos}; маршрут и билеты на месте.`
                : 'Карточка сохранена с фотографиями. Откройте её из загрузок на телефоне.',
            )
          } catch {
            setMessage('Не удалось сохранить карточку. Повторите загрузку; ваш план сохранён.')
          } finally {
            setBusy(false)
          }
        }}
      >
        <Download size={18} />
        {busy ? 'Сохраняем карточку…' : 'Скачать карточку дня'}
      </button>
      <p role="status" className="fine-print">
        {message}
      </p>
    </section>
  )
}
