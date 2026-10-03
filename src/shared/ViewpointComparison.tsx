import { Link } from 'react-router-dom'
import type { DestinationBundle } from '../domain/model'
import { formatDuration, formatPrice, formatRub } from './format'

export default function ViewpointComparison({ bundle }: { bundle: DestinationBundle }) {
  const choices = [
    ['dubai-frame', 'Старый и новый город; доступный первый выбор.'],
    ['the-view-at-the-palm', 'Рисунок Пальмы с высоты; другой ракурс города.'],
    ['sky-views', 'Бурдж-Халифа в кадре; активности зависят от пакета.'],
    ['burj-khalifa', 'Знаменитая высота; большой бюджет и запас на очередь.'],
  ]
  return (
    <details className="viewpoint-comparison">
      <summary>Как выбрать смотровую и не купить несколько похожих впечатлений</summary>
      <p>
        Для нашей первой поездки удобно начать с одной. Порядок каталога учитывает доступные отзывы,
        наши обязательные места, цену и время; это подборка для нас, а не мировой рейтинг туристов.
        Источники и даты отзывов есть в карточках мест.
      </p>
      <div className="comparison-scroll">
        <table>
          <thead>
            <tr>
              <th>Место</th>
              <th>Билет на человека</th>
              <th>Время</th>
              <th>Почему выбрать</th>
            </tr>
          </thead>
          <tbody>
            {choices.map(([slug, reason]) => {
              const place = bundle.places.find((place) => place.slug === slug)!
              return (
                <tr key={slug}>
                  <td>
                    <Link to={`/dubai/place/${slug}`}>{place.nameRu}</Link>
                  </td>
                  <td>
                    {formatPrice(place.pricing)}
                    <br />
                    <small>{formatRub(place.pricing, bundle.exchangeRate)}</small>
                  </td>
                  <td>
                    {formatDuration(place.duration)}
                    <br />
                    <small>
                      + {place.queue?.minutes}–{place.queue?.peakMinutes} мин ожидания
                    </small>
                  </td>
                  <td>{reason}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="fine-print">
        Цены «от», обычный вход. Время и очередь — ориентир для плана; обзор зависит от погоды.
        Закатные и ускоренные билеты могут стоить дороже.
      </p>
    </details>
  )
}
