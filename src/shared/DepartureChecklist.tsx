import { Link } from 'react-router-dom'
import type { DestinationBundle } from '../domain/model'
import type { Itinerary } from '../domain/itinerary'
import { defaultRouteSettings, evaluateRoute, toMinutes } from '../domain/dayRoute'
import {
  familyTicketPrice,
  hasFamilyComposition,
  needsTicket,
  ticketChecks,
} from '../domain/families'
import { usePreferences } from '../app/Preferences'
import { formatDate, formatMoney } from './format'
import Photo from './Photo'

export default function DepartureChecklist({
  day,
  bundle,
  readOnly,
  onChange,
}: {
  day: Itinerary['days'][number]
  bundle: DestinationBundle
  readOnly: boolean
  onChange: (day: Itinerary['days'][number]) => void
}) {
  const { budgetScope } = usePreferences()
  const settings = day.settings ?? defaultRouteSettings
  const places = day.placeIds.map((id) => bundle.places.find((place) => place.id === id)!)
  const paid = places.filter((place) => needsTicket(place, settings, day.date))
  const checks = paid.flatMap((place) => ticketChecks(place.id, budgetScope, settings))
  const marked = checks.filter((check) => check.checked).length
  const route = evaluateRoute(places, bundle, day.date, settings)
  const fits = route.fits && toMinutes(settings.end) > toMinutes(settings.start)
  return (
    <details className="departure-checklist" aria-label="Подготовка к выезду">
      <summary>
        <span>Перед выездом</span>
        <small>
          {!fits ? 'Маршрут требует правки · ' : ''}
          {checks.length
            ? `Билеты отмечены: ${marked} из ${checks.length}`
            : 'Входные билеты не требуются'}
        </small>
      </summary>
      <p className="fine-print">
        {formatDate(day.date)} · Отметьте билеты после покупки. Время входа само по себе не
        означает, что билет куплен. Сохраните QR-коды продавца на телефон для доступа без интернета.
      </p>
      {!hasFamilyComposition(settings) && (
        <p className="plan-warning">
          На этот день задан другой состав: отметки относятся ко всем участникам выезда.
        </p>
      )}
      {!fits && (
        <p className="plan-warning">
          Сначала скорректируйте маршрут выше: часы работы, время входа и возвращение в отель.
        </p>
      )}
      <div className="departure-tickets">
        {paid.map((place) => {
          const price = familyTicketPrice(
            place,
            budgetScope,
            settings,
            day.date,
            bundle.exchangeRate.baseCurrency,
          )
          return (
            <article className="departure-ticket" key={place.id}>
              <Photo imageId={place.imageId} alt={place.nameRu} />
              <div>
                <h3>{place.nameRu}</h3>
                <p className="fine-print">
                  {price.unknown
                    ? 'Стоимость нужно уточнить у продавца'
                    : `${place.pricing.kind === 'from' ? 'От ' : '≈ '}${formatMoney(price.amount, bundle.exchangeRate)} для выбранного состава`}
                  {settings.slots[place.id] && ` · вход в ${settings.slots[place.id]}`}
                </p>
                <div className="departure-checks">
                  {ticketChecks(place.id, budgetScope, settings).map((check) => (
                    <label key={check.key}>
                      <input
                        type="checkbox"
                        checked={check.checked}
                        disabled={readOnly}
                        aria-label={`Билеты куплены: ${place.nameRu} · ${check.label}`}
                        onChange={(event) => {
                          const next = { ...settings.ticketChecks }
                          if (event.target.checked) next[check.key] = check.expected
                          else delete next[check.key]
                          onChange({ ...day, settings: { ...settings, ticketChecks: next } })
                        }}
                      />
                      <span>
                        {check.label}
                        <small>
                          {check.checked
                            ? 'Билеты куплены'
                            : check.changed
                              ? 'Изменились состав или время входа — проверьте билеты'
                              : 'Покупку ещё не отметили'}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <Link
                  className="text-button"
                  to={`/${bundle.destination.id}/place/${place.slug}#purchase`}
                >
                  Сравнить билеты и условия ↗
                </Link>
              </div>
            </article>
          )
        })}
      </div>
      <p className="fine-print">
        Перед выездом сверяем часы на сайте места, время в ваучере и точку посадки. Отметки хранятся
        вместе с этим днём и входят в копию плана.{' '}
        {readOnly && 'Это снимок плана: сохраните копию, чтобы менять отметки.'}
      </p>
    </details>
  )
}
