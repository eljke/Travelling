import { CalendarPlus, Check, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePreferences } from '../app/Preferences'
import type { DestinationBundle, Place } from '../domain/model'
import { compareDays, createItinerary, placeInDay } from '../domain/itinerary'
import { formatDate, formatMoney } from './format'
import { clockTime, defaultRouteSettings } from '../domain/dayRoute'
import { familyRouteBudget, families, hasFamilyComposition } from '../domain/families'
import Photo from './Photo'

export default function PlanButton({
  place,
  bundle,
  onAdded,
  label = 'В план поездки',
}: {
  place: Place
  bundle: DestinationBundle
  onAdded?: (date: string) => void
  label?: string
}) {
  const { plans, savePlan, budgetScope } = usePreferences()
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
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
        onClick={() => {
          setOpen(true)
          dialog.current!.showModal()
        }}
      >
        <CalendarPlus size={15} /> {label}
      </button>
      <dialog
        ref={dialog}
        className="day-picker-dialog"
        aria-label={`Выбрать день: ${place.nameRu}`}
        onClose={() => setOpen(false)}
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
        <div className="day-picker-place">
          <Photo imageId={place.imageId} alt={place.nameRu} />
          <strong>{place.nameRu}</strong>
        </div>
        <p className="fine-print">
          Бюджет дня: {families[budgetScope].label}. «По пути» — помещается в день и добавляет не
          больше 30 минут дороги к уже выбранным местам.
        </p>
        <div className="day-choice-list">
          {(open ? compareDays(plan, place, bundle) : []).map(
            ({ day: target, places, closed, insertion, recommended, addedTravel }, index) => {
              const preview = insertion.route
              const settings = target.settings ?? defaultRouteSettings
              const budget = preview
                ? familyRouteBudget(
                    preview,
                    budgetScope,
                    settings,
                    target.date,
                    bundle.exchangeRate.baseCurrency,
                  )
                : undefined
              return (
                <button
                  type="button"
                  key={target.date}
                  className={`day-choice ${recommended ? 'recommended' : ''}`}
                  disabled={closed}
                  onClick={() => {
                    dialog.current!.close()
                    savePlan(bundle.destination.id, placeInDay(plan, place.id, target.date, bundle))
                    onAdded?.(target.date)
                  }}
                >
                  <span className="day-choice-heading">
                    <strong>
                      День {index + 1} · {formatDate(target.date)}
                    </strong>
                    {recommended && <span className="day-choice-badge">По пути</span>}
                  </span>
                  <span className="day-choice-places">
                    {places.length > 0 && (
                      <Photo imageId={places[0].imageId} alt={places[0].nameRu} />
                    )}
                    <span>
                      {places.length
                        ? places.map((row) => row.nameRu).join(' · ')
                        : 'Пока свободно — можно начать маршрут'}
                    </span>
                  </span>
                  <span
                    className={
                      closed || (preview && !insertion.fits) ? 'plan-warning' : 'day-choice-status'
                    }
                  >
                    {closed
                      ? 'Закрыто на эту дату'
                      : preview
                        ? `${insertion.fits ? 'Помещается' : 'Нужно скорректировать день'} · в отеле ≈ ${clockTime(preview.returnAt)}`
                        : insertion.placement}
                  </span>
                  {!closed && preview && (
                    <>
                      <small>
                        {insertion.placement} ·{' '}
                        {addedTravel! >= 0
                          ? `дорога +${addedTravel} мин`
                          : `дорога на ${-addedTravel!} мин короче`}
                      </small>
                      <small>
                        {preview.unknownPrices ? 'От ' : ''}
                        {formatMoney(
                          budget!.cost + budget!.ticketCost,
                          bundle.exchangeRate,
                          budget!.highCost + budget!.ticketCost,
                        )}{' '}
                        за весь день ·{' '}
                        {hasFamilyComposition(settings)
                          ? families[budgetScope].label
                          : `Весь выезд · ${settings.adults + settings.children} человек`}
                        {preview.unknownPrices ? ' · часть цен неизвестна' : ''}
                      </small>
                    </>
                  )}
                </button>
              )
            },
          )}
        </div>
        <p className="fine-print">
          Подберём место в маршруте, сохранив порядок остальных остановок и время ваших билетов.
          Дорога — оценка; порядок можно изменить в плане.
        </p>
      </dialog>
    </>
  )
}
