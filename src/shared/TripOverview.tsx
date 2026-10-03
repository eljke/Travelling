import { useMemo } from 'react'
import { ArrowRight, Car, Clock, Ticket } from 'lucide-react'
import type { DestinationBundle } from '../domain/model'
import type { Itinerary } from '../domain/itinerary'
import { summarizeTrip } from '../domain/itinerary'
import { clockTime } from '../domain/dayRoute'
import { families } from '../domain/families'
import type { BudgetScope } from '../domain/families'
import { formatDate, formatMoney } from './format'
import Photo from './Photo'
import RateStrip from './RateStrip'

function duration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours ? `${hours} ч${rest ? ` ${rest} мин` : ''}` : `${rest} мин`
}

export default function TripOverview({
  bundle,
  plan,
  scope,
  activeDate,
  onSelect,
}: {
  bundle: DestinationBundle
  plan: Itinerary
  scope: BudgetScope
  activeDate: string
  onSelect: (date: string) => void
}) {
  const summary = useMemo(() => summarizeTrip(plan, bundle, scope), [plan, bundle, scope])
  const total = summary.ticketCost + summary.transportCost
  const high = summary.ticketCost + summary.transportHighCost
  const prefix = summary.lowerBound ? 'от ' : ''
  return (
    <section className="trip-overview" aria-label="Обзор поездки">
      <div className="trip-overview-heading">
        <div>
          <span className="eyebrow">БИЛЕТЫ И ДОРОГА · {families[scope].label}</span>
          <h2>Сколько стоит наш план.</h2>
        </div>
        <strong className="trip-total" aria-label="Бюджет поездки">
          {prefix}
          {formatMoney(total, bundle.exchangeRate, high)}
        </strong>
      </div>
      <div className="trip-overview-metrics">
        <p>
          <Ticket size={18} />
          <span>
            Билеты
            <strong>
              {prefix}
              {formatMoney(summary.ticketCost, bundle.exchangeRate)}
            </strong>
          </span>
        </p>
        <p>
          <Car size={18} />
          <span>
            Доля дороги
            <strong>
              {formatMoney(summary.transportCost, bundle.exchangeRate, summary.transportHighCost)}
            </strong>
          </span>
        </p>
        <p>
          <Clock size={18} />
          <span>
            В дороге за поездку<strong>{duration(summary.travelMinutes)}</strong>
          </span>
        </p>
        <p>
          <Clock size={18} />
          <span>
            Запас на очереди<strong>{duration(summary.queueMinutes)}</strong>
          </span>
        </p>
      </div>
      <p className="fine-print">
        Оценка для выбранных мест, без еды, покупок и дополнительных услуг. Дорога включает
        возвращение в отель; реальные пробки и наличие билетов проверим перед выездом.
        {summary.unknownPrices > 0 &&
          ` Без подтверждённой цены: ${summary.unknownPrices} мест — они не включены в сумму.`}
        {summary.days.some((day) => day.differentParty) &&
          ' В дни с другим составом участников показаны расходы всего выезда, без деления на семьи.'}
      </p>
      <RateStrip bundle={bundle} />
      {summary.days.filter((day) => day.route.nolCardFee > 0).length > 1 && (
        <p className="fine-print">
          Выпуск карт nol пока заложен в нескольких днях. После первой покупки отметьте «Карты nol
          уже есть» в настройках следующих выездов — стоимость выпуска не нужно платить повторно.
        </p>
      )}
      <details className="trip-overview-days">
        <summary>
          Все дни: фотографии, время и расходы
          <span>
            {plan.days.reduce((sum, day) => sum + day.placeIds.length, 0)} мест ·{' '}
            {summary.plannedDays} из {plan.days.length} дней запланировано
            {summary.needsChanges > 0 ? ` · требуют правки: ${summary.needsChanges}` : ''}
          </span>
        </summary>
        <div className="trip-time-legend" aria-hidden="true">
          <span className="visits">На месте</span>
          <span className="travel">Дорога</span>
          <span className="waiting">Очереди и ожидание</span>
          <span className="breaks">Отдых</span>
        </div>
        <div className="trip-overview-grid">
          {summary.days.map(
            (
              { day, route, budget, settings, minutes, needsChanges, differentParty, lowerBound },
              index,
            ) => (
              <article
                className={`trip-day-card ${day.date === activeDate ? 'active' : ''}`}
                key={day.date}
              >
                {route.stops.length > 0 && (
                  <Photo imageId={route.stops[0].place.imageId} alt={route.stops[0].place.nameRu} />
                )}
                <div className="trip-day-body">
                  <span className="eyebrow">
                    День {index + 1} · {formatDate(day.date)}
                  </span>
                  <h3>
                    {route.stops.length
                      ? route.stops.map((stop) => stop.place.nameRu).join(' · ')
                      : 'День пока свободен'}
                  </h3>
                  {route.stops.length > 0 ? (
                    <>
                      <p className={`trip-day-status ${needsChanges ? 'tight' : ''}`}>
                        {needsChanges ? 'Нужно поправить маршрут' : 'По времени укладываемся'}
                      </p>
                      <p>
                        {settings.start} → в отеле ≈ {clockTime(route.returnAt)}
                        <br />
                        <small>
                          Вернуться до {settings.end} · резерв {settings.buffer} мин
                        </small>
                      </p>
                      <div
                        className="trip-time-bar"
                        role="img"
                        aria-label={`На месте ${duration(minutes.visits)}, дорога ${duration(minutes.travel)}, очереди ${duration(minutes.queues)}, ожидание ${duration(minutes.waiting)}, отдых ${duration(minutes.breaks)}`}
                      >
                        {[
                          ['visits', minutes.visits],
                          ['travel', minutes.travel],
                          ['waiting', minutes.queues + minutes.waiting],
                          ['breaks', minutes.breaks],
                        ].map(
                          ([key, value]) =>
                            Number(value) > 0 && (
                              <span
                                key={key}
                                className={String(key)}
                                style={{ flexGrow: Number(value) }}
                              />
                            ),
                        )}
                      </div>
                      <p className="fine-print">
                        Дорога {duration(minutes.travel)} · очереди {duration(minutes.queues)}
                        {minutes.waiting > 0 && ` · ожидание ${duration(minutes.waiting)}`}
                      </p>
                      <strong className="trip-day-cost">
                        {lowerBound ? 'от ' : ''}
                        {formatMoney(
                          budget.cost + budget.ticketCost,
                          bundle.exchangeRate,
                          budget.highCost + budget.ticketCost,
                        )}
                      </strong>
                      {differentParty && (
                        <small>
                          Весь выезд: {settings.adults} взр. + {settings.children} дет.
                        </small>
                      )}
                      {route.unknownPrices > 0 && (
                        <small className="plan-warning">Без цены: {route.unknownPrices} мест</small>
                      )}
                      {route.stops.some((stop) => stop.warnings.length > 0) && (
                        <small>Есть часы или условия, которые нужно проверить в маршруте.</small>
                      )}
                    </>
                  ) : (
                    <p className="fine-print">Можно оставить для отеля или выбрать места.</p>
                  )}
                  <button
                    className="button secondary"
                    aria-label={`Открыть маршрут на ${formatDate(day.date)}`}
                    aria-current={day.date === activeDate ? 'date' : undefined}
                    onClick={() => onSelect(day.date)}
                  >
                    {needsChanges
                      ? 'Исправить день'
                      : day.placeIds.length
                        ? 'Открыть день'
                        : 'Выбрать места'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            ),
          )}
        </div>
      </details>
    </section>
  )
}
