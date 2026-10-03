import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  MapPin,
  Ticket,
  Sun,
  Info,
  Check,
  Minus,
  ExternalLink,
  Navigation,
} from 'lucide-react'
import { useState } from 'react'
import { images } from '../content/registry'
import { useDestinationBundle } from '../app/ExchangeRates'
import RateStrip from '../shared/RateStrip'
import { getNearbyPlaces } from '../domain/geo'
import type { PaymentSupport } from '../domain/model'
import {
  formatDuration,
  formatDate,
  formatPrice,
  formatRub,
  formatCoordinates,
  formatCurrency,
} from '../shared/format'
import { categoryLabels, paymentLabels } from '../shared/labels'
import Photo from '../shared/Photo'
import PlaceCard, { FavoriteButton } from '../shared/PlaceCard'
import LazyMap from '../features/map/LazyMap'
import Sources from '../shared/Sources'
import PlanButton from '../shared/PlanButton'
import HotelBase from '../shared/HotelBase'
import PhotoGallery from '../shared/PhotoGallery'

function PaymentStatus({ payment }: { payment: PaymentSupport }) {
  return (
    <div className={`payment-status ${payment.status}`}>
      <span>
        {payment.status === 'confirmed'
          ? '✓'
          : payment.status === 'likely'
            ? '!'
            : payment.status === 'unavailable'
              ? '×'
              : '?'}
      </span>
      <div>
        <strong>{paymentLabels[payment.status]}</strong>
        <p>{payment.note}</p>
        <small>
          Проверено {formatDate(payment.checkedAt)}
          {payment.scope === 'deposit' && ' · онлайн-часть заказа'}
        </small>
      </div>
    </div>
  )
}
export default function PlacePage() {
  const { destinationId = '', slug = '' } = useParams()
  const bundle = useDestinationBundle(destinationId)
  const place = bundle?.places.find((p) => p.slug === slug)
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string>()
  const [russianPaymentOnly, setRussianPaymentOnly] = useState(false)
  if (!place)
    return (
      <main id="main" className="container empty">
        <h1>Место не найдено</h1>
        <Link to={bundle ? `/${destinationId}` : '/'}>Вернуться к местам</Link>
      </main>
    )
  const area = bundle.areas.find((a) => a.id === place.areaId)!
  const offers = place.ticketProviders.filter(
    (offer) => !russianPaymentOnly || offer.russianCardSupport.status === 'confirmed',
  )
  const nearby = getNearbyPlaces(place, bundle.places)
  const image = images[place.imageId]
  const sourceIds = [
    ...new Set([
      ...place.sourceIds,
      ...place.pricing.sourceIds,
      ...place.openingHours.sourceIds,
      ...place.availability.sourceIds,
      ...place.transport.sourceIds,
      ...(place.reviewInsights?.sourceIds ?? []),
      ...place.ticketProviders.flatMap((p) => [
        ...p.russianCardSupport.sourceIds,
        ...(p.price?.sourceIds ?? []),
      ]),
    ]),
  ]
  const onBack = () => {
    if (location.key !== 'default') navigate(-1)
    else navigate(`/${destinationId}`)
  }
  return (
    <main className="place-page container" id="main">
      <div className="place-breadcrumb">
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={18} />
          Назад
        </button>
        <Link to={`/${destinationId}`}>{bundle.destination.name}</Link>
        <span>/</span>
        <Link to={`/${destinationId}?area=${area.id}`}>{area.name}</Link>
      </div>
      <section className="place-hero">
        <Photo imageId={place.imageId} alt={place.imageNote ?? place.nameRu} priority />
        <div className="hero-overlay" />
        <div className="place-hero-content">
          <span className="eyebrow">
            {categoryLabels[place.categories[0]]} · {area.name}
          </span>
          <h1>{place.nameRu}</h1>
          <p>{place.name}</p>
        </div>
        <FavoriteButton place={place} />
      </section>
      <p className="image-credit">
        Фото:{' '}
        <a href={image.sourceUrl} target="_blank" rel="noreferrer">
          {image.author}
        </a>{' '}
        ·{' '}
        <a href={image.licenseUrl} target="_blank" rel="noreferrer">
          {image.license}
        </a>
        {place.imageNote && <span> · {place.imageNote}</span>}
      </p>
      <div className="place-layout">
        <div className="place-story">
          <p className="place-lead">{place.shortDescription}</p>
          <PlanButton place={place} bundle={bundle} />
          <Link className="text-button" to={`/${destinationId}/photos?place=${place.id}`}>
            Наши фото здесь · открыть или добавить →
          </Link>
          <HotelBase bundle={bundle} place={place} />
          <p className="place-description">{place.description}</p>
          <PhotoGallery place={place} />
          {place.availability.status === 'temporarily-closed' && (
            <div className="availability-alert">
              <Info size={21} />
              <div>
                <strong>Экспозиции временно закрыты</strong>
                <p>{place.availability.note}</p>
                <a href={place.officialWebsite} target="_blank" rel="noreferrer">
                  Проверить официальную информацию ↗
                </a>
              </div>
            </div>
          )}
          <div className="practical-grid">
            <div>
              <Clock size={22} />
              <span>Сколько времени</span>
              <strong>{formatDuration(place.duration)}</strong>
              <p>{place.duration.note}</p>
            </div>
            <div>
              <Sun size={22} />
              <span>Когда лучше</span>
              <p>{place.bestTime.join(' ')}</p>
            </div>
            <div>
              <MapPin size={22} />
              <span>Как добраться</span>
              <p>{place.transport.text}</p>
            </div>
            <div>
              <Ticket size={22} />
              <span>Часы и доступ</span>
              <p>{place.openingHours.text}</p>
              <small>Проверено {formatDate(place.openingHours.checkedAt)}</small>
              <Sources bundle={bundle} ids={place.openingHours.sourceIds} />
            </div>
          </div>
          {place.availability.status !== 'temporarily-closed' && (
            <p className="availability-note">
              <Info size={15} />
              {place.availability.note}
            </p>
          )}
          <section className="review-section">
            <span className="eyebrow">ОПЫТ РУССКОЯЗЫЧНЫХ ПУТЕШЕСТВЕННИКОВ</span>
            <h2>Что говорят после визита.</h2>
            {place.reviewInsights ? (
              <>
                <p className="review-consensus">{place.reviewInsights.consensus}</p>
                <div className="review-columns">
                  <div>
                    <h3>
                      <Check size={17} />
                      За что любят
                    </h3>
                    <ul>
                      {place.reviewInsights.positives.map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>
                      <Minus size={17} />
                      Что учитывать
                    </h3>
                    <ul>
                      {place.reviewInsights.negatives.map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="review-tips">
                  <strong>Советы из отзывов</strong>
                  <ul>
                    {place.reviewInsights.tips.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </div>
                <p className="fine-print">
                  {place.reviewInsights.sampleNote} Проверено{' '}
                  {formatDate(place.reviewInsights.checkedAt)}.
                </p>
              </>
            ) : (
              <div className="unknown-review">
                <p>Для этого места ещё не собрали достаточно свежих отзывов.</p>
                <p>
                  Пока можно посмотреть сайт места и источники ниже. Позже добавим впечатления
                  посетителей.
                </p>
              </div>
            )}
          </section>
          <details className="place-sources">
            <summary>
              <ExternalLink size={17} />
              Источники этого места<span>{sourceIds.length}</span>
            </summary>
            <Sources bundle={bundle} ids={sourceIds} />
          </details>
        </div>
        <aside className="booking-panel">
          <span className="eyebrow">ВАШ ВИЗИТ</span>
          <div className="booking-price">
            <strong>{formatPrice(place.pricing)}</strong>
            <span>{formatRub(place.pricing, bundle.exchangeRate)}</span>
          </div>
          <p>{place.pricing.note}</p>
          {place.pricing.variants.length > 0 && (
            <ul className="price-variants">
              {place.pricing.variants.map((v) => (
                <li key={v.label}>
                  <span>{v.label}</span>
                  <strong>{formatCurrency(v.amount, place.pricing.currency)}</strong>
                </li>
              ))}
            </ul>
          )}
          <p className="booking-recommendation">
            <Ticket size={16} />
            {place.bookingRecommended
              ? 'Рекомендуем проверить и забронировать заранее'
              : place.pricing.kind === 'free'
                ? 'Для прогулки билет не нужен'
                : 'Проверьте условия посещения'}
          </p>
          <a
            className="button dark-button"
            href={place.officialWebsite}
            target="_blank"
            rel="noreferrer"
          >
            Официальный сайт
            <ArrowUpRight size={17} />
          </a>
          <button
            className="text-button"
            onClick={() =>
              document.getElementById('purchase')!.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'instant'
                  : 'smooth',
              })
            }
          >
            Сравнить способы покупки
            <ArrowLeft className="down-arrow" size={16} />
          </button>
          <small>
            Цены проверены {formatDate(place.pricing.checkedAt)}. Курс от{' '}
            {formatDate(bundle.exchangeRate.effectiveAt)}.
          </small>
        </aside>
      </div>
      <section className="purchase-section" id="purchase">
        <RateStrip bundle={bundle} />
        <div className="section-heading">
          <div>
            <span className="eyebrow">ПАКЕТ, ЦЕНА И СПОСОБ ОПЛАТЫ</span>
            <h2>Где купить.</h2>
          </div>
          <Link to={`/${destinationId}/sources`}>Как проверяли оплату ↗</Link>
        </div>
        <p className="section-note">
          Сравнивайте одинаковые пакеты и время входа. Подтверждённый онлайн-платёж не всегда
          означает оплату всей суммы картой.
        </p>
        {place.ticketProviders.length ? (
          <>
            <div className="ticket-controls">
              <span>{offers.length} способов покупки</span>
              <button
                className="button secondary"
                aria-pressed={russianPaymentOnly}
                onClick={() => setRussianPaymentOnly(!russianPaymentOnly)}
              >
                Подтверждена карта РФ
              </button>
            </div>
            {offers.length === 0 && (
              <p className="unknown-review">
                Для этого места нет предложений с подтверждённой оплатой картой РФ. Покажите все
                способы и проверьте условия у продавца.
              </p>
            )}
            <div className="provider-list">
              {offers.map((offer) => (
                <article className="provider-row" key={offer.providerId}>
                  <div>
                    <h3>{bundle.providers.find((p) => p.id === offer.providerId)!.name}</h3>
                    <small>
                      {offer.linkType === 'catalog'
                        ? 'Предложения этого места'
                        : 'Страница объекта или билета'}
                    </small>
                  </div>
                  <div className="provider-price">
                    <strong>{offer.price ? formatPrice(offer.price) : 'Цена уточняется'}</strong>
                    <small>{offer.price && formatRub(offer.price, bundle.exchangeRate)}</small>
                  </div>
                  <PaymentStatus payment={offer.russianCardSupport} />
                  <a className="button secondary" href={offer.url} target="_blank" rel="noreferrer">
                    Открыть билет
                    <ArrowUpRight size={16} />
                  </a>
                  {offer.price?.note && <p className="provider-price-note">{offer.price.note}</p>}
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="unknown-review">
            <p>
              {place.pricing.kind === 'free'
                ? 'Для этого посещения входной билет не требуется. Отдельные активности могут оплачиваться.'
                : 'Продажа билетов на текущие даты не подтверждена. Проверьте официальный источник.'}
            </p>
          </div>
        )}
        <details className="other-providers">
          <summary>Поиск этого места в других сервисах</summary>
          <p>
            Прямая страница билета у этих продавцов пока не проверена. Ссылки ищут конкретное место
            на сайте продавца; проверьте пакет и дату перед оплатой.
          </p>
          {bundle.providers
            .filter(
              (p) =>
                !['official', ...place.ticketProviders.map((v) => v.providerId)].includes(p.id),
            )
            .map((provider) => (
              <div className="other-provider" key={provider.id}>
                <a
                  href={`https://www.google.com/search?${new URLSearchParams({ q: `site:${new URL(provider.website).hostname} ${place.name} ${bundle.destination.name} tickets` })}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Найти в {provider.name}
                  <ExternalLink size={15} />
                </a>
                <PaymentStatus payment={provider.russianCardSupport} />
              </div>
            ))}
        </details>
      </section>
      <section className="detail-map-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">СОРИЕНТИРУЙТЕСЬ НА МЕСТЕ</span>
            <h2>Где это и что вокруг.</h2>
          </div>
          <a
            className="button secondary"
            href={`https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}&travelmode=walking`}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation size={16} />
            Построить маршрут
          </a>
        </div>
        <LazyMap
          bundle={bundle}
          places={bundle.places}
          selectedId={selectedId ?? place.id}
          onSelect={setSelectedId}
        />
        <p className="fine-print">
          {formatCoordinates(place.coordinates)} · {place.coordinateNote}
        </p>
      </section>
      <section className="nearby-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ПРОДОЛЖИТЕ ОТКРЫВАТЬ</span>
            <h2>Что рядом.</h2>
          </div>
          <span className="fine-print">Расстояния по прямой, не длина маршрута</span>
        </div>
        <div className="nearby-grid">
          {nearby.map(({ place: other, distance }) => (
            <PlaceCard key={other.id} place={other} bundle={bundle} distance={distance} />
          ))}
        </div>
      </section>
    </main>
  )
}
