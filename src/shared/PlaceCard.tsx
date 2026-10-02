import { ArrowUpRight, Heart, MapPin, Clock, CreditCard } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import type { DestinationBundle, Place } from '../domain/model'
import { usePreferences } from '../app/Preferences'
import { formatDuration, formatPrice, formatRub, formatDistance } from './format'
import { categoryLabels } from './labels'
import Photo from './Photo'
import { parseFilters, serializeFilters } from '../domain/filters'

export function FavoriteButton({ place }: { place: Place }) {
  const { favorites, toggleFavorite } = usePreferences()
  const active = favorites.includes(place.id)
  return (
    <button
      className={`favorite-button ${active ? 'is-saved' : ''}`}
      aria-label={`${active ? 'Убрать из избранного' : 'Сохранить'}: ${place.nameRu}`}
      aria-pressed={active}
      onClick={() => toggleFavorite(place.id)}
    >
      <Heart size={19} fill={active ? 'currentColor' : 'none'} />
    </button>
  )
}
export default function PlaceCard({
  place,
  bundle,
  selected = false,
  onSelect,
  distance,
}: {
  place: Place
  bundle: DestinationBundle
  selected?: boolean
  onSelect?: () => void
  distance?: number
}) {
  const [params] = useSearchParams()
  const mapParams = serializeFilters(parseFilters(params))
  mapParams.set('selected', place.id)
  const area = bundle.areas.find((a) => a.id === place.areaId)!
  const href = `/${bundle.destination.id}/place/${place.slug}`
  const ruPayment = place.ticketProviders.some((p) => p.russianCardSupport.status === 'confirmed')
  return (
    <article className={`place-card ${selected ? 'selected' : ''}`} data-place-id={place.id}>
      <div className="card-media">
        {onSelect ? (
          <button
            className="media-link"
            aria-label={`На карте: ${place.nameRu}`}
            onClick={onSelect}
          >
            <Photo imageId={place.imageId} alt={place.imageNote ?? place.nameRu} />
          </button>
        ) : (
          <Link className="media-link" to={href}>
            <Photo imageId={place.imageId} alt={place.imageNote ?? place.nameRu} />
          </Link>
        )}
        <FavoriteButton place={place} />
        {place.availability.status === 'temporarily-closed' ? (
          <span className="image-label closed">Экспозиции закрыты</span>
        ) : place.tags.includes('must-see') ? (
          <span className="image-label">Стоит увидеть</span>
        ) : place.pricing.kind === 'free' ? (
          <span className="image-label">Без билета</span>
        ) : null}
      </div>
      <div className="card-eyebrow">
        <span>{categoryLabels[place.categories[0]]}</span>
        <span>{distance !== undefined ? formatDistance(distance) : area.name}</span>
      </div>
      <h3>
        <Link to={href}>
          {place.nameRu}
          <ArrowUpRight size={19} />
        </Link>
      </h3>
      <p className="card-description">{place.shortDescription}</p>
      <div className="card-meta">
        <span>
          <Clock size={14} />
          {formatDuration(place.duration)}
        </span>
        {ruPayment && (
          <span title="Подтверждён онлайн-платёж; условия остатка смотрите в предложении">
            <CreditCard size={14} />
            Карта РФ · онлайн
          </span>
        )}
      </div>
      <div className="card-footer">
        <div>
          <strong>{formatPrice(place.pricing)}</strong>
          <small>{formatRub(place.pricing, bundle.exchangeRate)}</small>
        </div>
        {onSelect ? (
          <button className="text-button" onClick={onSelect}>
            <MapPin size={15} />
            На карте
          </button>
        ) : (
          <Link className="text-button" to={`/${bundle.destination.id}/map?${mapParams}`}>
            <MapPin size={15} />
            На карте
          </Link>
        )}
      </div>
    </article>
  )
}
