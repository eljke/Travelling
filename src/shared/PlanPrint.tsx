import type { DestinationBundle } from '../domain/model'
import type { Itinerary } from '../domain/itinerary'
import { clockTime, defaultRouteSettings, evaluateRoute } from '../domain/dayRoute'
import { families, familyRouteBudget } from '../domain/families'
import type { BudgetScope } from '../domain/families'
import { formatDate, formatMoney, formatTrip } from './format'
import { directionsUrl } from './HotelBase'

export default function PlanPrint({
  bundle,
  plan,
  scope,
}: {
  bundle: DestinationBundle
  plan: Itinerary
  scope: BudgetScope
}) {
  const days = plan.days.filter((day) => day.placeIds.length)
  const empty = plan.days.filter((day) => !day.placeIds.length)
  const modes = {
    taxi: 'Такси',
    walk: 'Пешком',
    metro: 'Метро',
    tram: 'Трамвай',
    tour: 'Трансфер тура',
  }
  return (
    <article className="print-plan" aria-label="Дорожный лист для печати">
      {!days.length && (
        <section className="print-day">
          <h1>План поездки · {bundle.destination.nameRu}</h1>
          <p>{formatTrip(bundle.trip)} · Места ещё не выбраны.</p>
        </section>
      )}
      {days.map((day, index) => {
        const settings = day.settings ?? defaultRouteSettings
        const places = day.placeIds.map((id) => bundle.places.find((place) => place.id === id)!)
        const route = evaluateRoute(places, bundle, day.date, settings)
        const budget = familyRouteBudget(
          route,
          scope,
          settings,
          day.date,
          bundle.exchangeRate.baseCurrency,
        )
        return (
          <section className="print-day" key={day.date}>
            <header>
              <span>
                {bundle.destination.nameRu} · {formatTrip(bundle.trip)}
              </span>
              <h1>{formatDate(day.date)}</h1>
              <p>
                {bundle.trip.accommodation!.name} · выезд {settings.start} · вернуться до{' '}
                {settings.end}
              </p>
            </header>
            <div className="print-budget">
              <strong>{families[scope].label}</strong>
              <p>
                Билеты: {formatMoney(budget.ticketCost, bundle.exchangeRate)} · дорога:{' '}
                {formatMoney(budget.cost, bundle.exchangeRate, budget.highCost)}
              </p>
              <p>
                <strong>
                  День:{' '}
                  {formatMoney(
                    budget.cost + budget.ticketCost,
                    bundle.exchangeRate,
                    budget.highCost + budget.ticketCost,
                  )}
                </strong>{' '}
                · без еды и покупок
              </p>
            </div>
            {!route.fits && (
              <p className="print-warning">
                День требует изменения: проверьте часы, вход по билету и время возвращения.
              </p>
            )}
            <table>
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Место и дорога</th>
                </tr>
              </thead>
              <tbody>
                {route.stops.map((stop, stopIndex) => (
                  <tr key={stop.place.id}>
                    <td>
                      <strong>
                        {clockTime(stop.visitStart)}–{clockTime(stop.end)}
                      </strong>
                      <br />
                      {stop.visitMinutes} мин на месте
                    </td>
                    <td>
                      <h2>
                        {stopIndex + 1}. {stop.place.nameRu}
                      </h2>
                      <p>
                        {clockTime(stop.departure)}–{clockTime(stop.arrival)} ·{' '}
                        {stop.leg.mode === 'taxi'
                          ? settings.taxi === 'max'
                            ? 'Hala Max'
                            : 'Такси'
                          : modes[stop.leg.mode]}{' '}
                        · {stop.leg.minutes} мин · {formatMoney(stop.leg.cost, bundle.exchangeRate)}{' '}
                        на всех
                      </p>
                      {['metro', 'tram'].includes(stop.leg.mode) && <p>{stop.leg.detail}</p>}
                      {stop.queueMinutes > 0 && (
                        <p>Очередь / подготовка: {stop.queueMinutes} мин, до посещения.</p>
                      )}
                      {stop.visitStart - stop.queueMinutes > stop.arrival && (
                        <p>
                          Ожидание открытия / входа:{' '}
                          {stop.visitStart - stop.queueMinutes - stop.arrival} мин.
                        </p>
                      )}
                      {settings.slots[stop.place.id] && (
                        <p>
                          <strong>Билет: вход в {settings.slots[stop.place.id]}</strong>
                        </p>
                      )}
                      <p>
                        <a
                          href={directionsUrl(
                            stop.leg.origin,
                            stop.leg.destination,
                            stop.leg.mode === 'walk'
                              ? 'walking'
                              : ['metro', 'tram'].includes(stop.leg.mode)
                                ? 'transit'
                                : 'driving',
                          )}
                        >
                          Маршрут на карте
                        </a>{' '}
                        · <a href={stop.place.officialWebsite}>Сайт места</a> ·{' '}
                        {stop.place.coordinates.lat.toFixed(5)},{' '}
                        {stop.place.coordinates.lng.toFixed(5)}
                      </p>
                      {stop.warnings
                        .filter(
                          (warning) => !warning.startsWith('Часы и время входа нужно подтвердить'),
                        )
                        .map((warning) => (
                          <p className="print-warning" key={warning}>
                            {warning}
                          </p>
                        ))}
                      {stop.pauseAfter > 0 && (
                        <p>После посещения: {stop.pauseAfter} мин на еду и отдых.</p>
                      )}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <strong>
                      {clockTime(route.returnDeparture)}–{clockTime(route.returnAt)}
                    </strong>
                  </td>
                  <td>
                    <h2>Возвращение в {bundle.trip.accommodation!.name}</h2>
                    <p>
                      {modes[route.returnLeg.mode]} · {route.returnLeg.minutes} мин ·{' '}
                      {formatMoney(route.returnLeg.cost, bundle.exchangeRate)} на всех
                    </p>
                    <a
                      href={directionsUrl(
                        route.returnLeg.origin,
                        route.returnLeg.destination,
                        ['metro', 'tram'].includes(route.returnLeg.mode)
                          ? 'transit'
                          : route.returnLeg.mode === 'walk'
                            ? 'walking'
                            : 'driving',
                      )}
                    >
                      Обратная дорога на карте
                    </a>
                    <p>
                      Запас до {settings.end}: {route.slack} мин. Из них резерв — {settings.buffer}{' '}
                      мин.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            {route.stops.some((stop) => ['metro', 'tram'].includes(stop.leg.mode)) ||
            ['metro', 'tram'].includes(route.returnLeg.mode) ? (
              <p className="print-note">
                Метро / трамвай: каждому нужна своя nol, включая ребёнка. Silver{' '}
                {formatMoney(25, bundle.exchangeRate)} с балансом{' '}
                {formatMoney(19, bundle.exchangeRate)}; минимум на карте{' '}
                {formatMoney(7.5, bundle.exchangeRate)}. Прикладываем при входе и выходе, у трамвая
                — на платформе. Выпуск новых карт учтён в дороге.
              </p>
            ) : null}
            <p className="print-note">
              Время местное, {bundle.destination.timezone}. Дорога и очереди — оценка, без живых
              пробок. Часы и билеты сверяем перед выездом.{' '}
              {route.unknownPrices > 0
                ? `Без цены: ${route.unknownPrices} мест; итог неполный. `
                : ''}
              Курс: 1 AED ≈ {bundle.exchangeRate.rate.toFixed(2)} ₽ на{' '}
              {formatDate(bundle.exchangeRate.effectiveAt)}.
            </p>
            {index === 0 && empty.length > 0 && (
              <p className="print-note">
                Пока без остановок: {empty.map((day) => formatDate(day.date)).join('; ')}.
              </p>
            )}
          </section>
        )
      })}
    </article>
  )
}
