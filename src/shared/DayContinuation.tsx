import { useState } from 'react'
import { Footprints, Home } from 'lucide-react'
import type { DestinationBundle } from '../domain/model'
import type { Itinerary } from '../domain/itinerary'
import { clockTime, defaultRouteSettings, evaluateRoute, hoursReminder } from '../domain/dayRoute'
import { continueDay, protectedVisit } from '../domain/dayContinuation'
import { familyRouteBudget, families, hasFamilyComposition } from '../domain/families'
import { usePreferences } from '../app/Preferences'
import { formatMoney } from './format'
import { directionsUrl } from './HotelBase'
import Photo from './Photo'
import DayCardDownload from './DayCardDownload'
import { Leg } from './DayRoutePlanner'

function ContinuationForm({
  day,
  bundle,
}: {
  day: Itinerary['days'][number]
  bundle: DestinationBundle
}) {
  const { budgetScope } = usePreferences()
  const settings = day.settings ?? defaultRouteSettings
  const places = day.placeIds.map((id) => bundle.places.find((place) => place.id === id)!)
  const planned = evaluateRoute(places, bundle, day.date, settings)
  const [afterId, setAfterId] = useState('')
  const [readyAt, setReadyAt] = useState(settings.start)
  const [mealDone, setMealDone] = useState(false)
  const [nolCardsOwned, setNolCardsOwned] = useState(settings.nolCardsOwned)
  const [optionalIds, setOptionalIds] = useState<string[]>([])
  const [result, setResult] = useState<ReturnType<typeof continueDay>>()
  const [selected, setSelected] = useState(-1)
  const remaining = places.slice(
    afterId ? places.findIndex((place) => place.id === afterId) + 1 : 0,
  )
  const invalidate = () => {
    setResult(undefined)
    setSelected(-1)
  }
  const choose = (id: string) => {
    setAfterId(id)
    const index = places.findIndex((place) => place.id === id)
    setReadyAt(
      index < 0
        ? settings.start
        : clockTime(Math.min(1439, planned.stops[index].end + planned.stops[index].pauseAfter)),
    )
    setMealDone(planned.stops.slice(0, index + 1).some((stop) => stop.pauseAfter > 0))
    setNolCardsOwned(
      settings.nolCardsOwned ||
        planned.stops.slice(0, index + 1).some((stop) => ['metro', 'tram'].includes(stop.leg.mode)),
    )
    invalidate()
  }
  const active = result && (selected < 0 ? result : result.options[selected])
  const budget =
    active &&
    familyRouteBudget(
      active.route,
      budgetScope,
      active.day.settings!,
      day.date,
      bundle.exchangeRate.baseCurrency,
    )
  return (
    <>
      <p className="fine-print">
        Выберите место, которое уже посетили, и время, когда готовы выехать оттуда. Все предыдущие
        остановки считаем завершёнными. Время местное. Расчёт продолжения не меняет основной план.
      </p>
      <div className="continuation-anchors" role="group" aria-label="Откуда продолжаем">
        <button type="button" aria-pressed={!afterId} onClick={() => choose('')}>
          <Home size={22} />
          <span>
            Ещё в отеле<small>{bundle.trip.accommodation!.name}</small>
          </span>
        </button>
        {places.map((place, index) => (
          <button
            type="button"
            key={place.id}
            aria-pressed={afterId === place.id}
            disabled={place.slug === 'creek-abra' && !settings.abraRoundTrip}
            onClick={() => choose(place.id)}
          >
            <Photo imageId={place.imageId} alt={place.nameRu} />
            <span>
              {index + 1}. {place.nameRu}
              <small>
                {place.slug === 'creek-abra' && !settings.abraRoundTrip
                  ? 'Односторонняя абра: выберите место после выхода на берег'
                  : 'Уже посетили'}
              </small>
            </span>
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setResult(
            continueDay(day, bundle, { afterId, readyAt, mealDone, nolCardsOwned, optionalIds }),
          )
          setSelected(-1)
        }}
      >
        <div className="continuation-settings">
          <label>
            Готовы продолжить в
            <input
              type="time"
              required
              aria-label="Готовы продолжить в"
              value={readyAt}
              onChange={(event) => {
                setReadyAt(event.target.value)
                invalidate()
              }}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={mealDone}
              onChange={(event) => {
                setMealDone(event.target.checked)
                invalidate()
              }}
            />
            Перерыв на еду уже был
          </label>
          <label>
            <input
              type="checkbox"
              checked={nolCardsOwned}
              onChange={(event) => {
                setNolCardsOwned(event.target.checked)
                invalidate()
              }}
            />
            Карты nol уже есть у всех
          </label>
        </div>
        {remaining.length > 0 && (
          <fieldset className="continuation-optional">
            <legend>Что можно пропустить, если не успеваем</legend>
            <p className="fine-print">
              По умолчанию сохраняем всё. Места с билетами или закреплённым временем входа
              пропускать не предлагаем.
            </p>
            {remaining.map((place) => (
              <label key={place.id}>
                <input
                  type="checkbox"
                  disabled={protectedVisit(place, day)}
                  checked={optionalIds.includes(place.id)}
                  onChange={(event) => {
                    setOptionalIds(
                      event.target.checked
                        ? [...optionalIds, place.id]
                        : optionalIds.filter((id) => id !== place.id),
                    )
                    invalidate()
                  }}
                />
                <span>
                  {place.nameRu}
                  {protectedVisit(place, day) && <small>Билет или время входа — сохраняем</small>}
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <button type="submit" className="button secondary">
          <Footprints size={18} />
          Проверить остаток дня
        </button>
      </form>
      {result && active && budget && (
        <section className="continuation-result" aria-label="Продолжение дня">
          <h3 aria-live="polite">
            {result.validTime && active.route.fits
              ? `Успеваем: в отеле около ${clockTime(active.route.returnAt)}`
              : 'Продолжение требует изменений'}
          </h3>
          {!result.validTime && (
            <p className="plan-warning">
              Готовы продолжить после времени возвращения в отель. Измените время или пересмотрите
              предел дня в основном плане.
            </p>
          )}
          {result.validTime && !active.route.fits && (
            <p className="plan-warning">
              {active.route.violations ? 'Не подходят часы работы или время входа. ' : ''}
              Возвращение ≈ {clockTime(active.route.returnAt)}; нужно сохранить ещё{' '}
              {settings.buffer} мин резерва.{' '}
              {result.options.length
                ? 'Ниже есть варианты продолжения.'
                : 'Без сокращения ваших ручных посещений и пропуска защищённых мест подходящий вариант не найден.'}
            </p>
          )}
          {result.options.length > 0 && (
            <div className="continuation-options" role="group" aria-label="Варианты продолжения">
              <button type="button" aria-pressed={selected < 0} onClick={() => setSelected(-1)}>
                Как запланировали<small>Возврат {clockTime(result.route.returnAt)}</small>
              </button>
              {result.options.map((option, index) => {
                const value = familyRouteBudget(
                  option.route,
                  budgetScope,
                  option.day.settings,
                  day.date,
                  bundle.exchangeRate.baseCurrency,
                )
                return (
                  <button
                    type="button"
                    key={option.title}
                    aria-pressed={selected === index}
                    onClick={() => setSelected(index)}
                  >
                    <strong>{option.title}</strong>
                    <span>{option.note}</span>
                    <small>
                      В отеле ≈ {clockTime(option.route.returnAt)} · дорога{' '}
                      {formatMoney(value.cost, bundle.exchangeRate, value.highCost)}
                    </small>
                  </button>
                )
              })}
            </div>
          )}
          <p>
            <strong>
              Дорога далее: {formatMoney(budget.cost, bundle.exchangeRate, budget.highCost)}
            </strong>
          </p>
          <p className="fine-print">
            {hasFamilyComposition(settings) ? families[budgetScope].label : 'Весь состав выезда'}.
            Билеты на оставшиеся места: {formatMoney(budget.ticketCost, bundle.exchangeRate)},
            включая уже купленные. Расходы до этой точки, еда и покупки сюда не входят. Дорога и
            очереди остаются оценкой.
            {active.route.unknownPrices > 0 &&
              ` Без цены: ${active.route.unknownPrices} мест; бюджет неполный.`}
          </p>
          <ol className="continuation-stops">
            {active.route.stops.map((stop) => (
              <li key={stop.place.id}>
                <Photo imageId={stop.place.imageId} alt={stop.place.nameRu} />
                <div>
                  <h4>{stop.place.nameRu}</h4>
                  <p>
                    <strong>
                      {clockTime(stop.visitStart)}–{clockTime(stop.end)}
                    </strong>{' '}
                    · {stop.visitMinutes} мин на месте
                  </p>
                  <Leg
                    leg={stop.leg}
                    departure={stop.departure}
                    arrival={stop.arrival}
                    fx={bundle.exchangeRate}
                  />
                  <p className="fine-print">Очередь: {stop.queueMinutes} мин.</p>
                  {stop.visitStart - stop.queueMinutes > stop.arrival && (
                    <p className="fine-print">
                      Ожидание открытия / входа:{' '}
                      {stop.visitStart - stop.queueMinutes - stop.arrival} мин.
                    </p>
                  )}
                  {stop.pauseAfter > 0 && (
                    <p className="fine-print">После посещения — {stop.pauseAfter} мин на еду.</p>
                  )}
                  {stop.warnings
                    .filter((warning) => warning !== hoursReminder)
                    .map((warning) => (
                      <p className="plan-warning" key={warning}>
                        {warning}
                      </p>
                    ))}
                </div>
              </li>
            ))}
          </ol>
          <p>
            <strong>
              {clockTime(active.route.returnDeparture)} → {clockTime(active.route.returnAt)} · в{' '}
              {bundle.trip.accommodation!.name}
            </strong>
          </p>
          <p className="fine-print">{active.route.returnLeg.detail}</p>
          {active.route.stops.some((stop) => stop.warnings.includes(hoursReminder)) && (
            <p className="fine-print">
              Перед продолжением сверим часы:{' '}
              {active.route.stops
                .filter((stop) => stop.warnings.includes(hoursReminder))
                .map((stop) => stop.place.nameRu)
                .join(', ')}
              . В расчёте нет подтверждённого расписания этих мест.
            </p>
          )}
          <a
            className="text-button"
            href={directionsUrl(
              active.route.returnLeg.origin,
              active.route.returnLeg.destination,
              active.route.returnLeg.mode === 'walk'
                ? 'walking'
                : ['metro', 'tram'].includes(active.route.returnLeg.mode)
                  ? 'transit'
                  : 'driving',
            )}
            target="_blank"
            rel="noreferrer"
          >
            Обратная дорога на карте ↗
          </a>
          <DayCardDownload
            day={active.day}
            bundle={bundle}
            scope={budgetScope}
            origin={result.origin}
            remaining
          />
        </section>
      )}
    </>
  )
}

export default function DayContinuation({
  day,
  bundle,
}: {
  day: Itinerary['days'][number]
  bundle: DestinationBundle
}) {
  const [open, setOpen] = useState(false)
  return (
    <details
      className="day-continuation"
      aria-label="План Б на этот день"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        Задержались или закончили раньше?
        <small>Продолжим от текущего места и проверим возвращение</small>
      </summary>
      {open && <ContinuationForm key={JSON.stringify(day)} day={day} bundle={bundle} />}
    </details>
  )
}
