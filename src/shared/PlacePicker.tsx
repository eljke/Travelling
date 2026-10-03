import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Heart, Map, Search } from 'lucide-react'
import type { DestinationBundle } from '../domain/model'
import type { Itinerary } from '../domain/itinerary'
import { previewInsertion } from '../domain/itinerary'
import { usePreferences } from '../app/Preferences'
import { closedOnDate } from '../domain/openingHours'
import { distanceBetween } from '../domain/geo'
import { familyRouteBudget, families } from '../domain/families'
import { clockTime, defaultRouteSettings } from '../domain/dayRoute'
import { formatDate, formatDuration, formatMoney, formatPrice, formatRub } from './format'
import { categoryLabels } from './labels'
import Photo from './Photo'
import LazyMap from '../features/map/LazyMap'
import { sortRecommended } from '../domain/filters'
import PlanButton from './PlanButton'

export default function PlacePicker({
  bundle,
  onSelect,
  selectedId,
  excludedIds = [],
  day,
  onSelectDay,
}: {
  bundle: DestinationBundle
  onSelect: (id: string) => void
  selectedId?: string
  excludedIds?: string[]
  day?: Itinerary['days'][number]
  onSelectDay?: (date: string) => void
}) {
  const { favorites, budgetScope } = usePreferences()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [focused, setFocused] = useState<string>()
  const [fitsOnly, setFitsOnly] = useState(false)
  const [sort, setSort] = useState('nearby')
  const previews = useMemo(() => {
    if (!day || !bundle.trip.accommodation) return undefined
    return new globalThis.Map(
      bundle.places.map((place) => [place.id, previewInsertion(day, place, bundle)]),
    )
  }, [bundle, day])
  const term = query.trim().toLocaleLowerCase('ru')
  const current = day?.placeIds.map((id) => bundle.places.find((place) => place.id === id)!) ?? []
  const proximity = (place: DestinationBundle['places'][number]) =>
    Math.min(
      ...(current.length
        ? current
        : bundle.trip.accommodation
          ? [bundle.trip.accommodation]
          : [place]
      ).map((point) => distanceBetween(point.coordinates, place.coordinates)),
    )
  const places = sortRecommended(bundle.places)
    .filter(
      (place) =>
        !excludedIds.includes(place.id) &&
        (!term ||
          `${place.nameRu} ${place.name} ${bundle.areas.find((area) => area.id === place.areaId)!.nameRu}`
            .toLocaleLowerCase('ru')
            .includes(term)) &&
        (!category || place.categories.includes(category as (typeof place.categories)[number])) &&
        (!savedOnly || favorites.includes(place.id)) &&
        (!fitsOnly || previews?.get(place.id)?.fits),
    )
    .sort((a, b) => (day && sort === 'nearby' ? proximity(a) - proximity(b) : 0))
  const suggestions =
    day && current.length
      ? places
          .filter(
            (place) =>
              !closedOnDate(place, day.date) &&
              previews?.get(place.id)?.fits &&
              proximity(place) < 3,
          )
          .sort((a, b) => proximity(a) - proximity(b))
          .slice(0, 3)
      : []
  const mapPlaces = focused
    ? [...places].sort((a, b) => Number(b.id === focused) - Number(a.id === focused))
    : places
  return (
    <div className="place-picker">
      <div className="picker-tools">
        <label className="picker-search">
          <Search size={18} />
          <input
            type="search"
            aria-label="Поиск места"
            placeholder="Название или район"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="Категория места"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Все категории</option>
          {Object.entries(categoryLabels).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="button secondary"
          aria-pressed={savedOnly}
          onClick={() => setSavedOnly(!savedOnly)}
        >
          <Heart size={17} />
          Избранное
        </button>
        <button
          type="button"
          className="button secondary"
          aria-pressed={showMap}
          onClick={() => setShowMap(!showMap)}
        >
          <Map size={17} />
          {showMap ? 'Карточки' : 'На карте'}
        </button>
        {previews && (
          <label className="picker-fit">
            <input
              type="checkbox"
              checked={fitsOnly}
              onChange={(event) => setFitsOnly(event.target.checked)}
            />
            Помещается в день
          </label>
        )}
        {day && (
          <select
            aria-label="Порядок предложений"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="nearby">Сначала по пути</option>
            <option value="catalog">Сначала стоит увидеть</option>
          </select>
        )}
      </div>
      <p className="fine-print" role="status">
        Найдено мест: {places.length}
        {day && ` · добавляем на ${formatDate(day.date)}`}
      </p>
      {day && (
        <p className="fine-print">
          Подбираем место в маршруте с учётом дороги, часов работы и билетов. Порядок уже выбранных
          остановок сохраняется. Бюджет — за весь день; еда и покупки отдельно.
        </p>
      )}
      {suggestions.length > 0 && (
        <div className="picker-recommendations">
          <h3>Можно совместить за один выезд</h3>
          <p className="fine-print">
            Рядом с выбранными местами и помещается в расчёт дня. Расстояния — по прямой, дорога
            учитывается отдельно.
          </p>
          <div>
            {suggestions.map((place) => (
              <button
                type="button"
                className="button secondary"
                key={place.id}
                onClick={() => setQuery(place.nameRu)}
              >
                <Photo imageId={place.imageId} alt={place.nameRu} />
                <span>
                  {place.nameRu}
                  <small>≈ {proximity(place).toFixed(1)} км от ближайшей остановки</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      {showMap && places.length > 0 && (
        <LazyMap bundle={bundle} places={places} selectedId={focused} onSelect={setFocused} />
      )}
      {!places.length && (
        <p className="plan-empty">
          Мест не нашлось. Попробуйте другое название или снимите фильтры.
        </p>
      )}
      <div className="picker-grid">
        {mapPlaces.map((place) => {
          const insertion = previews?.get(place.id)
          const preview = insertion?.route
          const budget =
            preview && day
              ? familyRouteBudget(
                  preview,
                  budgetScope,
                  day.settings ?? defaultRouteSettings,
                  day.date,
                  bundle.exchangeRate.baseCurrency,
                )
              : undefined
          const closed = Boolean(day && closedOnDate(place, day.date))
          const selected = selectedId === place.id
          return (
            <article
              className={`picker-card ${focused === place.id || selected ? 'selected' : ''}`}
              key={place.id}
              data-place-id={place.id}
            >
              <div className="card-media">
                <Photo imageId={place.imageId} alt={place.nameRu} />
              </div>
              <div className="picker-card-body">
                <small>{bundle.areas.find((area) => area.id === place.areaId)!.nameRu}</small>
                <h3>{place.nameRu}</h3>
                <p>
                  {formatDuration(place.duration)} · {formatPrice(place.pricing)}{' '}
                  {formatRub(place.pricing, bundle.exchangeRate)}
                </p>
                {preview && (
                  <div className={`picker-preview ${insertion!.fits ? '' : 'picker-tight'}`}>
                    <strong>
                      {closed
                        ? 'Закрыто на этот день'
                        : insertion!.fits
                          ? 'Помещается в день'
                          : 'Нужно скорректировать день'}
                    </strong>
                    <p>{insertion!.placement}</p>
                    <p>
                      Возврат ≈ {clockTime(preview.returnAt)} · дорога {preview.travelMinutes} мин
                    </p>
                    <p>
                      {preview.unknownPrices || place.pricing.kind === 'from' ? 'От ' : '≈ '}
                      {formatMoney(
                        budget!.ticketCost + budget!.cost,
                        bundle.exchangeRate,
                        budget!.ticketCost + budget!.highCost,
                      )}{' '}
                      за день · {families[budgetScope].label}
                      {preview.unknownPrices ? ' · часть цен неизвестна' : ''}
                    </p>
                  </div>
                )}
                <div className="picker-actions">
                  <button
                    type="button"
                    className="button dark-button"
                    disabled={closed || selected}
                    aria-label={`${day ? 'Добавить' : 'Выбрать'}: ${place.nameRu}`}
                    onClick={() => onSelect(place.id)}
                  >
                    {selected && <Check size={16} />}
                    {selected ? 'Выбрано' : day ? `На ${formatDate(day.date)}` : 'Выбрать место'}
                  </button>
                  {day && onSelectDay && (!insertion?.fits || closed) && (
                    <PlanButton
                      place={place}
                      bundle={bundle}
                      onAdded={onSelectDay}
                      label="Подобрать другой день"
                    />
                  )}
                  <Link
                    className="text-button"
                    to={`/${bundle.destination.id}/place/${place.slug}`}
                  >
                    Подробнее ↗
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
