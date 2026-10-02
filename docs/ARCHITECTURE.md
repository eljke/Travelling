# Архитектура

## Решения и content model

Статический клиент; основная сущность — Place. Исследованный контент поставляется со сборкой, карта запрашивает публичные OpenFreeMap ресурсы. Курсы валют обновляются отдельно. Нет backend, секретов, accounts или live ticket API. React отвечает за представление, Router — за URL, domain utilities — за чистую логику. Специфика города находится в его content module.

```text
Country → Destination → Area → Place
              ├─ TripContext
              ├─ ExchangeRate
              ├─ TicketProvider[]
              └─ SourceReference[]
```

`src/domain/model.ts` содержит Zod schemas и выведенные TypeScript types. Bundle объединяет одну страну/город, поездку, районы, места, providers, sources и курс. Города одной страны могут повторно использовать country id. Отдельная нормализованная база для текущего объёма не нужна.

Place ссылается на area/destination/image/source ids. Цена различает free, fixed, from, unknown; variants — adult/child/standard/premium/combination. Предложение провайдера хранит собственные цену и платёжные условия. PaymentSupport содержит status, scope, note, checkedAt, sourceIds; предоплата не означает оплату всего заказа. ReviewInsights отделяет субъективный опыт и сохраняет описание выборки. Duration/best time — редакционные ориентиры, hours/availability имеют самостоятельные metadata.

Registry валидирует данные при загрузке; validate:content проверяет также файлы фото. Schemas отклоняют противоречивые цены, координаты вне диапазона, дубли id/slug, неизвестные providers/areas/sources и неверные даты поездки. Ошибка контента не маскируется пустым каталогом.

## Routing

HashRouter: `/`, `/:destinationId`, `/:destinationId/map`, `/:destinationId/place/:slug`, `/:destinationId/sources`. Hash не отправляется серверу; GitHub Pages всегда отдаёт index.html. Vite base `./` поддерживает assets и worker в поддиректории.

Поиск, area/category/price/duration/tag, favorites, sort и selected marker хранятся в hash query. Catalog/map toggle сохраняет фильтры; изменение фильтра заменяет текущую history entry. Detail добавляет запись; back использует history или каталог для прямой ссылки. Scroll positions сохраняются в памяти по pathname. Неизвестные направления/места имеют явный empty state.

## State и persistence

- URL — поиск и фильтры.
- Preferences context — favorites, theme, storage error.
- Component state — pagination, раскрытие фильтров и разрешённая пользователем геопозиция.
- Immutable registry — исследованные данные.

`src/shared/persistence.ts` изолирует localStorage. Избранное имеет версионированный ключ; повреждённое/запрещённое хранилище не мешает текущей сессии. Storage event синхронизирует избранное между вкладками. Геопозиция не сохраняется и запрашивается только кнопкой; сортировка использует расстояние по прямой.

Cloud storage заменит persistence и provider, не карточки. Асинхронное хранилище потребует загрузочного состояния и разрешения конфликтов — сейчас это не реализовано.

ExchangeRates context получает daily JSON со своего домена, затем при устаревании — CBR XML Daily API. Schemas валидируют внешний вход, нормализуют Nominal и выбирают действующий курс вместо завтрашнего. useDestinationBundle возвращает bundle с текущим курсом и отдельным runtime source; исследования цен и их timestamps сохраняются. Cache хранит только проверенные положительные значения с датами, отказ сети виден. Workflow ежедневно обновляет public/exchange-rates.json и dist без ежедневных Git-коммитов. Браузер перепроверяет курс после смены московской даты. USD показан рядом с базовой валютой.

## Map abstraction и география

LazyMap загружает renderer возле viewport. PlaceMap получает bundle, filtered places, selectedId, onSelect и optional userPosition; страницы не управляют MapLibre API. GeoJSON source кластеризуется, categories задают marker styles, selection ring и popup отражают выбор. Callback возвращает выбор в URL или detail state. Каталог и markers получают один результат фильтрации.

Worker — локальный asset, style/tiles/fonts/sprites — публичные OpenFreeMap ресурсы. Attribution остаётся видимым. HTTP/WebGL отказ даёт fallback с повтором и OpenStreetMap. HTML-список позволяет выбирать места с клавиатуры.

distanceBetween/sortByDistance/getNearbyPlaces используют Haversine. Nearby исключает origin и другие destinations, сортирует копию массива и возвращает расстояние. Это не road routing. Для 42 мест проход и сортировка достаточны; spatial index не нужен.

## UI и производительность

Tokens задают surfaces, typography, spacing, radius, shadows и light/dark/system. CSS отвечает за grid, tablet/mobile, горизонтальные карточки карты, sticky controls, safe-area и reduced motion. Системные шрифты не требуют внешней загрузки.

Страницы и MapLibre разделены dynamic imports. Фото — локальные WebP 640/1280, srcset, фиксированные размеры, lazy loading, fallback; обложка priority. Каталог показывает 12 результатов с догрузкой, карта — все. Нет trackers. Полная карта существенно тяжелее каталога и зависит от tile service.

## Extensibility

Tokyo добавляется через country/destination/trip/areas/places/providers/sources, фото и регистрацию bundle. UI/routing не меняются. Bundle задаёт валюту, часовой пояс, featured area и её comparisons. Labels/formatters находятся в shared, currency/date/distance используют Intl; текущий язык — русский.

Новый provider — запись, а не поле Place. Новый price variant использует существующие type и label. Принципиально новая category требует обновить enum, label и цвет карты. Явный небольшой список предпочтительнее системы plugins.

## Проверки и доставка

Unit проверяют денежные/географические границы, реальный контент, фильтры, URL и schemas. E2E используют production build, desktop Chromium и мобильную эмуляцию: переходы, reload, favorites, detail, evidence, nearby, live map, отказ сети/storage, theme и overflow. Live map требует публичный сервис; отдельный тест блокирует его. Эмуляция не заменяет физическую проверку Safari/iPhone.

GitHub Actions выполняет lint, formatting, typecheck, unit, build и E2E до Pages. Удалённое выполнение и конкретный URL проверяются после появления репозитория.

## Future evolution

Accounts/cloud favourites заменят persistence; visited places расширят пользовательское состояние. Itinerary builder станет отдельной моделью ссылок на Place. Offline/PWA требует стратегии кэширования и лицензирования тайлов. Collaborative trips — синхронизации и доступа. Ticket monitoring потребует ingestion с обновляемым metadata. При росте числа городов контент можно загрузить отдельными chunks. Для публичного SEO и отдельных previews — prerender/SSR.
