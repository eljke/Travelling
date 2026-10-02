import { useMemo, useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Map,
  LayoutGrid,
  SlidersHorizontal,
  LocateFixed,
  X,
  Sun,
  MapPin,
  Heart,
} from 'lucide-react'
import { useDestinationBundle } from '../app/ExchangeRates'
import RateStrip from '../shared/RateStrip'
import type { Coordinates } from '../domain/model'
import { parseFilters, serializeFilters, defaultFilters, filterPlaces } from '../domain/filters'
import type { Filters } from '../domain/filters'
import { sortByDistance, distanceBetween } from '../domain/geo'
import { formatTrip, formatDistance } from '../shared/format'
import { categoryLabels, tagLabels, ui } from '../shared/labels'
import { usePreferences } from '../app/Preferences'
import Photo from '../shared/Photo'
import PlaceCard from '../shared/PlaceCard'
import LazyMap from '../features/map/LazyMap'

export default function DestinationPage({ mapMode = false }: { mapMode?: boolean }) {
  const { destinationId = '' } = useParams()
  const bundle = useDestinationBundle(destinationId)
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])
  const { favorites } = usePreferences()
  const [pagination, setPagination] = useState({ query: '', limit: 12 })
  const limit = pagination.query === params.toString() ? pagination.limit : 12
  const [position, setPosition] = useState<Coordinates>()
  const [locationMessage, setLocationMessage] = useState('')
  const [locating, setLocating] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(
    () => !window.matchMedia('(max-width: 600px)').matches,
  )
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)')
    const update = () => setFiltersOpen(!media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const selectedId = params.get('selected') ?? undefined
  const places = useMemo(() => {
    if (!bundle) return []
    const result = filterPlaces(bundle, filters, favorites)
    if (filters.sort === 'price')
      return result.sort((a, b) => (a.pricing.amount ?? Infinity) - (b.pricing.amount ?? Infinity))
    if (filters.sort === 'nearby' && position)
      return sortByDistance(result, position).map((v) => v.place)
    return result
  }, [bundle, filters, favorites, position])
  if (!bundle)
    return (
      <main className="container empty" id="main">
        <h1>Направление не найдено</h1>
        <Link to="/">Все путешествия</Link>
      </main>
    )
  const setFilter = (key: keyof Filters, value: string | boolean) =>
    setParams(serializeFilters({ ...filters, [key]: value }), { replace: true })
  const reset = () => setParams(new URLSearchParams(), { replace: true })
  const query = serializeFilters(filters).toString()
  const route = `/${destinationId}${mapMode ? '' : '/map'}${query ? `?${query}` : ''}`
  const selectPlace = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('selected', id)
    setParams(next, { replace: true })
  }
  const findLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Браузер не поддерживает геолокацию. Выберите район вручную.')
      return
    }
    setLocating(true)
    setLocationMessage('')
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({ lat: result.coords.latitude, lng: result.coords.longitude })
        setParams((current) => serializeFilters({ ...parseFilters(current), sort: 'nearby' }), {
          replace: true,
        })
        setLocating(false)
      },
      (error) => {
        setLocating(false)
        setLocationMessage(
          error.code === 1
            ? 'Доступ к геолокации отключён. Выберите район вручную.'
            : 'Не удалось определить положение. Попробуйте ещё раз или выберите район.',
        )
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }
  const featured = bundle.areas.find((a) => a.id === bundle.destination.featuredAreaId)!
  const areaFilter = (
    <label>
      <span>Район</span>
      <select
        aria-label="Район"
        value={filters.area}
        onChange={(e) => setFilter('area', e.target.value)}
      >
        <option value="">{ui.allAreas}</option>
        {bundle.areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </select>
    </label>
  )
  return (
    <main id="main" className={mapMode ? 'destination map-page' : 'destination'}>
      {!mapMode && (
        <>
          <section className="destination-hero container">
            <Photo
              imageId={bundle.destination.heroImageId}
              alt={`Панорама: ${bundle.destination.nameRu}`}
              priority
            />
            <div className="hero-overlay" />
            <div className="hero-top">
              <span className="hero-country">
                {bundle.country.isoCode} <span>·</span> {bundle.country.nameRu}
              </span>
              <span className="hero-edition">Личный путеводитель / 01</span>
            </div>
            <div className="hero-content">
              <span className="hero-date">{formatTrip(bundle.trip)}</span>
              <h1>
                {bundle.destination.name}
                <span>.</span>
              </h1>
              <p>{bundle.destination.tagline}</p>
              <Link to={`/${destinationId}/map`} className="button hero-button">
                <Map size={18} />
                Исследовать на карте
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <span className="hero-caption">Меньше планов. Больше открытий.</span>
          </section>
          <div className="trip-facts container">
            <div>
              <MapPin size={20} />
              <span>
                <strong>{bundle.places.length} мест</strong>
                <small>В городе и за его пределами</small>
              </span>
            </div>
            <div>
              <Sun size={22} />
              <span>
                <strong>Климат и сезон</strong>
                <small>Советы для поездки ниже</small>
              </span>
            </div>
            <div>
              <RateStrip bundle={bundle} />
            </div>
            <Link to={`/${destinationId}/sources`}>
              Как проверены данные
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </>
      )}
      <section className="catalog-section container">
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">ВАШ ГОРОД. ВАШ ТЕМП.</span>
            <h2>{mapMode ? 'Большая карта открытий.' : `Места: ${bundle.destination.nameRu}.`}</h2>
            {!mapMode && <p>Громкие символы и тихие находки. Выберите то, что интересно вам.</p>}
          </div>
          <Link to={route} className="button secondary view-toggle">
            {mapMode ? <LayoutGrid size={17} /> : <Map size={17} />}
            {mapMode ? 'К каталогу' : 'Показать карту'}
          </Link>
        </div>
        <div className="catalog-controls">
          <div className="search-row">
            <label className="search-field">
              <Search size={20} />
              <input
                aria-label="Поиск мест"
                type="search"
                placeholder={ui.search}
                value={filters.q}
                onChange={(e) => setFilter('q', e.target.value)}
              />
            </label>
            <button
              className={`button nearby-button ${position ? 'active' : ''}`}
              onClick={findLocation}
              disabled={locating}
            >
              <LocateFixed size={18} />
              {locating ? 'Ищем…' : 'Рядом со мной'}
            </button>
            <button
              className={`button favorite-filter ${filters.favorites ? 'active' : ''}`}
              aria-label="Показать избранное"
              aria-pressed={filters.favorites}
              onClick={() => setFilter('favorites', !filters.favorites)}
            >
              <Heart size={18} />
              <span>Избранное</span>
              {favorites.length > 0 && <small>{favorites.length}</small>}
            </button>
          </div>
          <details
            className="filter-details"
            open={filtersOpen}
            onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
          >
            <summary>
              <SlidersHorizontal size={17} />
              Фильтры
              {[
                filters.area,
                filters.category,
                filters.price,
                filters.duration,
                filters.tag,
              ].filter(Boolean).length > 0 && (
                <span className="filter-count">
                  {
                    [
                      filters.area,
                      filters.category,
                      filters.price,
                      filters.duration,
                      filters.tag,
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </summary>
            <div className="filter-panel">
              {areaFilter}
              <label>
                <span>Тип места</span>
                <select
                  aria-label="Тип места"
                  value={filters.category}
                  onChange={(e) => setFilter('category', e.target.value)}
                >
                  <option value="">{ui.allTypes}</option>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Бюджет</span>
                <select
                  aria-label="Бюджет"
                  value={filters.price}
                  onChange={(e) => setFilter('price', e.target.value)}
                >
                  <option value="">{ui.allPrices}</option>
                  <option value="free">Бесплатно</option>
                  <option value="under-100">
                    До {bundle.destination.priceThresholds[0]} {bundle.exchangeRate.baseCurrency}
                  </option>
                  <option value="100-250">
                    {bundle.destination.priceThresholds[0]}–{bundle.destination.priceThresholds[1]}{' '}
                    {bundle.exchangeRate.baseCurrency}
                  </option>
                  <option value="250-plus">
                    От {bundle.destination.priceThresholds[1]} {bundle.exchangeRate.baseCurrency}
                  </option>
                </select>
              </label>
              <label>
                <span>Время</span>
                <select
                  aria-label="Время на визит"
                  value={filters.duration}
                  onChange={(e) => setFilter('duration', e.target.value)}
                >
                  <option value="">{ui.allDurations}</option>
                  <option value="under-1">Менее часа</option>
                  <option value="1-2">1–2 часа</option>
                  <option value="2-4">2–4 часа</option>
                  <option value="half-day">Полдня и больше</option>
                </select>
              </label>
              <label>
                <span>Особенности</span>
                <select
                  aria-label="Особенности"
                  value={filters.tag}
                  onChange={(e) => setFilter('tag', e.target.value)}
                >
                  <option value="">Любые</option>
                  {Object.entries(tagLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </details>
          <div className="quick-filters">
            {[
              ['', 'Все места'],
              ['must-see', 'Стоит увидеть'],
              ['beach', 'У моря'],
              ['sunset', 'На закате'],
              ['kids', 'С детьми'],
            ].map(([key, label]) => (
              <button
                key={key}
                className={filters.tag === key ? 'active' : ''}
                aria-pressed={filters.tag === key}
                onClick={() => setFilter('tag', key)}
              >
                {label}
              </button>
            ))}
            <button
              className={filters.area === featured.id ? 'active' : ''}
              aria-pressed={filters.area === featured.id}
              onClick={() => setFilter('area', filters.area === featured.id ? '' : featured.id)}
            >
              {featured.name}
            </button>
          </div>
        </div>
        {locationMessage && (
          <p role="status" className="status-message">
            {locationMessage}
          </p>
        )}
        {filters.sort === 'nearby' && !position && (
          <p className="status-message">
            Нажмите «Рядом со мной», чтобы отсортировать места по вашему положению. Геопозиция не
            сохраняется.
          </p>
        )}
        <div className="results-bar">
          <p aria-live="polite">
            <strong>{places.length}</strong> мест для вас{filters.favorites && ' · избранное'}
          </p>
          <div>
            {Object.entries(filters).some(
              ([key, value]) => value && value !== defaultFilters[key as keyof Filters],
            ) && (
              <button className="text-button" onClick={reset}>
                <X size={14} />
                Сбросить
              </button>
            )}
            <label className="sort-control">
              <span className="sr-only">Сортировка</span>
              <select
                aria-label="Сортировка"
                value={filters.sort}
                onChange={(e) =>
                  e.target.value === 'nearby' ? findLocation() : setFilter('sort', e.target.value)
                }
              >
                <option value="editorial">Выбор редакции</option>
                <option value="price">Сначала дешевле</option>
                <option value="nearby">Ближе ко мне</option>
              </select>
            </label>
          </div>
        </div>
        <div className={mapMode ? 'map-layout' : ''}>
          {mapMode && (
            <div className="full-map">
              <LazyMap
                bundle={bundle}
                places={places}
                selectedId={selectedId}
                onSelect={selectPlace}
                userPosition={position}
              />
            </div>
          )}
          <div className={mapMode ? 'map-card-list' : 'places-grid'}>
            {places.length === 0 ? (
              <div className="empty">
                <Search size={30} />
                <h3>
                  {filters.favorites ? 'Здесь будут любимые места' : 'Пока ничего не нашлось'}
                </h3>
                <p>
                  {filters.favorites
                    ? 'Сохраняйте места сердечком — они останутся в этом браузере.'
                    : 'Попробуйте другой запрос или уберите несколько фильтров.'}
                </p>
                <button className="button secondary" onClick={reset}>
                  {ui.reset}
                </button>
              </div>
            ) : (
              places
                .slice(0, mapMode ? places.length : limit)
                .map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    bundle={bundle}
                    selected={selectedId === place.id}
                    onSelect={mapMode ? () => selectPlace(place.id) : undefined}
                    distance={position ? distanceBetween(position, place.coordinates) : undefined}
                  />
                ))
            )}
          </div>
        </div>
        {!mapMode && places.length > limit && (
          <div className="show-more">
            <button
              className="button secondary"
              onClick={() => setPagination({ query: params.toString(), limit: limit + 12 })}
            >
              Ещё места
              <ArrowRight size={17} />
            </button>
            <small>
              Показано {Math.min(limit, places.length)} из {places.length}
            </small>
          </div>
        )}
      </section>
      {!mapMode && (
        <>
          <section className="area-feature container">
            <div>
              <span className="eyebrow">ДРУГАЯ СТОРОНА ГОРОДА</span>
              <h2>
                {featured.name}
                <br />
                <em>В своём ритме.</em>
              </h2>
              <p>{featured.description}</p>
              <p className="area-distance">
                {bundle.destination.featuredAreaComparisons
                  .map((areaId) => {
                    const area = bundle.areas.find((a) => a.id === areaId)!
                    return `${area.name}: около ${formatDistance(distanceBetween(featured.center, area.center))}`
                  })
                  .join(' · ')}{' '}
                по прямой. Дорога будет длиннее.
              </p>
              <Link className="button dark-button" to={`/${destinationId}?area=${featured.id}`}>
                Исследовать район
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="area-feature-photo">
              <Photo
                imageId={bundle.places.find((p) => p.areaId === featured.id)!.imageId}
                alt={featured.name}
              />
              <span>
                {bundle.places.filter((p) => p.areaId === featured.id).length} мест рядом с вашей
                базой
              </span>
            </div>
          </section>
          <section className="map-preview container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">СНАЧАЛА ПОЙМИТЕ ГЕОГРАФИЮ</span>
                <h2>Город на расстоянии взгляда.</h2>
              </div>
              <Link to={route} className="text-button">
                Большая карта
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <LazyMap
              bundle={bundle}
              places={places}
              selectedId={selectedId}
              onSelect={selectPlace}
              userPosition={position}
            />
          </section>
          <aside className="climate-note container">
            <Sun size={24} />
            <div>
              <strong>Подберите время для прогулок.</strong>
              <p>{bundle.destination.climate.text}</p>
              <Link to={`/${destinationId}/sources`}>Источник климатической заметки ↗</Link>
            </div>
          </aside>
        </>
      )}
      <div className="mobile-view-switch">
        <Link to={route}>
          {mapMode ? <LayoutGrid size={18} /> : <Map size={18} />}
          {mapMode ? 'Места списком' : 'Открыть карту'}
        </Link>
      </div>
    </main>
  )
}
