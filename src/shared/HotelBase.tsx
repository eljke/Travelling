import { Hotel, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DestinationBundle, Place } from '../domain/model'
import { formatTrip, formatDistance } from './format'
import { distanceBetween } from '../domain/geo'

// oxlint-disable-next-line react/only-export-components
export function directionsUrl(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode = 'driving',
) {
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', origin: `${origin.lat},${origin.lng}`, destination: `${destination.lat},${destination.lng}`, travelmode: mode })}`
}

export default function HotelBase({ bundle, place }: { bundle: DestinationBundle; place?: Place }) {
  const hotel = bundle.trip.accommodation
  if (!hotel) return null
  return (
    <aside className="hotel-base" aria-label="База поездки">
      <Hotel size={24} />
      <div>
        <span className="eyebrow">ВАША БАЗА В ГОРОДЕ</span>
        <strong>
          <a href={hotel.website} target="_blank" rel="noreferrer">
            {hotel.name} ↗
          </a>
        </strong>
        <p>
          {place
            ? `${formatDistance(distanceBetween(hotel.coordinates, place.coordinates))} от отеля по прямой; дорога будет длиннее.`
            : `${formatTrip({ startDate: bundle.trip.arrivalDate ?? bundle.trip.startDate, endDate: bundle.trip.departureDate ?? bundle.trip.endDate })} Выезды: ${formatTrip(bundle.trip)}`}
        </p>
      </div>
      {place ? (
        <a
          className="button secondary"
          href={directionsUrl(hotel.coordinates, place.coordinates)}
          target="_blank"
          rel="noreferrer"
        >
          <Navigation size={16} />
          От отеля на машине
        </a>
      ) : (
        <div className="plan-actions">
          <Link className="button secondary" to={`/${bundle.destination.id}?sort=hotel`}>
            Ближе к отелю
          </Link>
          <Link className="button dark-button" to={`/${bundle.destination.id}/plan`}>
            Собрать маршрут
          </Link>
        </div>
      )}
    </aside>
  )
}
