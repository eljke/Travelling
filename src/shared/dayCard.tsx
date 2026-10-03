import { renderToStaticMarkup } from 'react-dom/server'
import type { DestinationBundle } from '../domain/model'
import type { Itinerary } from '../domain/itinerary'
import {
  clockTime,
  defaultRouteSettings,
  evaluateRoute,
  hoursReminder,
  toMinutes,
} from '../domain/dayRoute'
import type { RouteOrigin, TravelLeg } from '../domain/dayRoute'
import {
  families,
  familyRouteBudget,
  hasFamilyComposition,
  needsTicket,
  ticketChecks,
} from '../domain/families'
import type { BudgetScope } from '../domain/families'
import { images } from '../content/registry'
import { assetUrl, formatDate, formatMoney } from './format'
import { directionsUrl } from './HotelBase'
import { asDataUrl } from './download'
import { version } from '../../package.json'

const styles = `
:root{color-scheme:light dark;--bg:#f4f2eb;--surface:#fff;--text:#243b32;--muted:#57675f;--line:#d5ded7;--accent:#215b48;--warning:#754a09}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,sans-serif;overflow-wrap:anywhere}
main{max-width:760px;margin:auto;padding:24px 16px 48px}header{padding:8px 4px 20px}h1{font-size:clamp(28px,6vw,40px);line-height:1.2;margin:8px 0 20px}h2{font-size:23px;line-height:1.3;margin:12px 0}h3{font-size:18px;margin:12px 0 4px}p{margin:8px 0}
article,.panel{background:var(--surface);border:1px solid var(--line);border-radius:18px;margin:18px 0;overflow:hidden}.body,.panel{padding:20px}.cover{width:100%;height:220px;object-fit:cover;display:block}.muted,small{color:var(--muted)}.eyebrow{font-size:13px;text-transform:uppercase;letter-spacing:.08em;font-weight:600}.time{font-size:24px;color:var(--accent);font-weight:650}.warning{border-left:3px solid var(--warning);padding:8px 12px;color:var(--warning)}.links{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}a{color:var(--accent);text-underline-offset:3px;padding:4px 0}a:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:4px}ul{padding-left:20px}.checks li{margin:8px 0}.leg{border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px}summary{cursor:pointer;padding:8px 0}footer{padding:8px 4px}.attribution{font-size:13px}
@media(prefers-color-scheme:dark){:root{--bg:#14201a;--surface:#1d2e25;--text:#eef2e9;--muted:#b7c7bb;--line:#405347;--accent:#b0d3bc;--warning:#ffd187}}
@media(max-width:420px){main{padding:16px 12px 32px}.body,.panel{padding:16px}.cover{height:180px}}
@media print{:root{color-scheme:light;--bg:#fff;--surface:#fff;--text:#222;--muted:#444;--line:#bbb;--accent:#222;--warning:#444}main{padding:0;max-width:none}article,.panel{break-inside:avoid;border-radius:0}.cover{height:120px}.links{display:none}details{display:none}@page{size:A4;margin:15mm}}
`

export async function createDayCard(
  day: Itinerary['days'][number],
  bundle: DestinationBundle,
  scope: BudgetScope,
  origin?: RouteOrigin,
  remaining = false,
) {
  const settings = day.settings ?? defaultRouteSettings
  const hotel = bundle.trip.accommodation!
  const places = day.placeIds.map((id) => bundle.places.find((place) => place.id === id)!)
  const route = evaluateRoute(places, bundle, day.date, settings, origin)
  const budget = familyRouteBudget(
    route,
    scope,
    settings,
    day.date,
    bundle.exchangeRate.baseCurrency,
  )
  const photos = await Promise.all(
    places.map(async (place) => {
      const image = place.imageId ? images[place.imageId] : undefined
      if (!image || !image.small.startsWith('images/')) return undefined
      try {
        const response = await fetch(assetUrl(image.small), { signal: AbortSignal.timeout(12000) })
        if (!response.ok) return undefined
        const blob = await response.blob()
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) return undefined
        return { image, data: await asDataUrl(blob) }
      } catch {
        return undefined
      }
    }),
  )
  const money = (amount: number, high?: number) => formatMoney(amount, bundle.exchangeRate, high)
  const mode = (leg: TravelLeg) =>
    ({
      taxi: settings.taxi === 'max' ? 'Hala Max' : 'Такси',
      walk: 'Пешком',
      metro: 'Метро',
      tram: 'Трамвай',
      tour: 'Трансфер тура',
    })[leg.mode]
  const mapUrl = (leg: TravelLeg) =>
    directionsUrl(
      leg.origin,
      leg.destination,
      leg.mode === 'walk'
        ? 'walking'
        : ['metro', 'tram'].includes(leg.mode)
          ? 'transit'
          : 'driving',
    )
  const transit = [...route.stops.map((stop) => stop.leg), route.returnLeg].some((leg) =>
    ['metro', 'tram'].includes(leg.mode),
  )
  const savedAt = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: bundle.destination.timezone,
  }).format(new Date())
  const html = renderToStaticMarkup(
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"
        />
        <title>{formatDate(day.date)} · Маршрут</title>
        <style>{styles}</style>
      </head>
      <body>
        <main>
          <header>
            <p className="eyebrow">
              {bundle.destination.nameRu} · {remaining ? 'Продолжение дня' : 'Маршрут с собой'}
            </p>
            <h1>{formatDate(day.date)}</h1>
            <p>
              <strong>{origin?.name ?? hotel.name}</strong>
            </p>
            {origin && (
              <p className="muted">
                {origin.coordinates.lat.toFixed(5)}, {origin.coordinates.lng.toFixed(5)}
              </p>
            )}
            <p className="time">
              Выезд {settings.start} · в отель до {settings.end}
            </p>
            <p>
              Взрослых: {settings.adults}
              {settings.children > 0 &&
                ` · детей: ${settings.children}${settings.childAge !== undefined ? ` · возраст ${settings.childAge} лет` : ''}`}
              .
            </p>
            <p className="muted">
              Сохранено {savedAt} · время местное, {bundle.destination.timezone} · v{version}.
            </p>
            {remaining && (
              <p>
                Остаток маршрута от выбранной точки. Посещённые места и расходы до неё сюда не
                входят; билеты впереди включены, даже если уже куплены.
              </p>
            )}
          </header>
          {(!route.fits || toMinutes(settings.end) <= toMinutes(settings.start)) && (
            <p className="warning">
              <strong>Маршрут требует правки.</strong> Проверьте часы, вход по билету и возвращение.
              Этот файл сохраняет текущий расчёт.
            </p>
          )}
          <section className="panel" aria-label="Расходы">
            <h2>{hasFamilyComposition(settings) ? families[scope].label : 'Весь состав выезда'}</h2>
            <p>Билеты: {money(budget.ticketCost)}</p>
            <p>Дорога: {money(budget.cost, budget.highCost)}</p>
            <p>
              <strong>
                {remaining ? 'Остаток маршрута' : 'День'}:{' '}
                {money(budget.cost + budget.ticketCost, budget.highCost + budget.ticketCost)}
              </strong>
            </p>
            <p className="muted">
              Без еды и покупок. Цена дороги у остановок — на всех пассажиров.
              {hasFamilyComposition(settings) &&
                scope !== 'both' &&
                ' В этом блоке — доля выбранной семьи.'}{' '}
              Отметка покупки не вычитает цену билета из бюджета.
            </p>
            {route.unknownPrices > 0 && (
              <p className="warning">Без цены: {route.unknownPrices} мест. Итог неполный.</p>
            )}
          </section>
          {route.stops.map((stop, index) => (
            <article key={stop.place.id} aria-label={stop.place.nameRu}>
              {photos[index] && (
                <img className="cover" src={photos[index].data} alt={photos[index].image.alt} />
              )}
              <div className="body">
                <div className="leg">
                  <p className="eyebrow">
                    {mode(stop.leg)} · {stop.leg.minutes} мин
                  </p>
                  <p>
                    <strong>
                      {clockTime(stop.departure)} → {clockTime(stop.arrival)}
                    </strong>{' '}
                    · {money(stop.leg.cost, stop.leg.highCost)} на всех
                  </p>
                  <p className="muted">{stop.leg.detail}</p>
                </div>
                <h2>
                  {index + 1}. {stop.place.nameRu}
                </h2>
                <p className="time">
                  {clockTime(stop.visitStart)}–{clockTime(stop.end)}
                </p>
                <p>{stop.visitMinutes} мин на месте</p>
                {stop.visitStart - stop.queueMinutes > stop.arrival && (
                  <p>
                    Ожидание открытия / входа: {stop.visitStart - stop.queueMinutes - stop.arrival}{' '}
                    мин.
                  </p>
                )}
                {stop.queueMinutes > 0 && (
                  <p>Очередь / подготовка: {stop.queueMinutes} мин до посещения.</p>
                )}
                {settings.slots[stop.place.id] && (
                  <p>
                    <strong>Время входа: {settings.slots[stop.place.id]}</strong>
                  </p>
                )}
                {needsTicket(stop.place, settings, day.date) && (
                  <>
                    <h3>Билеты</h3>
                    <ul className="checks">
                      {ticketChecks(stop.place.id, 'both', settings).map((check) => (
                        <li key={check.key}>
                          <strong>{check.label}</strong>:{' '}
                          {check.checked
                            ? 'билеты куплены'
                            : check.changed
                              ? 'изменились состав или время — проверьте билеты'
                              : 'покупка не отмечена'}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {stop.warnings
                  .filter((warning) => warning !== hoursReminder)
                  .map((warning) => (
                    <p className="warning" key={warning}>
                      {warning}
                    </p>
                  ))}
                {stop.pauseAfter > 0 && (
                  <p>
                    <strong>После посещения: {stop.pauseAfter} мин на еду и отдых.</strong>
                  </p>
                )}
                <p className="muted">
                  {stop.place.coordinates.lat.toFixed(5)}, {stop.place.coordinates.lng.toFixed(5)} ·{' '}
                  {stop.place.coordinateNote}
                </p>
                <div className="links" aria-label="Ссылки требуют интернета">
                  <a href={mapUrl(stop.leg)}>Дорога на карте ↗</a>
                  <a href={stop.place.officialWebsite}>Сайт места ↗</a>
                </div>
                {!photos[index] && <small>Фото не сохранено; маршрут доступен полностью.</small>}
              </div>
            </article>
          ))}
          <section className="panel" aria-label="Возвращение в отель">
            <h2>Возвращение в {hotel.name}</h2>
            <p className="time">
              {clockTime(route.returnDeparture)} → {clockTime(route.returnAt)}
            </p>
            <p>
              {mode(route.returnLeg)} · {route.returnLeg.minutes} мин ·{' '}
              {money(route.returnLeg.cost, route.returnLeg.highCost)} на всех
            </p>
            <p className="muted">{route.returnLeg.detail}</p>
            <p>
              Запас до {settings.end}: {route.slack} мин. Из них резерв — {settings.buffer} мин.
            </p>
            <p>{hotel.address}</p>
            <p>
              {hotel.coordinates.lat.toFixed(5)}, {hotel.coordinates.lng.toFixed(5)}
            </p>
            <div className="links">
              <a href={mapUrl(route.returnLeg)}>Обратная дорога на карте ↗</a>
              <a href={hotel.website}>Сайт отеля ↗</a>
            </div>
          </section>
          {transit && (
            <section className="panel">
              <h2>Оплата метро и трамвая</h2>
              <p>
                Каждому нужна своя nol, включая ребёнка. Silver: {money(25)} с балансом {money(19)}.
                Минимум на карте — {money(7.5)}. Прикладываем при входе и выходе; у трамвая — на
                платформе. Выпуск новых карт учтён в дороге.
              </p>
            </section>
          )}
          <footer>
            <p>
              <strong>Это копия плана на момент скачивания.</strong> Изменения на сайте сюда не
              попадут. Карты и сайты требуют интернета; сохранённая карточка доступна без сети.
            </p>
            <p className="muted">
              Дорога и очереди — оценка без живых пробок. Часы и билеты сверяем перед выездом.
              Сохраните QR-коды продавца отдельно: эта карточка их не заменяет.
            </p>
            <p className="muted">
              Курс: 1 {bundle.exchangeRate.baseCurrency} ≈ {bundle.exchangeRate.rate.toFixed(2)} ₽
              на {formatDate(bundle.exchangeRate.effectiveAt)}.
            </p>
            {photos.some(Boolean) && (
              <details className="attribution">
                <summary>Источники фотографий</summary>
                {photos.map(
                  (photo, index) =>
                    photo && (
                      <p key={places[index].id}>
                        {places[index].nameRu}:{' '}
                        <a href={photo.image.sourceUrl}>{photo.image.author}</a> ·{' '}
                        <a href={photo.image.licenseUrl}>{photo.image.license}</a>.{' '}
                        {photo.image.adaptation}
                      </p>
                    ),
                )}
              </details>
            )}
          </footer>
        </main>
      </body>
    </html>,
  )
  return {
    blob: new Blob(['<!doctype html>', html], { type: 'text/html;charset=utf-8' }),
    missingPhotos: photos.filter((photo) => !photo).length,
  }
}
