import { ArrowRight, ArrowUpRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { destinations } from '../content/registry'
import { formatTrip } from '../shared/format'
import Photo from '../shared/Photo'

export default function HomePage() {
  return (
    <main className="home container" id="main">
      <div className="home-intro">
        <span className="eyebrow">МЕСТА, КОТОРЫЕ ОСТАЮТСЯ С ВАМИ</span>
        <h1>
          Чуть дальше
          <br />
          привычного.
        </h1>
        <p>
          Личный путеводитель по местам, ради которых хочется выйти из отеля. Меньше спешки. Больше
          открытий.
        </p>
      </div>
      <div className="home-section-title">
        <h2>Ваши путешествия</h2>
        <span>Начните с одного города</span>
      </div>
      <div className="trip-grid">
        {Object.values(destinations).map((bundle) => (
          <Link className="trip-card" key={bundle.destination.id} to={`/${bundle.destination.id}`}>
            <Photo
              imageId={bundle.destination.heroImageId}
              alt={`${bundle.destination.nameRu} — активная поездка`}
              priority
            />
            <div className="trip-card-top">
              <span>АКТИВНАЯ ПОЕЗДКА</span>
              <ArrowUpRight size={24} />
            </div>
            <div className="trip-card-bottom">
              <span>
                <MapPin size={14} />
                {bundle.country.nameRu}
              </span>
              <h2>{bundle.destination.name}</h2>
              <p>{formatTrip(bundle.trip)}</p>
              <div>
                <span>{bundle.places.length} мест для открытия</span>
                <ArrowRight size={22} />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p className="home-note">Ваш следующий город начнётся здесь.</p>
    </main>
  )
}
