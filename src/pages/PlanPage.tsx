import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Map,
  Plus,
  Printer,
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useDestinationBundle } from '../app/ExchangeRates'
import { usePreferences } from '../app/Preferences'
import {
  createItinerary,
  fillFromFavorites,
  itinerarySchema,
  normalizeItinerary,
  placeInDay,
  summarizeDay,
} from '../domain/itinerary'
import type { Itinerary } from '../domain/itinerary'
import { distanceBetween } from '../domain/geo'
import { closedOnDate } from '../domain/openingHours'
import HotelBase, { directionsUrl } from '../shared/HotelBase'
import {
  formatMoney,
  formatRub,
  formatDate,
  formatDistance,
  formatDuration,
  formatPrice,
  formatTrip,
} from '../shared/format'
import Photo from '../shared/Photo'
import PlacePicker from '../shared/PlacePicker'
import RateStrip from '../shared/RateStrip'
import LazyMap from '../features/map/LazyMap'
import DayRoutePlanner from '../shared/DayRoutePlanner'
import { defaultRouteSettings, evaluateRoute } from '../domain/dayRoute'
import { familyTicketPrice, families } from '../domain/families'
import FamilyBudgetControl from '../shared/FamilyBudgetControl'
import TripProposal from '../shared/TripProposal'
import PlanPrint from '../shared/PlanPrint'
import TripOverview from '../shared/TripOverview'
import PlanBackup from '../shared/PlanBackup'
import '../styles/print.css'
import { dubaiDayIdeas } from '../content/dayIdeas'

export default function PlanPage() {
  const { destinationId = '' } = useParams()
  const bundle = useDestinationBundle(destinationId)
  const { plans, savePlan, favorites, budgetScope } = usePreferences()
  const [params, setParams] = useSearchParams()
  const [dailyMinutes, setDailyMinutes] = useState(720)
  const [message, setMessage] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [selectedId, setSelectedId] = useState<string>()
  const [dayToOpen, setDayToOpen] = useState('')
  useEffect(() => {
    if (!dayToOpen || params.get('day') !== dayToOpen) return
    const frame = requestAnimationFrame(() => {
      const section = document.getElementById(`plan-day-${dayToOpen}`)!
      section.focus({ preventScroll: true })
      section.scrollIntoView({ block: 'start' })
      setDayToOpen('')
    })
    return () => cancelAnimationFrame(frame)
  }, [dayToOpen, params])
  if (!bundle)
    return (
      <main className="container empty" id="main">
        <h1>Направление не найдено</h1>
        <Link to="/">Все путешествия</Link>
      </main>
    )

  const encoded = params.get('plan')
  let shared: Itinerary | undefined
  if (encoded !== null) {
    try {
      if (encoded.length > 30000) throw new Error('Plan is too large')
      shared = normalizeItinerary(itinerarySchema.parse(JSON.parse(encoded)), bundle)
    } catch {
      return (
        <main className="container empty" id="main">
          <h1>Не удалось открыть план</h1>
          <p>Ссылка повреждена или использует неподдерживаемый формат.</p>
          <Link className="button secondary" to={`/${destinationId}/plan`}>
            Открыть мой план
          </Link>
        </main>
      )
    }
  }
  const plan = shared ?? plans[destinationId] ?? createItinerary(bundle)
  const activeDay = plan.days.find((day) => day.date === params.get('day')) ?? plan.days[0]
  const placeById = new globalThis.Map(bundle.places.map((place) => [place.id, place]))
  const scheduled = new Set(plan.days.flatMap((day) => day.placeIds))
  const allPlaces = [...scheduled].map((id) => placeById.get(id)!)
  const total = summarizeDay(allPlaces, bundle.exchangeRate.baseCurrency)
  total.amount = plan.days.reduce(
    (sum, day) =>
      sum +
      day.placeIds.reduce(
        (amount, id) =>
          amount +
          familyTicketPrice(
            placeById.get(id)!,
            budgetScope,
            day.settings ?? defaultRouteSettings,
            day.date,
            bundle.exchangeRate.baseCurrency,
          ).amount,
        0,
      ),
    0,
  )
  const pending = bundle.places.filter(
    (place) => favorites.includes(place.id) && !scheduled.has(place.id),
  )
  const update = (next: Itinerary) => {
    savePlan(destinationId, next)
    setMessage('План обновлён.')
    setShareUrl('')
  }
  const reorder = (date: string, index: number, direction: number) => {
    update({
      ...plan,
      days: plan.days.map((day) => {
        if (day.date !== date) return day
        const placeIds = [...day.placeIds]
        ;[placeIds[index], placeIds[index + direction]] = [
          placeIds[index + direction],
          placeIds[index],
        ]
        return { ...day, placeIds }
      }),
    })
  }
  const autoFill = () => {
    const next = fillFromFavorites(plan, bundle, favorites, dailyMinutes)
    update(next)
    const added = next.days.flatMap((day) => day.placeIds).length - scheduled.size
    setMessage(
      added
        ? `Добавлено мест: ${added}. Ваши прежние остановки сохранены. Проверьте часы работы и оставьте время на дорогу.`
        : 'Ничего не добавлено: выберите места в избранном или увеличьте время на посещения. Закрытые места пропускаются.',
    )
  }
  const share = async () => {
    const url = new URL(window.location.href)
    url.hash = `/${destinationId}/plan?${new URLSearchParams({ plan: JSON.stringify(plan), day: activeDay.date })}`
    setShareUrl(url.href)
    try {
      await navigator.clipboard.writeText(url.href)
      setMessage(
        'Ссылка скопирована. Она содержит текущую копию плана; последующие изменения в неё не попадут.',
      )
    } catch {
      setMessage('Скопируйте ссылку из поля ниже. Она содержит текущую копию плана.')
    }
  }
  const budget = (summary: ReturnType<typeof summarizeDay>) => {
    const prefix = summary.lowerBound || summary.unknownPrices ? 'от ' : ''
    return `${prefix}${formatMoney(summary.amount, bundle.exchangeRate)}`
  }
  return (
    <main className="plan-page container" id="main">
      <PlanPrint bundle={bundle} plan={plan} scope={budgetScope} />
      <Link className="text-button" to={`/${destinationId}`}>
        ← К местам
      </Link>
      <div className="plan-heading">
        <div>
          <span className="eyebrow">ВАШ ГОРОД. ВАШ МАРШРУТ.</span>
          <h1>План поездки.</h1>
          <p>
            {bundle.destination.nameRu} · {formatTrip(bundle.trip)}
          </p>
        </div>
        <div className="plan-actions">
          <button className="button secondary" onClick={() => void share()}>
            <Share2 size={17} />
            Поделиться
          </button>
          <button className="button secondary" onClick={() => window.print()}>
            <Printer size={17} />
            Печать / PDF
          </button>
        </div>
      </div>
      <FamilyBudgetControl />
      <p className="fine-print">
        Бюджеты ниже: {families[budgetScope].label}. Число пассажиров в настройках маршрута
        описывает весь выезд.
      </p>
      {shared && (
        <div className="plan-notice">
          <div>
            <strong>Копия плана по ссылке</strong>
            <p>
              Ваш личный план сохранён отдельно. Чтобы редактировать эту копию, сохраните её себе.
            </p>
          </div>
          <button
            className="button dark-button"
            onClick={() => {
              savePlan(destinationId, shared)
              setParams(new URLSearchParams({ day: activeDay.date }), { replace: true })
              setMessage('Копия сохранена как ваш план.')
            }}
          >
            {plans[destinationId]?.days.some((day) => day.placeIds.length)
              ? 'Заменить мой план этой копией'
              : 'Сохранить себе'}
          </button>
          <Link className="text-button" to={`/${destinationId}/plan`}>
            Мой план
          </Link>
        </div>
      )}
      <PlanBackup bundle={bundle} plan={plan} readOnly={!!shared} onApply={update} />
      <HotelBase bundle={bundle} />
      {!shared && destinationId === 'dubai' && bundle.trip.startDate === '2026-10-06' && (
        <TripProposal
          bundle={bundle}
          plan={plan}
          onApply={update}
          expanded={params.get('idea') === 'minmax'}
        />
      )}
      {bundle.trip.accommodation ? (
        <TripOverview
          bundle={bundle}
          plan={plan}
          scope={budgetScope}
          activeDate={activeDay.date}
          onSelect={(date) => {
            setDayToOpen(date)
            setParams(
              (current) => {
                const next = new URLSearchParams(current)
                next.set('day', date)
                return next
              },
              { replace: true },
            )
          }}
        />
      ) : (
        <>
          <div className="plan-summary">
            <div>
              <CalendarDays size={22} />
              <span>
                <strong>
                  {scheduled.size} мест / {plan.days.length} дней
                </strong>
                <small>Билеты · {families[budgetScope].label} · по настройкам дней</small>
              </span>
            </div>
            <div>
              <strong>{budget(total)}</strong>
            </div>
            <RateStrip bundle={bundle} />
          </div>
          <p className="fine-print plan-budget-note">
            {total.unknownPrices > 0 &&
              `Мест без цены в валюте поездки: ${total.unknownPrices}. Они не включены в сумму. `}
            Бюджет учитывает входные билеты из каталога, без еды, дороги и дополнительных услуг.
            Цены «от» дают нижнюю оценку; наличие билетов на даты поездки нужно проверить.
          </p>
        </>
      )}
      {!shared && (
        <section className="plan-builder" aria-label="Автопланирование">
          <div>
            <Sparkles size={23} />
            <div>
              <h2>Из желаний — в маршрут.</h2>
              <p>
                Распределим избранное по дням: близкие места вместе, с учётом длительности. Добавим
                к вашему плану, сохранив порядок уже выбранных остановок.
              </p>
            </div>
          </div>
          <div className="plan-actions">
            <label>
              Весь выезд, с дорогой и перерывами
              <select
                value={dailyMinutes}
                onChange={(event) => setDailyMinutes(Number(event.target.value))}
              >
                <option value={360}>6 часов · спокойно</option>
                <option value={480}>8 часов · сбалансированно</option>
                <option value={720}>12 часов · насыщенно, 10:00–22:00</option>
              </select>
            </label>
            <button
              className="button dark-button"
              onClick={autoFill}
              disabled={
                !pending.some((place) => place.availability.status !== 'temporarily-closed')
              }
            >
              <Sparkles size={17} />
              Дополнить из избранного
            </button>
          </div>
        </section>
      )}
      <p className="plan-status" role="status" aria-live="polite">
        {message}
      </p>
      {shareUrl && (
        <label className="plan-share">
          Ссылка на копию плана
          <input
            aria-label="Ссылка на план"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
      <div className="plan-days" role="group" aria-label="Дни поездки">
        {plan.days.map((day, index) => (
          <button
            key={day.date}
            className={`plan-day-tab ${day.date === activeDay.date ? 'active' : ''}`}
            aria-pressed={day.date === activeDay.date}
            onClick={() => {
              setParams(
                (current) => {
                  const next = new URLSearchParams(current)
                  next.set('day', day.date)
                  return next
                },
                { replace: true },
              )
              setSelectedId(undefined)
            }}
          >
            <span>День {index + 1}</span>
            <strong>{formatDate(day.date).replace(/ \d{4} г\.$/, '')}</strong>
            <small>{day.placeIds.length} мест</small>
          </button>
        ))}
      </div>
      {plan.days.map((day, dayIndex) => {
        const places = day.placeIds.map((id) => placeById.get(id)!)
        const settings = day.settings ?? defaultRouteSettings
        const updateSettings = (next: Partial<typeof settings>) =>
          update({
            ...plan,
            days: plan.days.map((saved) =>
              saved.date === day.date ? { ...saved, settings: { ...settings, ...next } } : saved,
            ),
          })
        const summary = summarizeDay(places, bundle.exchangeRate.baseCurrency)
        summary.amount = places.reduce(
          (sum, place) =>
            sum +
            familyTicketPrice(
              place,
              budgetScope,
              day.settings ?? defaultRouteSettings,
              day.date,
              bundle.exchangeRate.baseCurrency,
            ).amount,
          0,
        )
        return (
          <section
            className="plan-day"
            id={`plan-day-${day.date}`}
            tabIndex={-1}
            key={day.date}
            hidden={day.date !== activeDay.date}
            aria-label={`День ${dayIndex + 1}`}
          >
            <div className="plan-day-heading">
              {!shared && (
                <a
                  className="button secondary"
                  href="#choose-places"
                  onClick={(event) => {
                    event.preventDefault()
                    document.getElementById('choose-places')!.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <Plus size={17} />
                  Выбрать места
                </a>
              )}
              <h2>
                День {dayIndex + 1} · {formatDate(day.date)}
              </h2>
              {places.length > 0 && (
                <p>
                  {formatDuration(summary)} по карточкам · {budget(summary)} ·{' '}
                  {formatDistance(summary.distance)} между остановками по прямой
                </p>
              )}
            </div>
            {summary.maxMinutes > dailyMinutes && (
              <p className="plan-warning">
                По карточкам получается больше {dailyMinutes / 60} часов. С учётом дороги и
                перерывов день может быть тесным — посмотрите расчёт маршрута ниже.
              </p>
            )}
            {!shared && destinationId === 'dubai' && (
              <details className="day-ideas" open={!places.length}>
                <summary>Идеи на этот день · близкие места вместе</summary>
                <div>
                  {dubaiDayIdeas.map((idea) => {
                    const candidates = idea.slugs.map((slug) =>
                      bundle.places.find((place) => place.slug === slug)!,
                    )
                    const closed = candidates.some((place) => closedOnDate(place, day.date))
                    const available = candidates.filter((place) => !scheduled.has(place.id))
                    return (
                      <article key={idea.title}>
                        <h3>{idea.title}</h3>
                        <p>{idea.description}</p>
                        <button
                          className="button secondary"
                          disabled={closed || !available.length}
                          onClick={() => {
                            update(
                              available.reduce(
                                (next, place) => placeInDay(next, place.id, day.date),
                                plan,
                              ),
                            )
                            setMessage(
                              `Добавлено мест: ${available.length}. Остановки из других дней сохранены. Теперь можно оптимизировать день.`,
                            )
                          }}
                        >
                          {closed
                            ? 'Не подходит на эту дату'
                            : !available.length
                              ? 'Уже в плане'
                              : `Добавить ${available.length} места`}
                        </button>
                      </article>
                    )
                  })}
                </div>
              </details>
            )}
            {places.length > 0 && bundle.trip.accommodation && (
              <DayRoutePlanner
                day={day}
                bundle={bundle}
                readOnly={Boolean(shared)}
                otherDays={shared ? [] : plan.days}
                onMove={(current, target) =>
                  update({
                    ...plan,
                    days: plan.days.map((saved) =>
                      saved.date === current.date
                        ? current
                        : saved.date === target.date
                          ? target
                          : saved,
                    ),
                  })
                }
                onChange={(next) =>
                  update({
                    ...plan,
                    days: plan.days.map((saved) => (saved.date === next.date ? next : saved)),
                  })
                }
              />
            )}
            {!places.length && (
              <div className="plan-empty">
                <CalendarDays size={32} />
                <h3>День открыт для новых мест.</h3>
                <p>Добавьте место ниже или соберите маршрут из избранного.</p>
                <Link className="text-button" to={`/${destinationId}`}>
                  Выбрать в каталоге →
                </Link>
              </div>
            )}
            <ol className="plan-stops">
              {places.map((place, index) => (
                <li className="plan-stop" key={place.id}>
                  <span className="plan-stop-number">{index + 1}</span>
                  <Link className="plan-stop-photo" to={`/${destinationId}/place/${place.slug}`}>
                    <Photo imageId={place.imageId} alt={place.nameRu} />
                  </Link>
                  <div className="plan-stop-content">
                    <span className="eyebrow">
                      {bundle.areas.find((area) => area.id === place.areaId)!.name}
                    </span>
                    <h3>
                      <Link to={`/${destinationId}/place/${place.slug}`}>{place.nameRu}</Link>
                    </h3>
                    <p>
                      {formatDuration(place.duration)} · {formatPrice(place.pricing)}{' '}
                      {formatRub(place.pricing, bundle.exchangeRate)}
                    </p>
                    <p className="fine-print">{place.bestTime.join(' ')}</p>
                    {!shared &&
                      !(
                        places.length === 1 &&
                        place.areaId === 'desert' &&
                        settings.safariTransferConfirmed
                      ) && (
                        <div className="stop-timing">
                          <label>
                            Вход по билету, если он уже куплен
                            <input
                              aria-label={`Вход по билету: ${place.nameRu}`}
                              type="time"
                              value={settings.slots[place.id] ?? ''}
                              onChange={(event) => {
                                const slots = { ...settings.slots }
                                if (event.target.value) slots[place.id] = event.target.value
                                else delete slots[place.id]
                                updateSettings({ slots })
                              }}
                            />
                          </label>
                          <label>
                            Время на месте, мин
                            <input
                              aria-label={`Время на месте: ${place.nameRu}`}
                              type="number"
                              min="15"
                              max="720"
                              step="15"
                              value={
                                settings.visits[place.id] ??
                                (place.areaId === 'hatta'
                                  ? 180
                                  : Math.round(
                                      (place.duration.minMinutes + place.duration.maxMinutes) / 2,
                                    ))
                              }
                              onChange={(event) => {
                                const value = Number(event.target.value)
                                if (Number.isInteger(value) && value >= 15 && value <= 720)
                                  updateSettings({
                                    visits: { ...settings.visits, [place.id]: value },
                                  })
                              }}
                            />
                          </label>
                          <label>
                            Запас на очередь, мин
                            <input
                              aria-label={`Запас на очередь: ${place.nameRu}`}
                              type="number"
                              min="0"
                              max="240"
                              step="5"
                              value={
                                settings.waits[place.id] ??
                                evaluateRoute(places, bundle, day.date, settings).stops[index]
                                  .queueMinutes
                              }
                              onChange={(event) => {
                                const value = Number(event.target.value)
                                if (Number.isInteger(value) && value >= 0 && value <= 240)
                                  updateSettings({
                                    waits: { ...settings.waits, [place.id]: value },
                                  })
                              }}
                            />
                            {place.queue && !(place.id in settings.waits) && (
                              <small>Автоматически: сезон, выходные и время прибытия.</small>
                            )}
                            {place.id in settings.waits && (
                              <button
                                type="button"
                                className="text-button"
                                onClick={() => {
                                  const waits = { ...settings.waits }
                                  delete waits[place.id]
                                  updateSettings({ waits })
                                }}
                              >
                                Считать автоматически
                              </button>
                            )}
                          </label>
                        </div>
                      )}
                    {places.length === 1 &&
                      place.areaId === 'desert' &&
                      settings.safariTransferConfirmed && (
                        <p className="fine-print">
                          Весь тур с дорогой и ужином — около шести часов. Время забора задаём в
                          поле «Выезд из отеля».
                        </p>
                      )}
                    {bundle.trip.accommodation && (
                      <a
                        className="text-button"
                        href={directionsUrl(
                          index
                            ? places[index - 1].coordinates
                            : bundle.trip.accommodation.coordinates,
                          place.coordinates,
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {index ? 'От предыдущей остановки' : 'От отеля'} · маршрут на машине ↗
                      </a>
                    )}
                    {closedOnDate(place, day.date) && (
                      <p className="plan-warning">
                        На этот день указано закрытие. Выберите другую дату.
                      </p>
                    )}
                    {place.availability.status !== 'open' && (
                      <p className="plan-warning">
                        {place.availability.status === 'temporarily-closed'
                          ? 'Временно закрыто. '
                          : 'Проверьте даты. '}
                        {place.availability.note}
                      </p>
                    )}
                    {place.bookingRecommended && (
                      <Link className="text-button" to={`/${destinationId}/place/${place.slug}`}>
                        Рекомендуется бронирование →
                      </Link>
                    )}
                    {index > 0 && (
                      <small className="fine-print">
                        От предыдущей остановки:{' '}
                        {formatDistance(
                          distanceBetween(places[index - 1].coordinates, place.coordinates),
                        )}{' '}
                        по прямой
                      </small>
                    )}
                  </div>
                  {!shared && (
                    <div className="plan-stop-controls">
                      <label className="sr-only" htmlFor={`day-${place.id}`}>
                        День: {place.nameRu}
                      </label>
                      <select
                        id={`day-${place.id}`}
                        value={day.date}
                        onChange={(event) => update(placeInDay(plan, place.id, event.target.value))}
                      >
                        {plan.days.map((target, index) => (
                          <option key={target.date} value={target.date}>
                            День {index + 1}
                          </option>
                        ))}
                      </select>
                      <div>
                        <button
                          className="button secondary"
                          aria-label={`Выше: ${place.nameRu}`}
                          disabled={index === 0}
                          onClick={() => reorder(day.date, index, -1)}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          className="button secondary"
                          aria-label={`Ниже: ${place.nameRu}`}
                          disabled={index === places.length - 1}
                          onClick={() => reorder(day.date, index, 1)}
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          className="button secondary"
                          aria-label={`Убрать из плана: ${place.nameRu}`}
                          onClick={() => update(placeInDay(plan, place.id, ''))}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            {places.length > 0 && bundle.trip.accommodation && (
              <div className="plan-return">
                <a
                  className="text-button"
                  href={directionsUrl(
                    places.at(-1)!.coordinates,
                    bundle.trip.accommodation.coordinates,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Вернуться в {bundle.trip.accommodation.name} ↗
                </a>
                <p className="fine-print">
                  Выезд с возвращением:{' '}
                  {formatDistance(
                    summary.distance +
                      distanceBetween(
                        bundle.trip.accommodation.coordinates,
                        places[0].coordinates,
                      ) +
                      distanceBetween(
                        places.at(-1)!.coordinates,
                        bundle.trip.accommodation.coordinates,
                      ),
                  )}{' '}
                  по прямой. Объединяя соседние места в один день, можно избежать повторных выездов
                  из отеля.
                </p>
              </div>
            )}
          </section>
        )
      })}
      {!shared && (
        <section className="plan-picker" id="choose-places">
          <h2>Что добавим на {formatDate(activeDay.date)}?</h2>
          <PlacePicker
            bundle={bundle}
            day={activeDay}
            excludedIds={[...scheduled]}
            onSelect={(id) => {
              update(placeInDay(plan, id, activeDay.date))
              setMessage(
                `${placeById.get(id)!.nameRu} — добавлено на ${formatDate(activeDay.date)}.`,
              )
            }}
          />
        </section>
      )}
      {pending.length > 0 && !shared && (
        <div className="plan-pending">
          <h3>Ещё в избранном · {pending.length}</h3>
          <p className="fine-print">
            Закрытые места и посещения, которые не помещаются в выбранное время, остаются здесь.
            Можно добавить вручную.
          </p>
          <div>
            {pending.map((place) => (
              <button
                className="button secondary"
                key={place.id}
                onClick={() => update(placeInDay(plan, place.id, activeDay.date))}
              >
                <Plus size={14} />
                {place.nameRu}
              </button>
            ))}
          </div>
        </div>
      )}
      {activeDay.placeIds.length > 0 && (
        <div className="plan-map">
          <button
            className="button secondary"
            aria-expanded={showMap}
            onClick={() => setShowMap(!showMap)}
          >
            <Map size={17} />
            {showMap ? 'Скрыть карту дня' : 'Показать карту дня'}
          </button>
          {showMap && (
            <LazyMap
              bundle={bundle}
              places={activeDay.placeIds.map((id) => placeById.get(id)!)}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
      )}
      <p className="fine-print plan-footnote">
        План хранится в этом браузере. Ссылка содержит отдельную копию без синхронизации. Время —
        оценка посещений и дороги. Реальное время в пути, доступность транспорта и билеты проверяем
        перед выездом.
      </p>
    </main>
  )
}
