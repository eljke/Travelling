import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  CalendarDays,
  MapPin,
  Route,
  ShoppingBag,
  Heart,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { destinations } from '../content/registry'
import { usePreferences } from '../app/Preferences'
import { formatTrip } from '../shared/format'
import Photo from '../shared/Photo'

export default function HomePage() {
  const { plans, favorites } = usePreferences()
  const trip = Object.values(destinations)[0]
  const path = `/${trip.destination.id}`
  const plan = plans[trip.destination.id]
  const chosen = plan?.days.reduce((count, day) => count + day.placeIds.length, 0) ?? 0
  const plannedDays = plan?.days.filter((day) => day.placeIds.length).length ?? 0
  const tools = [
    {
      icon: Route,
      title: 'Собрать день',
      text: 'Когда выезжаем, что успеваем и сколько потратим всей компанией.',
      href: '/plan',
      detail: chosen ? `В плане: ${chosen} мест на ${plannedDays} дней` : 'Начнём с удобного дня',
    },
    {
      icon: Heart,
      title: 'Выбрать места',
      text: 'Смотровые, пляжи, парки и прогулки. Сохраним то, что хочется посетить.',
      href: '',
      detail: `${trip.places.length} мест · в избранном ${favorites.length}`,
    },
    {
      icon: ShoppingBag,
      title: 'Заглянуть в ТЦ',
      text: 'Покупки, обед и прохлада. Найдём молл по пути, чтобы не ездить дважды.',
      href: '/shopping',
      detail: 'От Dubai Mall до аутлетов',
    },
    {
      icon: Camera,
      title: 'Наши фотографии',
      text: 'Мы в городе: общие кадры, отдельные портреты и истории из поездки.',
      href: '/photos',
      detail: 'С подписями и участниками',
    },
  ]
  return (
    <main className="home family-home container" id="main">
      <section className="family-hero" aria-label="Наша ближайшая поездка">
        <Photo
          imageId={trip.destination.heroImageId}
          alt={`Вечерний ${trip.destination.nameRu}`}
          priority
        />
        <div className="family-hero-content">
          <span className="eyebrow">НАШ ОКТЯБРЬ У МОРЯ</span>
          <h1>
            {trip.destination.nameRu}.<br />
            <em>Вместе.</em>
          </h1>
          <p>
            Пять дней для города, немного приключений и много времени друг для друга. Соберём
            поездку в нашем темпе.
          </p>
          <div className="plan-actions">
            <Link className="button family-primary" to={`${path}/plan`}>
              Собрать день
              <ArrowRight size={18} />
            </Link>
            <Link className="button family-outline" to={`${path}/map`}>
              Посмотреть карту
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <aside className="family-ticket">
          <span className="eyebrow">НАША ПОЕЗДКА</span>
          <div className="family-ticket-dates">
            <CalendarDays size={22} />
            <strong>5–11 октября</strong>
            <span>2026 · Дубай</span>
          </div>
          <div className="family-ticket-group">
            <span>Нас</span>
            <strong>06</strong>
            <span>
              5 взрослых
              <br />и ребёнок 11 лет
            </span>
          </div>
          <div className="family-ticket-hotel">
            <MapPin size={18} />
            <div>
              <span>Живём здесь</span>
              <strong>{trip.trip.accommodation?.name}</strong>
              <small>
                Море и отдых — рядом.
                <br />
                Городские выезды — 6–10 октября.
              </small>
            </div>
          </div>
          <Link className="text-button" to={`${path}/plan`}>
            Открыть нашу поездку
            <ArrowUpRight size={16} />
          </Link>
        </aside>
      </section>
      <section className="family-workspace" aria-label="Инструменты нашей поездки">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ВСЁ В ОДНОМ МЕСТЕ</span>
            <h2>Поездка, в которой удобно всем.</h2>
          </div>
          <span className="family-progress">
            {chosen ? `Уже выбрали ${chosen} мест` : 'Планы можно менять — отпуск наш'}
          </span>
        </div>
        <div className="family-tools">
          {tools.map(({ icon: Icon, ...tool }) => (
            <Link key={tool.title} to={`${path}${tool.href}`}>
              <Icon size={26} strokeWidth={1.5} />
              <span className="family-tool-detail">{tool.detail}</span>
              <h3>
                {tool.title}
                <ArrowUpRight size={18} />
              </h3>
              <p>{tool.text}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="family-picks" aria-label="Идеи для нашей компании">
        <div className="section-heading">
          <div>
            <span className="eyebrow">НЕСКОЛЬКО ИДЕЙ НА НАЧАЛО</span>
            <h2>Один выезд — больше впечатлений.</h2>
          </div>
        </div>
        <div>
          {[
            {
              title: 'Downtown до вечерних фонтанов',
              image: 'fountain-show',
              text: 'Молл, аквариум и Burj Khalifa — рядом.',
              href: `${path}/plan?day=2026-10-06`,
            },
            {
              title: 'Цветы и бабочки в один день',
              image: 'miracle',
              text: 'Два соседних сада. Планируем с 8 октября.',
              href: `${path}/plan?day=2026-10-08`,
            },
            {
              title: 'Снег посреди жаркого октября',
              image: 'ski',
              text: 'Ski Dubai и Mall of the Emirates за один приезд.',
              href: `${path}/place/ski-dubai`,
            },
          ].map((idea) => (
            <Link to={idea.href} key={idea.title}>
              <Photo imageId={idea.image} alt={idea.title} />
              <div>
                <h3>
                  {idea.title}
                  <ArrowUpRight size={18} />
                </h3>
                <p>{idea.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <div className="home-section-title">
        <h2>Наши поездки</h2>
        <span>Начнём с Дубая</span>
      </div>
      <div className="trip-grid">
        {Object.values(destinations).map((bundle) => (
          <Link className="trip-card" key={bundle.destination.id} to={`/${bundle.destination.id}`}>
            <Photo
              imageId={bundle.destination.heroImageId}
              alt={`${bundle.destination.nameRu} — активная поездка`}
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
                <span>{bundle.places.length} мест для нашей компании</span>
                <ArrowRight size={22} />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p className="home-note">Любимые места и наши фотографии останутся здесь после поездки.</p>
    </main>
  )
}
