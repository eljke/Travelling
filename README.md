# elsewhere — личный путеводитель

Статическое travel-приложение: каталог, карта, фильтры, избранное, цены в местной валюте и рублях, покупка билетов и проверяемые источники. Первая поездка — Dubai, UAE, **6–10 октября 2026**. В каталоге 42 места в 16 районах, включая JA / Jebel Ali. Исследование: 2 октября 2026 года.

Сайт: [eljke.github.io/Travelling](https://eljke.github.io/Travelling/). Светлая, тёмная и системная темы; выбор сохраняется.

## Запуск

Нужен Node.js 22.12+ и npm. Откройте терминал в директории проекта:

```sh
npm ci
npm run dev
```

Основные маршруты: `/#/`, `/#/dubai`, `/#/dubai/map`, `/#/dubai/place/burj-khalifa`, `/#/dubai/sources`.

```sh
npm run build
npm run preview
```

Готовый сайт находится в `dist/`. Для просмотра нужен HTTP-сервер; открытие через `file://` не поддерживается.

## Стек

- React 19, strict TypeScript 6, Vite 8; npm lockfile для воспроизводимой установки.
- React Router с hash routing: обновление detail работает на GitHub Pages без серверного fallback.
- MapLibre GL 6 + [OpenFreeMap](https://openfreemap.org/): векторная карта, clustering, attribution, без секретных ключей. Отдельный модуль загружается рядом с viewport.
- Zod 4 проверяет контент и связи между сущностями.
- CSS variables, системные шрифты, Lucide, локальные responsive WebP с авторством и лицензиями.
- Vitest и Playwright.

Подробности: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Структура

```text
src/app/                    preferences, error boundary
src/pages/                  trips, destination, place, sources
src/domain/                 schemas, filtering, geography
src/features/map/           lazy wrapper and MapLibre renderer
src/shared/                 cards, photos, formatters, persistence
src/content/destinations/   researched destination bundles
src/content/images.json     photograph attribution manifest
src/styles/tokens.css       design tokens and themes
public/images/              640/1280 WebP
scripts/                    validation and image refresh
tests/                      unit and browser checks
```

## Данные

Dubai: `src/content/destinations/dubai.ts`. Модуль хранит страну, город, поездку, курс, районы, источники, providers и исходные записи мест. Функции собирают `DestinationBundle`; `src/content/registry.ts` проверяет и регистрирует его. `src/domain/model.ts` содержит schemas и выведенные types.

Динамические значения имеют `checkedAt` и `sourceIds`. `accessedAt` — дата проверки страницы, а не публикации отзыва. Дата исследования не подтверждает наличие билета на дату поездки.

### Новая страна и направление

1. Создайте `src/content/destinations/tokyo.ts` с `country` (Japan / JP), `destination`, `trip`, `exchangeRate`, `areas`, `providers`, `sources`, `places`, следуя `destinationSchema`.
2. Укажите валюту, часовой пояс, центр, изображение. `featuredAreaId` выбирает район для редакционного блока, `featuredAreaComparisons` — районы для сравнения расстояний.
3. Импортируйте модуль в registry и добавьте в массив рядом с `rawDubai`. Destination id должен быть уникальным; города одной страны могут использовать одинаковый `country.id`.
4. Добавьте фотографии в `images.json` и `public/images/`, выполните validation и build.

Корневая страница покажет новую поездку автоматически. Каталог, карта, detail и sources используют данные и параметры маршрута; менять UI не требуется.

### Новое место

Добавьте запись в `seeds` Dubai или готовый `Place` другого bundle. Обязательны уникальные id/slug, существующий район, координаты, фото, описание, категория, длительность, официальный сайт и источники. Неизвестная цена — `kind: 'unknown'` без amount; бесплатная — `kind: 'free', amount: 0`. `reviewInsights` хранит субъективные выводы, ссылки и описание выборки; при недостатке материала блок отсутствует, UI объясняет пробел.

Nearby вычисляется по Haversine. Координаты — ориентир, не гарантированный вход; расстояния — по прямой, не время поездки.

### Курс, цены и часы

AED и USD обновляются ежедневно из данных ЦБ через [CBR XML Daily](https://www.cbr-xml-daily.ru/). Workflow в 00:10 по Москве получает JSON командой `npm run update:rates` и публикует обновлённый файл вместе с сайтом. Браузер читает его со своего домена; если файл старый, запрашивает API напрямую. Открытая вкладка перепроверяет данные после смены московской даты и при возвращении на страницу.

Дата действия курса всегда видна. Если API уже опубликовал завтрашний курс, используется Previous за текущую дату; в выходные остаётся последний действующий курс. При отказе сети сохраняется последний проверенный курс в localStorage; при отсутствии кэша — резерв исследования с явной пометкой. Резерв в `exchangeRate`: **1 AED = 22,6672 RUB**, **1 USD = 83,2454 RUB** на 02.10.2026. Для ручного обновления резерва измените rate/usdRub, effectiveAt, checkedAt и source. Для другого города задайте baseCurrency; JSON учитывает Nominal, например 100 японских иен. Formatters централизованы в `src/shared/format.ts`. Это не курс списания банка.

Цены Dubai задаются в seeds и блоке сборки вариантов. После проверки официального ticket page обновите пакет, amount, variants, примечание и metadata. Проверяйте возраст, слот и условия отмены; не сравнивайте разные пакеты как одинаковые. Часы и availability обновляются отдельно. При изменении одного утверждения не меняйте даты всех остальных источников.

### Новый ticket provider

Добавьте в `providers` id, name, website и `russianCardSupport`. В `place.ticketProviders` добавьте providerId, URL, linkType, проверенную цену или её отсутствие, payment metadata и checkedAt. В Dubai `seed.offer` создаёт прямое предложение; дополнительные предложения задаются при сборке offers. Ссылка на каталог не подтверждает билет конкретного места.

Статусы: `confirmed`, `likely`, `unavailable`, `unknown`. Scope различает онлайн-оплату, предоплату и ограничения российских Visa/Mastercard. Подтверждение одного сервиса нельзя переносить на все продукты или карты.

### Фотографии

Фото лицензированы CC BY, CC BY-SA, CC0 или public domain. `images.json` хранит автора, лицензию, оригинал, дату и преобразование в WebP; detail и sources показывают подписи. Архивные снимки и виды окрестностей отмечены.

Опциональное обновление требует Python и Pillow:

```sh
python -m pip install Pillow
python scripts/fetch-images.py --refresh --only hero
```

Оригиналы задаются в `SELECTED_FILES`. После загрузки осмотрите фото: автоматический поиск может вернуть другой объект. Скрипт не нужен для запуска или сборки.

## Проверки

```sh
npm run typecheck
npm run lint
npm run format:check
npm run validate:content
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

E2E используют production build и сами запускают preview на порту 4173. Live map smoke требует доступного OpenFreeMap; отдельный тест проверяет отказ сети. На Windows реальные tile requests пересылаются через Playwright HTTP context, чтобы обойти зависание локального Chromium transport; на Linux браузер загружает их напрямую. Ошибки сохраняют screenshot/trace в `test-results/`.

`npm run format` форматирует проект. Validation проверяет schemas, уникальность id/slug, source/provider/geography references и наличие фото. Unit tests проверяют деньги, Haversine, nearby, фильтры, URL и некорректные данные.

## GitHub Pages

1. Создайте репозиторий и загрузите проект в `main`.
2. **Settings → Pages → Build and deployment → GitHub Actions**.
3. `.github/workflows/deploy.yml` запускает проверки, собирает dist и публикует Pages; доступен ручной `workflow_dispatch`.

`base: './'` оставляет assets относительными: поддерживаются корень и `/repository/`. URL: `https://owner.github.io/repository/#/dubai/place/burj-khalifa`. Для своего домена настройте его в Pages и обновите OpenGraph URL/image в index.html. Секреты и backend не требуются. GitHub может запускать scheduled workflows с задержкой; браузерный запрос API компенсирует устаревший файл. Failed workflow сохраняет предыдущую работающую публикацию.

## Неизвестные данные и ограничения

- Цены/часы — снимок исследования. Слоты 6–10 октября не подтверждены автоматически. Museum of the Future сообщает о закрытии экспозиций; дата открытия неизвестна. Для LEGOLAND и ряда парков нужно проверить выбранный день.
- JA day pass, водные активности и часть тарифов оставлены неизвестными. Riverland не помечен бесплатным без текущего подтверждения.
- Sputnik8 подтверждает онлайн-платёж картой РФ; Tripster — онлайн-часть заказа. Остаток может оплачиваться отдельно. Trip.com зависит от продукта/checkout. Приём карт РФ в Klook, GetYourGuide, Tiqets, WeGoTrip и на официальных сайтах не подтверждён для всех систем.
- Review summaries есть там, где доступный русскоязычный материал позволяет обоснованный разбор. Старые отзывы обозначены и не подтверждают текущие цены или работу.
- Карта требует сети и WebGL; при отказе доступны каталог, координаты и внешние маршруты. Offline PWA, accounts и itinerary planner не реализованы.
- Titles меняются при навигации. Hash SPA не создаёт отдельных серверных OpenGraph previews; публичное SEO потребует prerender/SSR.
