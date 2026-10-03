import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { images } from '../content/registry'
import { useDestinationBundle } from '../app/ExchangeRates'
import RateStrip from '../shared/RateStrip'
import Sources from '../shared/Sources'
import { formatDate } from '../shared/format'
import { paymentLabels } from '../shared/labels'

export default function SourcesPage() {
  const { destinationId = '' } = useParams()
  const bundle = useDestinationBundle(destinationId)
  if (!bundle)
    return (
      <main className="container empty" id="main">
        <h1>Направление не найдено</h1>
        <Link to="/">К путешествиям</Link>
      </main>
    )
  const usedImages = [
    ...new Set([
      bundle.destination.heroImageId,
      ...bundle.places.flatMap((p) => [
        ...(p.imageId ? [p.imageId] : []),
        ...p.gallery.map((photo) => photo.imageId),
      ]),
    ]),
  ]
  return (
    <main className="sources-page container" id="main">
      <Link className="text-button" to={`/${destinationId}`}>
        <ArrowLeft size={17} />К местам
      </Link>
      <span className="eyebrow">ЧТО ПРОВЕРЕНО И ГДЕ ПОСМОТРЕТЬ</span>
      <h1>
        Источники
        <br />и актуальность.
      </h1>
      <p className="place-lead">
        Здесь собраны сайты мест, билеты и отзывы, которыми мы пользуемся при подготовке поездки.
      </p>
      <div className="sources-intro">
        <p>
          Исследование мест:{' '}
          {formatDate(
            bundle.places
              .map((place) => place.updatedAt)
              .sort()
              .at(-1)!,
          )}
          . Цены указаны в валюте назначения, рублёвые суммы — ориентировочный пересчёт по
          указанному источнику курса. Даты поездки: {formatDate(bundle.trip.startDate)} —{' '}
          {formatDate(bundle.trip.endDate)}.
        </p>
        <p>
          Географические точки обозначают объекты или прогулочные зоны, а не гарантированный вход.
          Длительность помогает прикинуть день: можно задержаться или уйти раньше. Отзывы отделены
          от официальных сведений; для части мест надёжной выборки нет.
        </p>
      </div>
      <section>
        <h2>Оплата: что именно подтверждено.</h2>
        <p className="section-note">
          «Можно оплатить картой РФ» означает подтверждение сервиса для онлайн-платежа. Для
          предоплаты и остатка, конкретного банка, товара и даты могут действовать разные условия.
        </p>
        <div className="payment-guide">
          {bundle.providers.map((p) => (
            <article key={p.id}>
              <h3>
                <a href={p.website} target="_blank" rel="noreferrer">
                  {p.name}
                  <ExternalLink size={15} />
                </a>
              </h3>
              <strong className={`status-text ${p.russianCardSupport.status}`}>
                {paymentLabels[p.russianCardSupport.status]}
              </strong>
              <p>{p.russianCardSupport.note}</p>
              <Sources bundle={bundle} ids={p.russianCardSupport.sourceIds} />
            </article>
          ))}
        </div>
        {bundle.paymentRestrictions.map((restriction) => (
          <div className="availability-alert" key={restriction.title}>
            <div>
              <strong>{restriction.title}</strong>
              <p>{restriction.support.note}</p>
              <Sources bundle={bundle} ids={restriction.support.sourceIds} />
            </div>
          </div>
        ))}
      </section>
      <section>
        <h2>Курс и климат.</h2>
        <RateStrip bundle={bundle} />
        <p className="section-note">
          1 {bundle.exchangeRate.baseCurrency} = {bundle.exchangeRate.rate}{' '}
          {bundle.exchangeRate.quoteCurrency}; дата действия{' '}
          {formatDate(bundle.exchangeRate.effectiveAt)}. Комиссии банка и курс продавца могут
          отличаться.
        </p>
        <Sources
          bundle={bundle}
          ids={[...bundle.exchangeRate.sourceIds, ...bundle.destination.climate.sourceIds]}
        />
      </section>
      <section>
        <h2>Первичные источники и опыт путешественников.</h2>
        <Sources bundle={bundle} ids={bundle.sources.map((s) => s.id)} />
      </section>
      <section>
        <h2>Фотографии и лицензии.</h2>
        <p className="section-note">
          Локальные WebP — уменьшенные версии фотографий Wikimedia Commons. Авторство и лицензия
          сохранены для каждого файла. Для объектов без подходящего фото использован подписанный
          общий вид направления.
        </p>
        <ul className="source-list">
          {usedImages.map((id) => {
            const image = images[id]
            return (
              <li key={id}>
                <a href={image.sourceUrl} target="_blank" rel="noreferrer">
                  {image.alt}
                  <ExternalLink size={14} />
                </a>
                <small>
                  {image.author} ·{' '}
                  <a href={image.licenseUrl} target="_blank" rel="noreferrer">
                    {image.license}
                  </a>{' '}
                  · WebP, изменение размера
                </small>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
