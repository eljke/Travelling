import { CalendarPlus, Check, X } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { usePreferences } from '../app/Preferences'
import type { DestinationBundle, Place } from '../domain/model'
import { createItinerary, placeInDay, previewInsertion } from '../domain/itinerary'
import { formatDate } from './format'
import { closedOnDate } from '../domain/openingHours'
import { clockTime } from '../domain/dayRoute'

export default function PlanButton({ place, bundle }: { place: Place; bundle: DestinationBundle }) {
  const { plans, savePlan } = usePreferences()
  const dialog = useRef<HTMLDialogElement>(null)
  const plan = plans[bundle.destination.id] ?? createItinerary(bundle)
  const day = plan.days.find((day) => day.placeIds.includes(place.id))
  return day ? (
    <Link className="text-button plan-button" to={`/${bundle.destination.id}/plan?day=${day.date}`}>
      <Check size={15} /> В плане · {formatDate(day.date)}
    </Link>
  ) : (
    <>
      <button
        className="text-button plan-button"
        aria-label={`В план: ${place.nameRu}`}
        onClick={() => dialog.current!.showModal()}
      >
        <CalendarPlus size={15} /> В план поездки
      </button>
      <dialog
        ref={dialog}
        className="day-picker-dialog"
        aria-label={`Выбрать день: ${place.nameRu}`}
      >
        <button
          className="text-button"
          type="button"
          aria-label="Закрыть выбор дня"
          onClick={() => dialog.current!.close()}
        >
          <X size={18} />
          Закрыть
        </button>
        <h2>На какой день?</h2>
        <p>{place.nameRu}</p>
        <div>
          {plan.days.map((target, index) => {
            const closed = closedOnDate(place, target.date)
            const insertion = previewInsertion(target, place, bundle)
            const preview = insertion.route
            return (
              <button
                type="button"
                key={target.date}
                className="button secondary"
                disabled={closed}
                onClick={() => {
                  dialog.current!.close()
                  savePlan(bundle.destination.id, placeInDay(plan, place.id, target.date, bundle))
                }}
              >
                День {index + 1} · {formatDate(target.date)} ·{' '}
                {closed
                  ? 'закрыто'
                  : `${target.placeIds.length} мест · ${insertion.placement}${preview ? ` · возврат ≈ ${clockTime(preview.returnAt)}${insertion.fits ? '' : ' · тесный день'}` : ''}`}
              </button>
            )
          })}
        </div>
        <p className="fine-print">
          Подберём место в маршруте, сохранив порядок остальных остановок и время ваших билетов.
          Дорога — оценка; порядок можно изменить в плане.
        </p>
      </dialog>
    </>
  )
}
