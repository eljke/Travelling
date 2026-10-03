import { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import type { Itinerary } from '../domain/itinerary'
import type { DestinationBundle } from '../domain/model'
import { exportPlan, importPlan, maxPlanBackupBytes } from '../domain/planBackup'
import { formatDate } from './format'
import { downloadFile } from './download'

export default function PlanBackup({
  bundle,
  plan,
  readOnly,
  onApply,
}: {
  bundle: DestinationBundle
  plan: Itinerary
  readOnly: boolean
  onApply: (plan: Itinerary) => void
}) {
  const [copy, setCopy] = useState<ReturnType<typeof importPlan>>()
  const [previous, setPrevious] = useState<Itinerary>()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const currentStops = plan.days.reduce((sum, day) => sum + day.placeIds.length, 0)
  return (
    <details className="plan-backup" aria-label="Копия плана">
      <summary>Сохранить или перенести план</summary>
      <p className="fine-print">
        Файл содержит места, даты, время билетов и настройки маршрутов. Его можно хранить как
        резервную копию или открыть на другом устройстве. Фотографии и избранное в него не входят.
      </p>
      <div className="plan-backup-controls">
        <button
          className="button secondary"
          onClick={() => {
            downloadFile(
              new Blob([exportPlan(plan, bundle)], { type: 'application/json' }),
              `${bundle.destination.id}-plan-${bundle.trip.startDate}.json`,
            )
            setMessage('Копия скачана. Изменения после скачивания в этот файл не попадут.')
          }}
        >
          <Download size={17} />
          Скачать файл плана
        </button>
        {!readOnly && (
          <label className="button secondary plan-backup-upload">
            <Upload size={17} />
            Загрузить копию плана
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              disabled={busy}
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                setBusy(true)
                setCopy(undefined)
                setMessage('Читаем копию…')
                try {
                  if (file.size > maxPlanBackupBytes)
                    throw new Error('Копия плана должна быть не больше 200 КБ.')
                  setCopy(importPlan(await file.text(), bundle))
                  setMessage('Копия готова к просмотру. Ваш план пока не изменён.')
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Не удалось прочитать копию.')
                } finally {
                  setBusy(false)
                }
              }}
            />
          </label>
        )}
      </div>
      <p className="plan-status" role="status" aria-live="polite">
        {message}
      </p>
      {readOnly && (
        <p className="fine-print">
          Открыта копия по ссылке. Чтобы восстановить другой файл, сначала перейдите в свой план.
        </p>
      )}
      {copy && (
        <section className="plan-backup-preview" aria-label="Просмотр копии плана">
          <h3>Что восстановим</h3>
          <p className="fine-print">
            Создано{' '}
            {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(
              new Date(copy.createdAt),
            )}
          </p>
          <p>
            В текущем плане: {currentStops} мест. В копии:{' '}
            {copy.plan.days.reduce((sum, day) => sum + day.placeIds.length, 0)}.
          </p>
          <ul>
            {copy.plan.days.map((day) => (
              <li key={day.date}>
                <strong>{formatDate(day.date)}</strong> ·{' '}
                {day.placeIds.length
                  ? day.placeIds
                      .map((id) => bundle.places.find((place) => place.id === id)!.nameRu)
                      .join(' · ')
                  : 'Места не выбраны'}
                {day.settings && (
                  <small>
                    Выезд {day.settings.start} · вернуться до {day.settings.end}
                  </small>
                )}
              </li>
            ))}
          </ul>
          {copy.skippedStops > 0 && (
            <p className="plan-warning">
              Не перенесено остановок: {copy.skippedStops}. Это повторы, места вне текущих дат или
              отсутствующие в каталоге.
            </p>
          )}
          <p className="fine-print">
            Заменятся все остановки и настройки дней. Фотографии и избранное сохранятся. После
            замены можно отменить восстановление, пока эта страница открыта.
          </p>
          <div className="plan-actions">
            <button
              className="button dark-button"
              onClick={() => {
                setPrevious(structuredClone(plan))
                onApply(copy.plan)
                setCopy(undefined)
                setMessage('План восстановлен из файла.')
              }}
            >
              {copy.plan.days.some((day) => day.placeIds.length)
                ? 'Заменить план этой копией'
                : 'Заменить план пустой копией'}
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setCopy(undefined)
                setMessage('Загрузка отменена. Ваш план не изменён.')
              }}
            >
              Отмена
            </button>
          </div>
        </section>
      )}
      {previous && !readOnly && (
        <button
          className="button secondary"
          onClick={() => {
            onApply(previous)
            setPrevious(undefined)
            setCopy(undefined)
            setMessage('Возвращён план до восстановления из файла.')
          }}
        >
          Отменить восстановление
        </button>
      )}
    </details>
  )
}
