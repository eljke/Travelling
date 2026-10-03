import { useMemo, useState } from 'react'
import { Car, Clock, Footprints, Route, TrainFront } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DestinationBundle } from '../domain/model'
import type { Itinerary } from '../domain/itinerary'
import {
  clockTime,
  defaultRouteSettings,
  evaluateRoute,
  groupTicketPrice,
  optimizeDay,
  toMinutes,
} from '../domain/dayRoute'
import type { RouteSettings, TravelLeg } from '../domain/dayRoute'
import { formatMoney } from './format'
import { directionsUrl } from './HotelBase'

function Leg({
  leg,
  departure,
  arrival,
  fx,
}: {
  leg: TravelLeg
  departure: number
  arrival: number
  fx: DestinationBundle['exchangeRate']
}) {
  return (
    <div className="route-leg">
      {leg.mode === 'walk' ? (
        <Footprints size={19} />
      ) : leg.mode === 'taxi' || leg.mode === 'tour' ? (
        <Car size={19} />
      ) : (
        <TrainFront size={19} />
      )}
      <div>
        <strong>
          {clockTime(departure)} → {clockTime(arrival)} · {leg.minutes} мин ·{' '}
          {leg.cost
            ? `≈ ${formatMoney(leg.cost, fx, leg.highCost)} на всех`
            : leg.mode === 'tour'
              ? 'входит в тур'
              : 'бесплатно'}
        </strong>
        <p>{leg.detail}</p>
        <a
          className="text-button"
          href={directionsUrl(
            leg.origin,
            leg.destination,
            leg.mode === 'walk'
              ? 'walking'
              : leg.mode === 'taxi' || leg.mode === 'tour'
                ? 'driving'
                : 'transit',
          )}
          target="_blank"
          rel="noreferrer"
        >
          Проверить этот участок на карте ↗
        </a>
      </div>
    </div>
  )
}

export default function DayRoutePlanner({
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
  const [message, setMessage] = useState('')
  const settings = day.settings ?? defaultRouteSettings
  const places = useMemo(
    () => day.placeIds.map((id) => bundle.places.find((place) => place.id === id)!),
    [day.placeIds, bundle.places],
  )
  const route = useMemo(
    () => evaluateRoute(places, bundle, day.date, settings),
    [places, bundle, day.date, settings],
  )
  const alternatives = useMemo(
    () =>
      (['fast', 'balanced', 'cheap'] as const).map((preference) => ({
        preference,
        route: evaluateRoute(places, bundle, day.date, { ...settings, preference }),
      })),
    [places, bundle, day.date, settings],
  )
  const update = (next: Partial<RouteSettings>) => {
    onChange({ ...day, settings: { ...settings, ...next } })
    setMessage('Настройки сохранены. Можно пересчитать порядок остановок.')
  }
  const validTime = toMinutes(settings.end) > toMinutes(settings.start)
  if (!bundle.trip.accommodation) return null
  return (
    <section className="day-route" aria-label="Маршрут на день">
      <div className="route-title">
        <Route size={26} />
        <div>
          <h3>От отеля — и обратно вовремя.</h3>
          <p>Выбираем транспорт на всех, близкие места посещаем за один выезд.</p>
        </div>
      </div>
      {!readOnly && (
        <div className="route-settings">
          <label>
            Выезжаем из отеля
            <input
              aria-label="Выезд из отеля"
              type="time"
              value={settings.start}
              onChange={(event) => {
                if (event.target.value) update({ start: event.target.value })
              }}
            />
          </label>
          <label>
            Вернуться в отель до
            <input
              aria-label="Вернуться в отель до"
              type="time"
              value={settings.end}
              onChange={(event) => {
                if (event.target.value) update({ end: event.target.value })
              }}
            />
          </label>
          <label>
            Взрослые
            <select
              value={settings.adults}
              onChange={(event) => update({ adults: Number(event.target.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Дети
            <select
              value={settings.children}
              onChange={(event) => update({ children: Number(event.target.value) })}
            >
              {Array.from({ length: 7 }, (_, i) => i).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Возраст ребёнка
            <select
              value={settings.childAge ?? ''}
              onChange={(event) =>
                update({
                  childAge: event.target.value === '' ? undefined : Number(event.target.value),
                })
              }
            >
              <option value="">Не указан</option>
              {Array.from({ length: 18 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n} лет
                </option>
              ))}
            </select>
          </label>
          <label>
            Такси
            <select
              value={settings.taxi}
              onChange={(event) => update({ taxi: event.target.value as RouteSettings['taxi'] })}
            >
              <option value="max">Hala Max · до 6 человек</option>
              <option value="standard">Обычное · до 4 человек</option>
            </select>
          </label>
          <label>
            Запас на возвращение
            <select
              value={settings.buffer}
              onChange={(event) => update({ buffer: Number(event.target.value) })}
            >
              {[15, 30, 45, 60].map((n) => (
                <option key={n} value={n}>
                  {n} мин
                </option>
              ))}
            </select>
          </label>
          <label>
            Перерыв на еду
            <select
              value={settings.breakMinutes}
              onChange={(event) => update({ breakMinutes: Number(event.target.value) })}
            >
              {[0, 30, 45, 60, 90].map((n) => (
                <option key={n} value={n}>
                  {n} мин
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <p className="fine-print">
        Взрослых: {settings.adults}. Детей: {settings.children}
        {settings.children > 0 && settings.childAge !== undefined
          ? ` (${settings.childAge} лет)`
          : ''}
        . Метро считаем на каждого, такси — по числу машин.
      </p>
      <div className="route-options">
        {alternatives.map(({ preference, route: variant }) => (
          <button
            className={settings.preference === preference ? 'active' : ''}
            key={preference}
            disabled={readOnly}
            aria-pressed={settings.preference === preference}
            onClick={() => update({ preference })}
          >
            <strong>
              {preference === 'fast' ? 'Быстрее' : preference === 'cheap' ? 'Дешевле' : 'Баланс'}
            </strong>
            <span>Дорога ≈ {formatMoney(variant.cost, bundle.exchangeRate, variant.highCost)}</span>
            <small>
              В отеле ≈ {clockTime(variant.returnAt)}
              {!variant.fits ? ' · не укладываемся' : ''}
            </small>
          </button>
        ))}
      </div>
      {!readOnly && (
        <button
          className="button dark-button"
          disabled={!validTime || places.length < 2}
          onClick={() => {
            const next = optimizeDay(places, bundle, day.date, settings)
            const changed = next.stops.some((stop, index) => stop.place.id !== day.placeIds[index])
            onChange({ ...day, settings, placeIds: next.stops.map((stop) => stop.place.id) })
            setMessage(
              changed
                ? 'Порядок обновлён с учётом дороги и часов работы. Все выбранные места остались.'
                : 'Текущий порядок уже подходит лучше остальных проверенных вариантов. Все места сохранены.',
            )
          }}
        >
          <Route size={18} />
          Оптимизировать день
        </button>
      )}
      {!validTime && (
        <p className="plan-warning">Время возвращения должно быть позже выезда в тот же день.</p>
      )}
      <p className="plan-status" role="status">
        {message}
      </p>
      <div className={`route-result ${route.fits && validTime ? 'fits' : 'tight'}`}>
        <Clock size={22} />
        <div>
          <strong>
            {route.fits && validTime
              ? `Укладываемся: в отеле около ${clockTime(route.returnAt)}`
              : route.violations
                ? 'Нужно изменить дату или время входа для части мест.'
                : `Нужно сократить день: возвращение около ${clockTime(route.returnAt)}`}
          </strong>
          <p>
            {route.slack >= settings.buffer
              ? `Запас до ${settings.end}: ${route.slack} мин.`
              : `Для запаса ${settings.buffer} мин нужно закончить на ${Math.max(0, settings.buffer - route.slack)} мин раньше.`}{' '}
            Если место закрыто или не подходит время входа, перестановка остановок сама по себе
            этого не исправит.
          </p>
        </div>
      </div>
      <div className="route-budget">
        <div>
          <span>Транспорт на всех</span>
          <strong>≈ {formatMoney(route.cost, bundle.exchangeRate, route.highCost)}</strong>
          <small>Дорога ≈ {route.travelMinutes} мин</small>
        </div>
        <div>
          <span>Билеты на всех</span>
          <strong>от {formatMoney(route.ticketCost, bundle.exchangeRate)}</strong>
          <small>
            {route.unknownPrices
              ? `Без цены: ${route.unknownPrices} мест`
              : 'По тарифам в карточках'}
          </small>
        </div>
        <div>
          <span>День без еды и покупок</span>
          <strong>от {formatMoney(route.cost + route.ticketCost, bundle.exchangeRate)}</strong>
          <small>Тарифы «от» и оценки дороги</small>
        </div>
      </div>
      {settings.adults === 5 && settings.children === 1 && (
        <details className="route-assumptions">
          <summary>Разделить бюджет между двумя семьями</summary>
          <p>
            Общую дорогу и групповые пакеты делим на шестерых, личные билеты считаем по составу
            каждой семьи. Еда и покупки отдельно; для мест без цены сумма неполная.
          </p>
          {[
            { title: 'Семья 1 · 4 взрослых', adults: 4, children: 0, share: 4 / 6 },
            { title: 'Семья 2 · взрослый и ребёнок 11 лет', adults: 1, children: 1, share: 2 / 6 },
          ].map((family) => {
            const tickets = places.reduce(
              (sum, place) =>
                sum +
                groupTicketPrice(
                  place,
                  place.pricing.unit === 'group'
                    ? settings
                    : { ...settings, adults: family.adults, children: family.children },
                  day.date,
                  bundle.exchangeRate.baseCurrency,
                ).amount *
                  (place.pricing.unit === 'group' ? family.share : 1),
              0,
            )
            return (
              <p key={family.title}>
                <strong>{family.title}</strong> · от{' '}
                {formatMoney(Math.ceil(tickets + route.cost * family.share), bundle.exchangeRate)};
                с верхней оценкой дороги —{' '}
                {formatMoney(
                  Math.ceil(tickets + route.highCost * family.share),
                  bundle.exchangeRate,
                )}
                .
              </p>
            )
          })}
        </details>
      )}
      {route.childEstimates > 0 && (
        <p className="fine-print">
          Для {route.childEstimates} мест детский тариф на этот возраст отдельно не подтверждён:
          пока заложена взрослая цена. Размер и возрастные ограничения проверьте перед покупкой.
        </p>
      )}
      <details className="route-timeline" open>
        <summary>
          Как пройдёт день · {settings.start} — {settings.end}
        </summary>
        <p>
          <strong>
            {settings.start} · Выезд из {bundle.trip.accommodation.name}
          </strong>
        </p>
        <ol>
          {route.stops.map((stop) => (
            <li key={stop.place.id}>
              <Leg
                leg={stop.leg}
                departure={stop.departure}
                arrival={stop.arrival}
                fx={bundle.exchangeRate}
              />
              {stop.visitStart > stop.arrival && (
                <p className="route-wait">
                  Пауза до {clockTime(stop.visitStart)}: ждём открытия или вечернего визита.
                </p>
              )}
              <div className="route-visit">
                <span>
                  {clockTime(stop.visitStart)} — {clockTime(stop.end)}
                </span>
                <Link to={`/${bundle.destination.id}/place/${stop.place.slug}`}>
                  {stop.place.nameRu} ↗
                </Link>
                <small>Примерно {stop.visitMinutes} мин на посещение</small>
                {stop.warnings.map((warning) => (
                  <p className="fine-print" key={warning}>
                    {warning}
                  </p>
                ))}
              </div>
              {stop.pauseAfter > 0 && (
                <p className="route-wait">
                  {stop.pauseAfter} мин на еду и отдых; бюджет еды отдельно.
                </p>
              )}
            </li>
          ))}
        </ol>
        <Leg
          leg={route.returnLeg}
          departure={route.returnDeparture}
          arrival={route.returnAt}
          fx={bundle.exchangeRate}
        />
        <p>
          <strong>{clockTime(route.returnAt)} · Возвращение в отель</strong>
        </p>
      </details>
      <details className="route-assumptions">
        <summary>Как считаем дорогу и деньги</summary>
        {places.some((place) => place.areaId === 'desert') && (
          <>
            <p>
              Сафари лучше оставить отдельным выездом. Пакет на шестерых включает программу, ужин и
              трансфер, но забор из JA нужно подтвердить у оператора до оплаты.
            </p>
            {places.length === 1 && !readOnly && (
              <label>
                <input
                  type="checkbox"
                  checked={settings.safariTransferConfirmed}
                  onChange={(event) => update({ safariTransferConfirmed: event.target.checked })}
                />
                Оператор подтвердил забор из JA в этом пакете
              </label>
            )}
            <p>
              {places.length === 1 && settings.safariTransferConfirmed
                ? 'Время выезда из отеля задаём по согласованному времени забора. На весь тур с дорогой и ужином отводим около шести часов; отдельное такси и обед не добавляем.'
                : 'Пока закладываем весь шестичасовой тур и отдельную дорогу с запасом. После подтверждения трансфера оставьте сафари единственной остановкой дня и включите его в расчёт.'}
            </p>
          </>
        )}
        {places.some((place) => place.slug === 'ja-beach') && (
          <>
            <p>
              Мы живём в JA Palm Tree Court: отдельный day pass на пляж и бассейны по умолчанию не
              покупаем. Это допущение для нашей брони; дополнительные активности и питание считаются
              отдельно.
            </p>
            {!readOnly && (
              <label>
                <input
                  type="checkbox"
                  checked={settings.hotelBeachIncluded}
                  onChange={(event) => update({ hotelBeachIncluded: event.target.checked })}
                />
                Пляж и бассейны JA входят в наше проживание
              </label>
            )}
            <p>
              <a
                href="https://source.jaresortshotels.com/offer-detail/summer-suites-dining"
                target="_blank"
                rel="noreferrer"
              >
                Доступ к пляжу в предложениях отеля ↗
              </a>{' '}
              · Условия своей брони сверим в подтверждении отеля.
            </p>
          </>
        )}
        <p>
          Это предварительная оценка, без пробок и живых расписаний транспорта. Дорога на такси:
          расстояние по прямой × 1,3–1,55, средняя скорость 30–55 км/ч и 10 минут на подачу/выход.
          Верхняя сумма включает запас; фактический маршрут может отличаться.
        </p>
        <p>
          База e-hail: {formatMoney(9, bundle.exchangeRate, 13)}; ориентир за км —{' '}
          {formatMoney(settings.perKm, bundle.exchangeRate)}. Hala Max до 6 пассажиров; наличие
          машины и итоговую стоимость смотрим в Careem. Ожидание, Salik и повышенный спрос могут
          увеличить цену.{' '}
          <a
            href="https://www.rta.ae/wps/portal/rta/ae/home/promotion/taxi-fare"
            target="_blank"
            rel="noreferrer"
          >
            Тарифы RTA ↗
          </a>{' '}
          ·{' '}
          <a href="https://www.careem.com/en-AE/taxi/" target="_blank" rel="noreferrer">
            Hala Max ↗
          </a>
        </p>
        <p>
          Красная линия метро: до {formatMoney(7.5, bundle.exchangeRate)} по Silver nol на человека,
          чтобы не занизить сумму по зонам; подходы к станциям и ожидание учтены. Трамвай Marina —{' '}
          {formatMoney(3, bundle.exchangeRate)}; карту nol приобретаем отдельно. При реальном
          переходе между метро и трамваем тариф может объединяться, здесь скидку не закладываем.{' '}
          <a
            href="https://www.rta.ae/wps/portal/rta/ae/public-transport/Nol-Fares"
            target="_blank"
            rel="noreferrer"
          >
            Тарифы nol ↗
          </a>
        </p>
        {!readOnly && (
          <label>
            Поправить ориентир за км, AED
            <input
              type="number"
              min="1"
              max="10"
              step="0.01"
              value={settings.perKm}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (value >= 1 && value <= 10) update({ perKm: value })
              }}
            />
          </label>
        )}
        <p>
          До семи мест перебираем все порядки; для большего списка ищем удобный порядок по близости
          и улучшаем его перестановками. Никого и никакие места автоматически не исключаем. Время
          входа по уже купленному билету можно указать в остановке ниже — расчёт его учтёт.
        </p>
      </details>
    </section>
  )
}
