import { ticketLinks, ticketLinksCheckedAt } from './dubai-tickets'
import { priceUpdates } from './dubai-prices'
import { galleries, placePhotos } from './dubai-galleries'
import { extraAreas, extraPlaces } from './dubai-extra'
import hoursSnapshot from '../../../public/place-hours.json'
import { hoursFeedSchema } from '../../domain/openingHours'
import { currentReviewSources, reviewUpdates } from './dubai-reviews'

const checkedAt = '2026-10-02'
const source = (id: string, title: string, url: string, type = 'official', note?: string) => ({
  id,
  title,
  url,
  type,
  accessedAt: checkedAt,
  ...(note ? { note } : {}),
})
const sources = [
  {
    ...source(
      'ja-palm-tree-court',
      'JA Palm Tree Court • отель и расположение',
      'https://www.jaresortshotels.com/dubai/ja-palm-tree-court',
    ),
    accessedAt: '2026-10-03',
  },
  source(
    'burj',
    'At the Top • Silver, уровни 124/125',
    'https://ticket.atthetop.ae/tickets/book-tickets/',
  ),
  source(
    'mall',
    'Visit Dubai • Dubai Mall',
    'https://www.visitdubai.com/places-to-visit/dubai-mall',
  ),
  source(
    'fountain',
    'Visit Dubai • Dubai Fountain',
    'https://www.visitdubai.com/en/places-to-visit/the-dubai-fountain',
  ),
  source(
    'aquarium',
    'Dubai Aquarium • билеты',
    'https://www.thedubaiaquarium.com/tickets/book-tickets/',
  ),
  source(
    'aquarium-guide',
    'Visit Dubai • стоимость Aquarium',
    'https://www.visitdubai.com/articles/dubais-photogenic-spots',
  ),
  source(
    'skyviews',
    'Sky Views • Observatory и Edge Walk',
    'https://www.skyviewsdubai.com/booking/?experience=914',
  ),
  source(
    'opera',
    'Dubai Opera • Grand Tour',
    'https://www.dubaiopera.com/en/visit/tours?ID=2dc786db-8283-ee11-8179-6045bd6a52a8',
  ),
  source(
    'canal',
    'Visit Dubai • Dubai Water Canal',
    'https://www.visitdubai.com/en/places-to-visit/dubai-water-canal',
  ),
  source(
    'free-guide',
    'Visit Dubai • бесплатные прогулки',
    'https://www.visitdubai.com/en/articles/top-free-things-to-do-in-dubai',
  ),
  source(
    'future',
    'Museum of the Future • временное закрытие',
    'https://museumofthefuture.ae/en',
    'official',
    'Экспозиции временно закрыты. Старые тарифы не используются.',
  ),
  source(
    'difc',
    'Visit Dubai • DIFC Gate Avenue',
    'https://www.visitdubai.com/places-to-visit/difc-gate-avenue',
  ),
  source('frame', 'Dubai Frame • часы и тарифы', 'https://www.dubaiframe.ae/en/plan-your-visit'),
  source(
    'zabeel',
    'Visit Dubai • Zabeel Park',
    'https://www.visitdubai.com/en/places-to-visit/zabeel-park',
  ),
  source(
    'citywalk',
    'Visit Dubai • City Walk',
    'https://www.visitdubai.com/places-to-visit/city-walk',
  ),
  source(
    'greenplanet',
    'The Green Planet • Day Pass',
    'https://www.thegreenplanetdubai.com/en/day-pass?adventure=day-pass&date=',
  ),
  source(
    'mosque',
    'Jumeirah Mosque • публичные визиты',
    'https://www.jumeirahmosque.ae/mosque-visit-public/',
  ),
  source(
    'jumeirah',
    'Visit Dubai • Umm Suqeim',
    'https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/umm-suqeim',
  ),
  source(
    'beaches',
    'Visit Dubai • пляжи и доступ',
    'https://www.visitdubai.com/en/articles/best-beaches-in-dubai',
  ),
  source(
    'inside-burj',
    'Inside Burj Al Arab • The Tour',
    'https://www.insideburjalarab.com/ar/groups-and-events',
  ),
  source('view', 'The View • Standard и Next Level', 'https://www.theviewpalm.ae/en'),
  source(
    'palm',
    'Visit Dubai • Palm Jumeirah',
    'https://www.visitdubai.com/articles/things-to-do-on-palm-jumeirah',
  ),
  source(
    'aquaventure',
    'Visit Dubai • Aquaventure World',
    'https://www.visitdubai.com/en/places-to-visit/aquaventure-waterpark',
  ),
  source(
    'marina',
    'Visit Dubai • Dubai Marina',
    'https://www.visitdubai.com/explore-dubai/dubai-neighbourhoods/dubai-marina',
  ),
  source(
    'bluewaters',
    'Visit Dubai • Bluewaters Island',
    'https://www.visitdubai.com/places-to-visit/bluewaters-island',
  ),
  source(
    'ain',
    'Ain Dubai • тарифы',
    'https://www.aindubai.com/en',
    'official',
    'На странице встречаются разные стартовые цены 145/149 AED; тариф на даты поездки не подтверждён.',
  ),
  source(
    'harbour',
    'Visit Dubai • Dubai Harbour',
    'https://www.visitdubai.com/en/places-to-visit/dubai-harbour',
  ),
  source(
    'fahidi',
    'Visit Dubai • Al Fahidi',
    'https://www.visitdubai.com/en/places-to-visit/al-fahidi-historical-neighbourhood',
  ),
  source(
    'seef',
    'Visit Dubai • Al Seef',
    'https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/al-seef',
  ),
  source(
    'gold',
    'Visit Dubai • Gold Souk',
    'https://www.visitdubai.com/en/places-to-visit/the-gold-souk',
  ),
  source(
    'shindagha',
    'Dubai Culture • Al Shindagha, карта и тарифы',
    'https://alshindagha.dubaiculture.gov.ae/Documents/ASM-Brochure-English.pdf',
    'official',
    'Брошюра не является подтверждением доступности на конкретную дату.',
  ),
  source(
    'expo',
    'Expo City • Al Wasl и город',
    'https://www.expocitydubai.com/en/plan-your-visit/terra-and-vision-combo-ticket/',
  ),
  source('terra', 'Terra • тарифы и часы', 'https://terra.expocitydubai.com/en/visit'),
  source(
    'ja',
    'JA Beach Hotel • Pool & Beach Day Experience',
    'https://source.jaresortshotels.com/offer-detail/pool-beach-day-experience',
  ),
  source(
    'ja-hotel',
    'JA The Resort • территория и пляж',
    'https://www.jaresortshotels.com/en/dubai',
  ),
  source(
    'ja-sports',
    'JA The Resort • водные активности',
    'https://www.jaresortshotels.com/leisure-detail/watersports',
  ),
  source('parks', 'Dubai Parks and Resorts • парки', 'https://www.dubaiparksandresorts.com/en'),
  source(
    'motiongate',
    'MOTIONGATE • официальный сайт',
    'https://www.dubaiparksandresorts.com/en/motiongatetm-dubai',
  ),
  source(
    'legoland',
    'LEGOLAND • официальный сайт',
    'https://www.legoland.com/dubai/',
    'official',
    'При проверке сайт показывал Closed для обоих парков. Расписание 6–10 октября не подтверждено.',
  ),
  source(
    'riverland',
    'RIVERLAND • актуальные входные билеты',
    'https://www.dubaiparksandresorts.com/en/riverland',
    'official',
    'Не помечать бесплатным по старым путеводителям: у оператора есть входные билеты.',
  ),
  source(
    'desert',
    'Visit Dubai • сафари',
    'https://www.visitdubai.com/places-to-visit/desert-safari-dubai',
  ),
  {
    ...source(
      'desert-ticket',
      'King of Desert • частное сафари, до 6 гостей',
      'https://thekingofdesert.com/product/desert-safari-private-car-6',
      'ticket-provider',
    ),
    accessedAt: '2026-10-03',
  },
  source(
    'hatta',
    'Visit Dubai • Hatta, активности',
    'https://www.visitdubai.com/en/articles/top-hatta-activities',
  ),
  source(
    'hatta-map',
    'Visit Dubai • Hatta, карта',
    'https://www.visitdubai.com/en/articles/-/media/Images/pdf/2025/maps/hatta-map-2025-en.pdf',
  ),
  source(
    'climate',
    'Visit Dubai • климат в октябре',
    'https://www.visitdubai.com/en/articles/dubai-in-october-weather-guide',
  ),
  source(
    'fx',
    'Банк России • курс AED на 02.10.2026',
    'https://www.cbr.ru/eng/currency_base/daily/?unidbquery.posted=True&unidbquery.to=02.10.2026',
  ),
  source(
    'sputnik-pay',
    'Sputnik8 • способы оплаты',
    'https://www.sputnik8.com/ru/payment-methods',
    'ticket-provider',
  ),
  source(
    'sputnik-faq',
    'Sputnik8 • предоплата и остаток',
    'https://www.sputnik8.com/ru/faq',
    'ticket-provider',
  ),
  source(
    'tripster-pay',
    'Tripster • способы оплаты',
    'https://experience.tripster.ru/about/payment/',
    'ticket-provider',
  ),
  source(
    'tripcom-pay',
    'Trip.com • российские карты',
    'https://ru.trip.com/blog/prilozhenie-trip-skidki-predlozheniya-na-otdyh/',
    'ticket-provider',
    'Подтверждение по отелям и перелётам не переносится автоматически на билеты в достопримечательности.',
  ),
  source(
    'klook-pay',
    'Klook • методы оплаты',
    'https://www.klook.com/en-GB/faq/category-50-question-920/',
    'ticket-provider',
  ),
  source(
    'gyg-pay',
    'GetYourGuide • условия платежей',
    'https://www.getyourguide.com/c/general-terms-and-conditions/',
    'ticket-provider',
  ),
  source(
    'tiqets',
    'Tiqets • билеты и условия на checkout',
    'https://www.tiqets.com/en/',
    'ticket-provider',
    'Надёжного подтверждения приёма российских карт не найдено.',
  ),
  source(
    'wegotrip-pay',
    'WeGoTrip • поддержка',
    'https://wegotrip.com/support/',
    'ticket-provider',
  ),
  source(
    'visa',
    'Visa • российские карты за пределами РФ',
    'https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.18871.html',
    'other',
  ),
  source(
    'mastercard',
    'Mastercard • приостановка операций',
    'https://www.mastercard.com/news/press/2022/march/mastercard-statement-on-suspension-of-russian-operations',
    'other',
  ),
  source(
    'review-burj',
    'Sputnik8 • отзывы о билетах, Burj Khalifa',
    'https://www.sputnik8.com/ru/dubai/category/tickets/reviews',
    'review',
  ),
  source(
    'review-future',
    'Sputnik8 • отзывы о Музее будущего',
    'https://www.sputnik8.com/ru/dubai/activities/52711-bilety-v-muzey-buduschego',
    'review',
  ),
  source(
    'review-view',
    'Sputnik8 • отзывы о The View',
    'https://www.sputnik8.com/ru/dubai/activities/38067-bilety-na-smotrovuyu-ploschadku-the-view-at-the-palm',
    'review',
  ),
  source(
    'review-view-queues',
    'Sputnik8 • другой опыт The View',
    'https://www.sputnik8.com/ru/dubai/activities/67225-zahvatyvayuschie-vidy-the-view-at-the-palm',
    'review',
  ),
  source(
    'review-skyviews',
    'Sputnik8 • отзывы о Sky Views',
    'https://www.sputnik8.com/ru/dubai/activities/62738-gorizonty-dubaya-sky-views-dubai-vhodnoy-bilet',
    'review',
  ),
  source(
    'review-greenplanet',
    'Sputnik8 • отзывы о Green Planet',
    'https://www.sputnik8.com/ru/dubai/activities/62716-les-pod-kupolom-vhodnoy-bilet-v-oranzhereyu-the-green-planet',
    'review',
  ),
  source(
    'review-aquaventure',
    'Отзовик • опыт в Aquaventure',
    'https://otzovik.com/review_8488304.html',
    'review',
    'Отзыв 2019 года: полезен для опыта посещения, не для актуальных тарифов и правил.',
  ),
  source(
    'review-parks',
    'Sputnik8 • отзывы о Motiongate и LEGOLAND',
    'https://www.sputnik8.com/ru/dubai/activities/56832-tematicheskie-parki-motiongate-legoland-akvapark-legoland',
    'review',
  ),
  source(
    'review-legoland',
    'Tripster • отзывы о LEGOLAND',
    'https://experience.tripster.ru/experience/Dubai/10014-legoland/reviews/',
    'review',
  ),
  source(
    'review-ja',
    'TopHotels • плюсы и минусы JA Beach',
    'https://tophotels.ru/hotel/al993/reviews/pros-n-cons',
    'review',
  ),
  source(
    'review-ja-lagoon',
    'TopHotels • опыт в лагуне JA',
    'https://tophotels.ru/en/review/2650894',
    'review',
    'Опыт 2024 года, состояние воды может отличаться.',
  ),
  source(
    'review-seef',
    'Отзовик • Al Seef, прогулка',
    'https://otzovik.com/review_11505851.html',
    'review',
  ),
  source(
    'review-seef-new',
    'Отзовик • Souk Al Seef, 2026',
    'https://otzovik.com/review_18298659.html',
    'review',
  ),
]
const payment = (status: string, note: string, sourceIds: string[], scope = 'unspecified') => ({
  status,
  note,
  scope,
  sourceIds,
  checkedAt,
})
sources.push(
  source(
    'review-aquarium',
    'Яндекс Карты • Dubai Aquarium, русскоязычные отзывы',
    'https://yandex.com/maps/org/dubayskiy_akvarium_i_podvodny_zoopark/227420987094/reviews/?lang=ru',
    'review',
  ),
  source(
    'review-frame',
    'Tripadvisor • русскоязычный опыт Dubai Frame',
    'https://www.tripadvisor.ru/Attraction_Review-g295424-d13320787-Reviews-Dubai_Frame-Dubai_Emirate_of_Dubai.html',
    'review',
  ),
  source(
    'review-fahidi',
    'Яндекс Карты • Аль-Фахиди, отзывы',
    'https://yandex.com/maps/org/al_fahidi_historical_neighbourhood/162515553913/reviews/?lang=ru',
    'review',
  ),
  source(
    'review-madinat',
    'TURIZM • Мадинат Джумейра, архивные отзывы',
    'https://www.turizm.ru/oae/dubai/places/rynok_madinat_dzhumejra/ref/',
    'review',
    'Отзывы 2014–2017 годов: только впечатления, без переноса старых цен и транспортных советов.',
  ),
  source(
    'review-desert',
    'Sputnik8 • сафари в пустыне, отзывы',
    'https://www.sputnik8.com/ru/dubai/category/safari/reviews',
    'review',
  ),
)
const officialPayment = payment(
  'unknown',
  'Приём всех карт российских банков не подтверждён. Российские Visa и Mastercard не работают через международные сети; другие платёжные системы нужно проверять отдельно.',
  ['visa', 'mastercard'],
)
const sputnikPayment = payment(
  'confirmed',
  'Онлайн-платёж российской картой подтверждён сервисом. Выберите полную оплату, если доступна: остаток по некоторым предложениям платится на месте.',
  ['sputnik-pay', 'sputnik-faq'],
  'online',
)
const tripsterPayment = payment(
  'confirmed',
  'Российской картой можно оплатить онлайн-часть заказа. Если это предоплата, способ оплаты остатка согласуйте с организатором.',
  ['tripster-pay'],
  'deposit',
)
const providers = [
  {
    id: 'official',
    name: 'Официальный сайт',
    website: 'https://www.visitdubai.com/en',
    russianCardSupport: officialPayment,
  },
  {
    id: 'sputnik8',
    name: 'Sputnik8',
    website: 'https://www.sputnik8.com/ru/dubai',
    russianCardSupport: sputnikPayment,
  },
  {
    id: 'tripster',
    name: 'Tripster',
    website: 'https://experience.tripster.ru/experience/Dubai/',
    russianCardSupport: tripsterPayment,
  },
  {
    id: 'trip-com',
    name: 'Trip.com',
    website: 'https://ru.trip.com/',
    russianCardSupport: payment(
      'likely',
      'МИР / СБП доступны для ряда бронирований в RUB. Для конкретного билета на аттракцион проверяйте checkout: общего подтверждения недостаточно.',
      ['tripcom-pay'],
    ),
  },
  {
    id: 'klook',
    name: 'Klook',
    website: 'https://www.klook.com/',
    russianCardSupport: payment(
      'unknown',
      'Есть UnionPay и международные способы оплаты. Приём карты конкретного российского банка не подтверждён.',
      ['klook-pay'],
    ),
  },
  {
    id: 'getyourguide',
    name: 'GetYourGuide',
    website: 'https://www.getyourguide.com/',
    russianCardSupport: payment(
      'unknown',
      'Подтверждения приёма карт РФ не найдено. Проверяйте доступные методы на странице оплаты.',
      ['gyg-pay'],
    ),
  },
  {
    id: 'tiqets',
    name: 'Tiqets',
    website: 'https://www.tiqets.com/en/',
    russianCardSupport: payment(
      'unknown',
      'Приём российских карт не удалось надёжно подтвердить.',
      ['tiqets'],
    ),
  },
  {
    id: 'wegotrip',
    name: 'WeGoTrip',
    website: 'https://wegotrip.com/',
    russianCardSupport: payment(
      'unknown',
      'В справке описана оплата картой, но её российское происхождение не подтверждено.',
      ['wegotrip-pay'],
    ),
  },
]
const price = (
  amount: number | undefined,
  sourceId: string,
  note = 'Цена на дату исследования, доступность слота проверяйте у продавца.',
  kind = amount === 0 ? 'free' : amount === undefined ? 'unknown' : 'from',
) => ({
  kind,
  ...(amount !== undefined ? { amount } : {}),
  currency: 'AED',
  note,
  checkedAt,
  sourceIds: [sourceId],
  variants: [] as { label: string; type: string; amount: number; sourceIds: string[] }[],
})
const review = (
  sourceIds: string[],
  positives: string[],
  negatives: string[],
  tips: string[],
  consensus: string,
  sampleNote = 'Качественный разбор опубликованных русскоязычных отзывов. Это субъективный опыт, а не репрезентативный рейтинг.',
) => ({ sourceIds, positives, negatives, tips, consensus, sampleNote, checkedAt })
export interface Seed {
  website?: string
  checkedAt?: string
  opensOn?: string
  schedule?: { opens: string; closes: string }
  childPrices?: { minAge: number; maxAge: number; amount: number }[]
  id: string
  name: string
  nameRu: string
  area: string
  coordinates: [number, number]
  category: string
  image: string
  short: string
  description: string
  source: string
  amount?: number
  free?: boolean
  minutes: [number, number]
  tags: string[]
  best: string
  transport: string
  hours?: string
  availability?: string
  availabilityNote?: string
  booking?: boolean
  review?: ReturnType<typeof review>
  offer?: [string, string]
  priceNote?: string
  extraSources?: string[]
  imageNote?: string
}
const seeds: Seed[] = [
  {
    id: 'burj-khalifa',
    name: 'Burj Khalifa · At the Top',
    nameRu: 'Бурдж-Халифа',
    area: 'downtown',
    coordinates: [25.1972, 55.2744],
    category: 'viewpoint',
    image: 'burj',
    short: 'Город, который кажется невозможным. С высоты 124-го этажа.',
    description:
      'Смотровые площадки 124 и 125 этажей дают масштаб Downtown и побережья. Базовый пакет Silver не включает этаж 148. Сравнивайте одинаковые этажи, время входа и условия отмены: дешёвый билет и билет на закат могут быть разными продуктами.',
    source: 'burj',
    amount: 189,
    minutes: [90, 150],
    tags: ['must-see', 'sunset', 'photos', 'couple'],
    best: 'На закате — красиво, но больше людей. Утро — спокойнее по отзывам.',
    transport:
      'Вход на смотровую через Dubai Mall. Заложите время на переход внутри торгового центра.',
    hours: 'Silver: 10:00–20:00, последний вход 19:00.',
    booking: true,
    review: review(
      ['review-burj'],
      ['Панорама города и ощущение высоты.', 'Утренний вход некоторым помог избежать толпы.'],
      [
        'Очереди к лифту могут занять значительную часть визита.',
        'Даже электронный билет иногда требует обмена по инструкции продавца.',
      ],
      ['Приходите с запасом времени.', 'Проверьте этажи и место получения билета.'],
      'Главный вид города; качество визита заметно зависит от очередей.',
    ),
    offer: [
      'tripster',
      'https://experience.tripster.ru/experience/Dubai/49649-bilety-v-burdzh-halifu/',
    ],
  },
  {
    id: 'dubai-mall',
    name: 'Dubai Mall',
    nameRu: 'Дубай Молл',
    area: 'downtown',
    coordinates: [25.1985, 55.2796],
    category: 'shopping',
    image: 'mall',
    short: 'Не только магазины: аквариум, арт-объекты и выход к фонтанам.',
    description:
      'Большой торговый и развлекательный комплекс рядом с Бурдж-Халифой. Для первого визита достаточно выбрать несколько ориентиров, а не пытаться обойти весь молл. Сам вход бесплатный; развлечения и покупки оплачиваются отдельно.',
    source: 'mall',
    free: true,
    minutes: [120, 240],
    tags: ['must-see', 'kids', 'evening', 'free'],
    best: 'Днём — как прохладная пауза между прогулками.',
    transport: 'Станция Burj Khalifa / Dubai Mall; до самого комплекса длинный крытый переход.',
  },
  {
    id: 'dubai-fountain',
    name: 'Dubai Fountain',
    nameRu: 'Фонтаны Дубая',
    area: 'downtown',
    coordinates: [25.1955, 55.2769],
    category: 'attraction',
    image: 'fountain',
    short: 'Вода, музыка и небоскрёб в одном вечернем кадре.',
    description:
      'Смотрите шоу с общедоступной набережной у Burj Lake. Платные Boardwalk и Lake Ride — отдельные впечатления, не обязательный билет для просмотра фонтанов. Расписание на конкретный вечер проверяйте перед прогулкой.',
    source: 'fountain',
    free: true,
    minutes: [20, 45],
    tags: ['must-see', 'evening', 'photos', 'free'],
    best: 'Вечером. Выберите точку на набережной заранее.',
    transport: 'Через Dubai Mall к Burj Lake.',
    priceNote:
      'Просмотр с публичной набережной бесплатный. Boardwalk: 25 AED; Lake Ride: 73,25 AED.',
  },
  {
    id: 'dubai-aquarium',
    name: 'Dubai Aquarium & Underwater Zoo',
    nameRu: 'Аквариум Дубая',
    area: 'downtown',
    coordinates: [25.1984, 55.2791],
    category: 'experience',
    image: 'aquarium',
    short: 'Подводный туннель прямо внутри Dubai Mall.',
    description:
      'Внешнюю панель аквариума видно из молла. Платный билет даёт доступ в туннель и Underwater Zoo; набор дополнительных встреч с животными зависит от пакета. Не путайте бесплатный вид с полным посещением.',
    source: 'aquarium',
    amount: 199,
    extraSources: ['aquarium-guide'],
    minutes: [60, 120],
    tags: ['kids', 'photos'],
    best: 'Как часть посещения молла в жаркие часы.',
    transport: 'Внутри Dubai Mall.',
    hours: 'Пн–чт 11:00–21:00, пт–вс 10:00–21:00; последний вход 20:15.',
    booking: true,
    priceNote:
      'От 199 AED по Visit Dubai; актуальные пакеты и стоимость на даты поездки уточняются.',
  },
  {
    id: 'sky-views',
    name: 'Sky Views Observatory',
    nameRu: 'Sky Views',
    area: 'downtown',
    coordinates: [25.2012, 55.2714],
    category: 'viewpoint',
    image: 'skyviews',
    imageNote: 'На фото — панорама Downtown; не фотография самой смотровой.',
    short: 'Стеклянный пол и лучший ракурс на Бурдж-Халифу.',
    description:
      'Смотровая в Address Sky View: сюда идут за видом на башню, а не с неё. Observatory, стеклянная горка и Edge Walk имеют разные условия. На официальной странице базовый пакет указан с горкой; проверяйте её доступность и ограничения.',
    source: 'skyviews',
    amount: 89,
    minutes: [60, 90],
    tags: ['sunset', 'photos', 'extreme'],
    best: 'К переходу от дневного света к вечерней подсветке.',
    transport: 'Address Sky View, рядом со станцией Burj Khalifa / Dubai Mall.',
    booking: true,
    review: review(
      ['review-skyviews'],
      ['Выразительный вид на Бурдж-Халифу.', 'Стеклянный пол добавляет эмоций.'],
      ['Стёкла бликуют на фотографиях.', 'На горке бывает отдельная очередь.'],
      ['Проверьте, что включено в пакет.'],
      'Хороший альтернативный ракурс Downtown; горка нравится не всем.',
    ),
    offer: [
      'sputnik8',
      'https://www.sputnik8.com/ru/dubai/activities/62738-gorizonty-dubaya-sky-views-dubai-vhodnoy-bilet',
    ],
  },
  {
    id: 'dubai-opera',
    name: 'Dubai Opera · Grand Tour',
    nameRu: 'Опера Дубая',
    area: 'downtown',
    coordinates: [25.1941, 55.2727],
    category: 'architecture',
    image: 'opera',
    short: 'Архитектура театра и взгляд за кулисы.',
    description:
      'Форма здания отсылает к традиционной лодке дау. Grand Tour позволяет познакомиться с театральными пространствами; это не билет на спектакль. Слоты и доступ за кулисы зависят от событий в театре.',
    source: 'opera',
    amount: 70,
    minutes: [90, 120],
    tags: ['photos', 'couple'],
    best: 'На доступный экскурсионный слот; снаружи — вечером.',
    transport: 'Пешком от Burj Lake и Dubai Mall.',
    booking: true,
  },
  {
    id: 'dubai-water-canal',
    name: 'Dubai Water Canal',
    nameRu: 'Дубайский водный канал',
    area: 'business-bay',
    coordinates: [25.1839, 55.2546],
    category: 'walk',
    image: 'canal',
    short: 'Мосты, вода и городской силуэт без входного билета.',
    description:
      'Набережные и пешеходные мосты дают более спокойный городской маршрут. Это протяжённое место, а не одна достопримечательность: метка у пешеходного моста показывает удобный ориентир. Круизы и кафе оплачиваются отдельно.',
    source: 'canal',
    extraSources: ['free-guide'],
    free: true,
    minutes: [60, 120],
    tags: ['evening', 'photos', 'couple', 'free'],
    best: 'После спада жары, ближе к вечеру.',
    transport: 'Business Bay; выбирайте конкретный мост или участок набережной при заказе такси.',
  },
  {
    id: 'museum-of-the-future',
    name: 'Museum of the Future',
    nameRu: 'Музей будущего',
    area: 'difc',
    coordinates: [25.2193, 55.2819],
    category: 'architecture',
    image: 'future',
    short: 'Архитектурная икона. Экспозиции временно закрыты.',
    description:
      'Официальный сайт сообщает о временном закрытии выставок для обновления. В каталоге место сохранено ради архитектуры и будущего открытия. Не покупайте старые предложения, не проверив возобновление работы на свои даты.',
    source: 'future',
    minutes: [20, 40],
    tags: ['must-see', 'photos'],
    best: 'Внешний вид здания — в дневном свете или с вечерней подсветкой.',
    transport: 'Район Sheikh Zayed Road, рядом с Emirates Towers.',
    availability: 'temporarily-closed',
    availabilityNote:
      'Экспозиции временно закрыты. Дата открытия не объявлена на проверенной странице.',
    review: review(
      ['review-future'],
      ['Внешняя архитектура впечатляет.'],
      [
        'Часть посетителей считает старую экспозицию менее новой, чем ожидала.',
        'В отзывах упоминаются очереди после получения браслетов.',
      ],
      ['Отзывы относятся к экспозиции до закрытия.'],
      'Архитектуру и содержательность старой экспозиции оценивают по-разному.',
    ),
  },
  {
    id: 'difc-gate-avenue',
    name: 'DIFC · Gate Avenue',
    nameRu: 'DIFC и Gate Avenue',
    area: 'difc',
    coordinates: [25.2118, 55.2795],
    category: 'food-view',
    image: 'difc',
    short: 'Галереи, современная архитектура и вечерние рестораны.',
    description:
      'Пешеходная ось финансового квартала соединяет торговые пространства и рестораны. Подходит для спокойной вечерней прогулки и ужина, если хочется увидеть повседневный современный Дубай. Бюджет зависит от выбранного заведения.',
    source: 'difc',
    free: true,
    minutes: [60, 120],
    tags: ['evening', 'couple', 'free'],
    best: 'После рабочего дня, с остановкой в кафе.',
    transport: 'Рядом со станцией Financial Centre; ориентир — Gate Avenue.',
    priceNote: 'Прогулка без билета. Еда, выставки и события могут оплачиваться отдельно.',
  },
  {
    id: 'dubai-frame',
    name: 'Dubai Frame',
    nameRu: 'Дубайская рамка',
    area: 'zabeel',
    coordinates: [25.2355, 55.3003],
    category: 'viewpoint',
    image: 'frame',
    short: 'Старый и новый Дубай по разные стороны одного панорамного окна.',
    description:
      'Смотровая в Zabeel Park с панорамным переходом и стеклянным полом. Здесь особенно хорошо читается география города: старые кварталы с одной стороны и высотный коридор с другой. Вход через Gate 4.',
    source: 'frame',
    amount: 50,
    minutes: [60, 90],
    tags: ['must-see', 'photos', 'kids'],
    best: 'В первой половине дня или к закату.',
    transport: 'Zabeel Park, Gate 4. Для маршрута используйте официальный Get Directions.',
    hours: 'Ежедневно 08:00–21:00; в праздники время может меняться.',
    booking: true,
  },
  {
    id: 'zabeel-park',
    name: 'Zabeel Park',
    nameRu: 'Парк Забиль',
    area: 'zabeel',
    coordinates: [25.2325, 55.2977],
    category: 'nature',
    image: 'zabeel',
    short: 'Зелёная пауза рядом с Рамкой.',
    description:
      'Городской парк вокруг Dubai Frame. Подходит для прогулки после смотровой и отдыха с детьми. Вход в парк и в Рамку — разные продукты; тариф и доступ через конкретные ворота стоит проверить отдельно.',
    source: 'zabeel',
    minutes: [60, 120],
    tags: ['kids', 'evening'],
    best: 'Вечером, когда прогулка на открытом воздухе комфортнее.',
    transport: 'Район Zabeel; выберите ворота парка перед поездкой.',
  },
  {
    id: 'city-walk',
    name: 'City Walk',
    nameRu: 'City Walk',
    area: 'city-walk',
    coordinates: [25.2078, 55.2633],
    category: 'walk',
    image: 'citywalk',
    short: 'Уличное искусство, кофе и неспешные городские прогулки.',
    description:
      'Открытый городской квартал с ресторанами, магазинами и арт-объектами. Сам район можно посетить бесплатно; Green Planet и отдельные события требуют билета. Хороший вариант для вечера без обязательного бронирования.',
    source: 'citywalk',
    free: true,
    minutes: [60, 120],
    tags: ['evening', 'couple', 'photos', 'free'],
    best: 'Вечером, с остановкой на ужин.',
    transport: 'Между Downtown и Jumeirah; удобно подъехать к City Walk на такси.',
  },
  {
    id: 'green-planet',
    name: 'The Green Planet',
    nameRu: 'Тропический лес Green Planet',
    area: 'city-walk',
    coordinates: [25.207, 55.2611],
    category: 'nature',
    image: 'greenplanet',
    short: 'Тропический мир с птицами и ленивцами под городским куполом.',
    description:
      'Крытый биокупол в City Walk позволяет переключиться с городской архитектуры на живую природу. Дневной билет и специальные встречи с животными отличаются по составу. Актуальную сумму на выбранную дату подтверждайте на официальной странице.',
    source: 'greenplanet',
    minutes: [60, 120],
    tags: ['kids', 'photos'],
    best: 'Днём как крытая альтернатива прогулке.',
    transport: 'City Walk; удобно совместить с прогулкой по кварталу.',
    booking: true,
    review: review(
      ['review-greenplanet'],
      [
        'Детям нравятся птицы и близкое наблюдение за животными.',
        'Посетители отмечают необычную концепцию леса.',
      ],
      ['Объём впечатлений кажется разным при повторном визите.'],
      ['Один из посетителей уложился примерно в полтора часа.'],
      'Компактное впечатление для семьи; не рассчитывайте на большой зоопарк.',
    ),
    offer: [
      'sputnik8',
      'https://www.sputnik8.com/ru/dubai/activities/62716-les-pod-kupolom-vhodnoy-bilet-v-oranzhereyu-the-green-planet',
    ],
  },
  {
    id: 'jumeirah-mosque',
    name: 'Jumeirah Mosque',
    nameRu: 'Мечеть Джумейра',
    area: 'jumeirah',
    coordinates: [25.2335, 55.2655],
    category: 'experience',
    image: 'mosque',
    short: 'Открытый разговор о культуре Эмиратов внутри мечети.',
    description:
      'Публичный визит программы Open Doors, Open Minds доступен немусульманам. В стоимость входят лёгкие традиционные угощения и активности в Majlis. Нужна скромная одежда; по пятницам публичных визитов нет.',
    source: 'mosque',
    amount: 55,
    minutes: [75, 100],
    tags: ['photos'],
    best: 'К одной из публичных сессий; регистрация начинается за 30 минут.',
    transport: 'Jumeirah Beach Road, Jumeirah 1.',
    hours: 'Сб–чт: сессии 10:00 и 14:00. Пятница — закрыто для публичных визитов.',
    priceNote: '55 AED за публичный визит, согласно официальной странице.',
  },
  {
    id: 'kite-beach',
    name: 'Kite Beach',
    nameRu: 'Кайт-Бич',
    area: 'jumeirah',
    coordinates: [25.1634, 55.2085],
    category: 'beach',
    image: 'kite',
    short: 'Море, беговая дорожка и неформальный Дубай у воды.',
    description:
      'Публичный пляж с кафе и возможностью активного отдыха. Вход бесплатный, аренда лежаков и водные активности оплачиваются отдельно. Выбирайте разрешённый участок для купания и следуйте указаниям спасателей.',
    source: 'beaches',
    free: true,
    minutes: [120, 240],
    tags: ['beach', 'sunset', 'kids', 'free'],
    best: 'Утром или ближе к закату, избегая длительного пребывания на полуденном солнце.',
    transport: 'Побережье Umm Suqeim / Jumeirah; метро не у пляжа.',
  },
  {
    id: 'sunset-beach',
    name: 'Sunset Beach · Umm Suqeim',
    nameRu: 'Сансет-Бич',
    area: 'jumeirah',
    coordinates: [25.1412, 55.1856],
    category: 'beach',
    image: 'sunset',
    short: 'Открытка с Бурдж-эль-Арабом без обязательного beach club.',
    description:
      'Публичный пляж возле отеля-паруса. Подходит для короткой остановки ради вида и прогулки у воды. Доступность конкретного участка и условия купания проверяйте на месте; метка — ориентир на побережье.',
    source: 'jumeirah',
    free: true,
    minutes: [45, 90],
    tags: ['beach', 'sunset', 'photos', 'free'],
    best: 'К закату для мягкого света.',
    transport: 'Umm Suqeim, рядом с Jumeirah Beach Hotel.',
  },
  {
    id: 'madinat-jumeirah',
    name: 'Souk Madinat Jumeirah',
    nameRu: 'Мадинат Джумейра',
    area: 'jumeirah',
    coordinates: [25.1331, 55.1853],
    category: 'walk',
    image: 'madinat',
    short: 'Каналы, арабские арки и террасы с видом на отель-парус.',
    description:
      'Общественные пространства souk можно исследовать во время прогулки. Это современная интерпретация традиционного рынка, а не сохранившийся старый город. Рестораны, лодочные прогулки и гостиничные зоны имеют собственные условия доступа.',
    source: 'jumeirah',
    free: true,
    minutes: [60, 120],
    tags: ['sunset', 'couple', 'photos', 'free'],
    best: 'После спада жары, с переходом к вечернему освещению.',
    transport: 'Комплекс Madinat Jumeirah; ориентир для такси — Souk.',
    priceNote: 'Прогулка по общественным зонам souk без билета; лодки и еда отдельно.',
  },
  {
    id: 'inside-burj-al-arab',
    name: 'Inside Burj Al Arab',
    nameRu: 'Внутри Бурдж-эль-Араба',
    area: 'jumeirah',
    coordinates: [25.1412, 55.1852],
    category: 'experience',
    image: 'sunset',
    short: 'Экскурсия в один из самых узнаваемых отелей мира.',
    description:
      'Организованный тур с дворецким знакомит с архитектурой и интерьерами отеля. Вход по туристическому билету отличается от бронирования номера или ресторанного визита. Пакеты с напитками стоят дороже обычного The Tour.',
    source: 'inside-burj',
    amount: 249,
    minutes: [90, 120],
    tags: ['photos', 'couple'],
    best: 'На доступный слот, по условиям билета.',
    transport: 'Точку регистрации уточняйте в подтверждении Inside Burj Al Arab.',
    hours: 'На официальной странице: ежедневно 10:00–19:00.',
    booking: true,
  },
  {
    id: 'the-view-at-the-palm',
    name: 'The View at The Palm',
    nameRu: 'The View — вид на Пальму',
    area: 'palm',
    coordinates: [25.1134, 55.1407],
    category: 'viewpoint',
    image: 'palm',
    imageNote: 'На фото — Palm Jumeirah; это общий вид острова.',
    short: 'Именно отсюда Пальма становится Пальмой.',
    description:
      'Смотровая в Palm Tower помогает увидеть рисунок искусственного острова. Standard и Next Level — разные уровни доступа; сравнивайте одинаковые пакеты. Расположение удобно для знакомства с центральной частью Palm Jumeirah.',
    source: 'view',
    amount: 110,
    minutes: [60, 90],
    tags: ['must-see', 'sunset', 'photos', 'couple'],
    best: 'Дневной свет для геометрии Пальмы; закат для атмосферы.',
    transport: 'Palm Tower, у центральной части острова.',
    hours: 'На официальной странице: ежедневно 10:00–19:00.',
    booking: true,
    review: review(
      ['review-view', 'review-view-queues'],
      ['Панорама острова и интерактивная часть перед подъёмом.'],
      [
        'Сравнение с другими смотровыми зависит от личных ожиданий.',
        'В отдельных отзывах описаны долгие очереди.',
      ],
      ['Резервируйте время с запасом, особенно с детьми.'],
      'Лучше всего объясняет форму Пальмы; впечатления от организации разнятся.',
    ),
    offer: [
      'sputnik8',
      'https://www.sputnik8.com/ru/dubai/activities/38067-bilety-na-smotrovuyu-ploschadku-the-view-at-the-palm',
    ],
  },
  {
    id: 'palm-west-beach',
    name: 'Palm West Beach',
    nameRu: 'Palm West Beach',
    area: 'palm',
    coordinates: [25.108, 55.1398],
    category: 'beach',
    image: 'palm',
    imageNote: 'На фото — Palm Jumeirah, общий вид острова.',
    short: 'Пляжные рестораны с силуэтом Marina на горизонте.',
    description:
      'Променад на западной стороне ствола Пальмы подходит для прогулки и ужина у моря. У пляжных клубов собственные правила доступа и минимального депозита; прогулку не стоит путать с бесплатным пользованием их лежаками.',
    source: 'beaches',
    free: true,
    minutes: [90, 180],
    tags: ['beach', 'sunset', 'couple', 'free'],
    best: 'К закату, с возможностью остаться на ужин.',
    transport: 'Западная сторона ствола Palm Jumeirah.',
    priceNote: 'Прогулка без билета; beach clubs, лежаки и рестораны отдельно.',
  },
  {
    id: 'aquaventure',
    name: 'Aquaventure World',
    nameRu: 'Аквапарк Aquaventure',
    area: 'palm',
    coordinates: [25.1335, 55.1205],
    category: 'waterpark',
    image: 'aquaventure',
    short: 'День в воде у Atlantis: горки вместо городских улиц.',
    description:
      'Большой аквапарк у Atlantis на внешнем полумесяце Пальмы. Лучше ехать на целый день: горок много, а дорога из отеля занимает время. В цене ниже — стартовый дневной билет; доплаты, ограничения по росту и выбранную дату смотрим перед покупкой.',
    source: 'aquaventure',
    minutes: [300, 480],
    tags: ['kids', 'extreme', 'beach'],
    best: 'На целый день; для короткого визита может быть невыгодно.',
    transport: 'Atlantis, The Palm; учитывайте дорогу по острову.',
    booking: true,
    review: review(
      ['review-aquaventure'],
      ['Одно посещение легко занимает целый день.'],
      ['Автор отмечает высокую общую стоимость и ожидание на входе.'],
      ['Заранее уточните ограничения по росту и услуги в билете.'],
      'Масштабное водное впечатление, которому нужен отдельный бюджет.',
      'Доступен один подробный русскоязычный отзыв 2019 года. Это ограниченная историческая выборка, не текущие правила.',
    ),
  },
  {
    id: 'lost-world-aquarium',
    name: 'The Lost World Aquarium',
    nameRu: 'Аквариум Lost World',
    area: 'palm',
    coordinates: [25.1305, 55.117],
    category: 'experience',
    image: 'atlantis',
    imageNote: 'На фото — отель Atlantis, в котором находится аквариум.',
    short: 'Подводный мир в Atlantis, за пределами аквапарка.',
    description:
      'Аквариум в Atlantis, The Palm. В актуальном путеводителе используется название The Lost World Aquarium; в старых материалах встречается Lost Chambers. Проверяйте самостоятельный билет и комбинированные предложения с Aquaventure.',
    source: 'palm',
    minutes: [60, 90],
    tags: ['kids', 'photos'],
    best: 'Крытая пауза во время знакомства с Atlantis.',
    transport: 'Atlantis, The Palm.',
    booking: true,
  },
  {
    id: 'dubai-marina-walk',
    name: 'Dubai Marina Walk',
    nameRu: 'Набережная Дубай Марины',
    area: 'marina',
    coordinates: [25.0805, 55.1407],
    category: 'walk',
    image: 'marina',
    short: 'Небоскрёбы, яхты и город, отражённый в воде.',
    description:
      'Большой прогулочный район вдоль искусственной гавани. Выберите короткий участок вместо полного круга, если вышли ненадолго. Набережная, JBR и Dubai Harbour — соседние, но разные пространства.',
    source: 'marina',
    free: true,
    minutes: [60, 120],
    tags: ['must-see', 'evening', 'couple', 'photos', 'free'],
    best: 'Вечером, когда включается подсветка башен.',
    transport:
      'Метро и трамвай в районе Dubai Marina; выбирайте остановку по нужной части набережной.',
  },
  {
    id: 'jbr-beach',
    name: 'The Beach · JBR',
    nameRu: 'Пляж и променад JBR',
    area: 'marina',
    coordinates: [25.0771, 55.131],
    category: 'beach',
    image: 'jbr',
    short: 'Городской пляж, оживлённый променад и вид на Ain Dubai.',
    description:
      'Пляжный район рядом с Marina с ресторанами и прогулочными пространствами. Вход на публичный пляж не равен аренде лежака или водным развлечениям. Хорошо сочетается с пешим переходом в сторону Bluewaters.',
    source: 'beaches',
    free: true,
    minutes: [120, 240],
    tags: ['beach', 'kids', 'sunset', 'free'],
    best: 'Утром для моря, вечером для прогулки.',
    transport: 'Район Jumeirah Beach Residence, рядом с Dubai Tram.',
  },
  {
    id: 'bluewaters-island',
    name: 'Bluewaters Island',
    nameRu: 'Остров Bluewaters',
    area: 'bluewaters',
    coordinates: [25.08, 55.1207],
    category: 'walk',
    image: 'bluewaters',
    short: 'Островная прогулка по другую сторону JBR.',
    description:
      'Современный остров с ресторанами, общественными прогулочными зонами и колесом Ain Dubai. С JBR его соединяет пешеходный мост. Саму прогулку можно отделить от покупки билета на колесо.',
    source: 'bluewaters',
    free: true,
    minutes: [60, 120],
    tags: ['evening', 'photos', 'couple', 'free'],
    best: 'К закату и вечерней подсветке Marina.',
    transport: 'Пешком по мосту со стороны JBR либо такси на остров.',
  },
  {
    id: 'ain-dubai',
    name: 'Ain Dubai',
    nameRu: 'Колесо Ain Dubai',
    area: 'bluewaters',
    coordinates: [25.0798, 55.1221],
    category: 'viewpoint',
    image: 'ain',
    short: 'Силуэт побережья из кабины большого колеса.',
    description:
      'Обзорное колесо на Bluewaters. На официальной странице встречаются разные стартовые суммы, поэтому точную стоимость не переносим в каталог. Проверьте доступность на дату поездки и условия выбранной кабины.',
    source: 'ain',
    minutes: [60, 90],
    tags: ['sunset', 'photos', 'kids'],
    best: 'При хорошей видимости, на подтверждённый слот.',
    transport: 'Bluewaters Island.',
    booking: true,
  },
  {
    id: 'dubai-harbour',
    name: 'Dubai Harbour',
    nameRu: 'Гавань Dubai Harbour',
    area: 'harbour',
    coordinates: [25.097, 55.1368],
    category: 'walk',
    image: 'harbour',
    short: 'Город с морской стороны: яхты и панорама Marina.',
    description:
      'Отдельный морской район между Marina и Palm Jumeirah. Полезен как ориентир для яхтенных экскурсий и знакомства с побережьем. Доступ на пирсы, круизные терминалы и сами суда зависит от бронирования.',
    source: 'harbour',
    minutes: [45, 90],
    tags: ['sunset', 'photos'],
    best: 'К вечернему свету; для круиза — время из подтверждения.',
    transport: 'Ориентир для такси — Dubai Harbour. Точную точку посадки сообщает оператор.',
  },
  {
    id: 'al-fahidi',
    name: 'Al Fahidi Historical Neighbourhood',
    nameRu: 'Исторический квартал Аль-Фахиди',
    area: 'old-dubai',
    coordinates: [25.2633, 55.299],
    category: 'old-city',
    image: 'fahidi',
    short: 'Ветряные башни, узкие переулки и другой ритм города.',
    description:
      'Исторический квартал на стороне Bur Dubai. Здесь архитектура и тихие дворики важнее масштабных шоу. Прогулка по кварталу не включает автоматически вход в каждую галерею, музей или культурную программу.',
    source: 'fahidi',
    free: true,
    minutes: [60, 120],
    tags: ['must-see', 'photos', 'free'],
    best: 'Утром или после спада жары.',
    transport: 'Bur Dubai, рядом с Dubai Creek.',
  },
  {
    id: 'al-seef',
    name: 'Al Seef',
    nameRu: 'Набережная Аль-Сиф',
    area: 'old-dubai',
    coordinates: [25.2636, 55.305],
    category: 'old-city',
    image: 'seef',
    short: 'Арабские фасады, лодки Creek и кофе у воды.',
    description:
      'Набережная соединяет современную инфраструктуру и стилизованную наследную часть. Это не целиком древний квартал: архитектурная атмосфера создана для прогулок. Удобно сочетать с Al Fahidi и переправой через Creek.',
    source: 'seef',
    free: true,
    minutes: [60, 120],
    tags: ['evening', 'photos', 'couple', 'free'],
    best: 'Поздним днём и вечером для прогулки у воды.',
    transport: 'Bur Dubai, вдоль Dubai Creek.',
    review: review(
      ['review-seef', 'review-seef-new'],
      ['Атмосферные фасады, чистые прогулочные зоны и кафе.'],
      ['Одному из авторов прогулка показалась скучноватой.'],
      ['Выделите время просто на набережную, без обязательных покупок.'],
      'Хорошее место для спокойной прогулки; интерес зависит от любви к такой атмосфере.',
      'Сопоставлены два подробных русскоязычных отзыва 2021 и 2026 годов.',
    ),
  },
  {
    id: 'creek-abra',
    name: 'Dubai Creek · Traditional Abra',
    nameRu: 'Переправа через Creek на абре',
    area: 'old-dubai',
    coordinates: [25.265, 55.2969],
    category: 'experience',
    image: 'abra',
    short: 'Короткое путешествие между двумя берегами старого города.',
    description:
      'Традиционная переправа на деревянной лодке — простой способ связать Bur Dubai и Deira. Дешёвый городской маршрут не равен частной прогулке или туристическому круизу. Уточните маршрут и тариф на пристани.',
    source: 'free-guide',
    amount: 1,
    minutes: [10, 20],
    tags: ['must-see', 'photos'],
    best: 'Во время прогулки по старому городу.',
    transport: 'Метка у Bur Dubai Abra Station, маршрут зависит от выбранной пристани.',
    priceNote:
      '1 AED за традиционную переправу по Visit Dubai. Другие типы абры и маршруты дороже.',
  },
  {
    id: 'gold-souk',
    name: 'Dubai Gold Souk',
    nameRu: 'Золотой рынок',
    area: 'deira',
    coordinates: [25.2706, 55.2977],
    category: 'old-city',
    image: 'gold',
    short: 'Витрины золота и торговый Дубай по ту сторону Creek.',
    description:
      'Традиционный рынок в Deira можно посетить без покупок. Рядом находятся другие рынки и станции абры, поэтому район удобно исследовать пешком. Стоимость украшений и условия сделки уточняются в конкретном магазине.',
    source: 'gold',
    free: true,
    minutes: [45, 90],
    tags: ['photos', 'free'],
    best: 'В часы работы магазинов, с паузами от жары.',
    transport: 'Deira, рядом с рынками и пристанями абры.',
  },
  {
    id: 'al-shindagha-museum',
    name: 'Al Shindagha Museum',
    nameRu: 'Музей Аль-Шиндага',
    area: 'old-dubai',
    coordinates: [25.2695, 55.291],
    category: 'museum',
    image: 'shindagha',
    short: 'История города через дома, ремёсла и морскую культуру.',
    description:
      'Музейный комплекс состоит из нескольких домов в историческом районе. Здесь стоит выбрать темы, которые интересуют лично вас, вместо спешки по всему комплексу. Брошюра описывает общий билет на музейные дома; доступность отдельных экспозиций проверяйте отдельно.',
    source: 'shindagha',
    amount: 50,
    minutes: [120, 180],
    tags: ['kids'],
    best: 'Днём для музея, затем прогулка по Creek.',
    transport: 'Исторический район Al Shindagha, рядом с Al Ghubaiba.',
    booking: true,
    priceNote: '50 AED по официальной брошюре; актуальность на конкретную дату требует проверки.',
  },
  {
    id: 'expo-city',
    name: 'Expo City · Al Wasl Plaza',
    nameRu: 'Expo City и Al Wasl',
    area: 'expo',
    coordinates: [24.9607, 55.1509],
    category: 'architecture',
    image: 'expo',
    short: 'Архитектура всемирной выставки и огромный проекционный купол.',
    description:
      'Бывшая территория Expo развивается как отдельный городской район. Al Wasl — центральный ориентир. Доступ к событиям, шоу и павильонам зависит от программы; не предполагаем, что любой вечер включает бесплатное представление.',
    source: 'expo',
    minutes: [90, 180],
    tags: ['photos', 'evening', 'kids'],
    best: 'По актуальной программе мероприятий, особенно вечером.',
    transport: 'Южная часть города, станция Expo 2020.',
    availabilityNote: 'Проверьте программу и доступ к конкретным пространствам на даты поездки.',
  },
  {
    id: 'terra',
    name: 'Terra · The Sustainability Pavilion',
    nameRu: 'Terra — павильон устойчивости',
    area: 'expo',
    coordinates: [24.9574, 55.1489],
    category: 'museum',
    image: 'terra',
    short: 'Интерактивный взгляд на то, как устроена живая планета.',
    description:
      'Павильон Expo City с интерактивными залами о природе, океане и нашей повседневной жизни. Можно зайти всей семьёй и потом прогуляться по Expo. Смотрите состав билета: самостоятельный вход и пакеты с другими павильонами отличаются.',
    source: 'terra',
    amount: 100,
    minutes: [90, 150],
    tags: ['kids', 'photos'],
    best: 'В часы работы, совместив с другими пространствами Expo City.',
    transport: 'Expo City Dubai, рядом с метро Expo 2020.',
    hours: 'Ежедневно 10:00–18:00, последний вход 17:30.',
    booking: true,
  },
  {
    id: 'ja-beach',
    name: 'JA The Resort · Beach Day',
    nameRu: 'JA The Resort и пляж',
    area: 'jebel-ali',
    coordinates: [24.9888, 55.0202],
    category: 'beach',
    image: 'ja',
    short: 'Курортный день в Jebel Ali, вдали от высотного города.',
    description:
      'Наш спокойный день у моря без поездки в город. Для гостей JA Palm Tree Court доступ к пляжу и бассейнам зависит от тарифа проживания — уточним на ресепшене. Цены ниже относятся к day pass для внешних посетителей; нам отдельный пропуск может не понадобиться.',
    source: 'ja',
    extraSources: ['ja-hotel'],
    minutes: [240, 480],
    tags: ['beach', 'kids', 'couple'],
    best: 'Отдельный спокойный день у моря.',
    transport:
      'JA The Resort, Jebel Ali. Для выездов в город учитывайте реальную удалённость на карте.',
    booking: true,
    review: review(
      ['review-ja', 'review-ja-lagoon'],
      [
        'Территория, питание и спокойный курортный отдых.',
        'Для семей полезны бассейны и детские пространства.',
      ],
      [
        'Удалённость от города и отсутствие магазинов рядом.',
        'Есть разные оценки лагуны, тёплой воды и загруженности бассейнов.',
      ],
      [
        'Уточните, что входит в ваш тариф или day pass.',
        'Состояние моря проверяйте непосредственно перед посещением.',
      ],
      'Сильнее как курортная база, чем как точка для ежедневных выездов в Downtown.',
    ),
  },
  {
    id: 'ja-watersports',
    name: 'JA The Resort · Watersports',
    nameRu: 'Водные активности в JA',
    area: 'jebel-ali',
    coordinates: [24.9899, 55.0218],
    category: 'experience',
    image: 'ja',
    short: 'SUP, каяк или активный выход на воду рядом с отелем.',
    description:
      'Водный центр предлагает моторные и немоторные занятия, включая каяки, SUP и буксируемые активности. Для человека, который остановился в JA, это способ получить впечатление без длинной поездки. Цена, возрастные ограничения, ветер и доступность снаряжения уточняются у центра.',
    source: 'ja-sports',
    minutes: [30, 60],
    tags: ['beach', 'extreme'],
    best: 'На подтверждённое время, с учётом условий на воде.',
    transport: 'Внутри JA The Resort; вход и встречу согласуйте с водным центром.',
    hours: 'На официальной странице: 08:00–17:30.',
    booking: true,
  },
  {
    id: 'motiongate',
    name: 'MOTIONGATE Dubai',
    nameRu: 'Парк Motiongate',
    area: 'jebel-ali',
    coordinates: [24.9217, 55.0068],
    category: 'theme-park',
    image: 'motiongate',
    short: 'Кинематографические миры и американские горки рядом с JA.',
    description:
      'Тематический парк с зонами по мотивам кино и американскими горками. Из нашего отеля сюда ближе, чем из центрального Дубая. Лучше выделить большую часть дня; вечером можно погулять в соседнем Riverland. Билеты на один и два парка отличаются.',
    source: 'motiongate',
    minutes: [240, 420],
    tags: ['kids', 'extreme'],
    best: 'На отдельную большую часть дня, после проверки календаря.',
    transport: 'Dubai Parks and Resorts, Sheikh Zayed Road. Удобство трансфера проверьте в отеле.',
    availabilityNote: 'Расписание и работа аттракционов 6–10 октября требуют проверки у оператора.',
    booking: true,
    review: review(
      ['review-parks'],
      ['В начале сезона часть гостей проходила аттракционы без больших очередей.'],
      ['Длинная дорога из дальних районов может испортить впечатление.'],
      ['Сравните тариф на один и два парка.'],
      'Логичный выезд из JA; время на транспорт сильно зависит от базы.',
    ),
  },
  {
    id: 'legoland-dubai',
    name: 'LEGOLAND Dubai',
    nameRu: 'LEGOLAND Dubai',
    area: 'jebel-ali',
    coordinates: [24.9187, 55.0107],
    category: 'theme-park',
    image: 'legoland',
    short: 'Мир LEGO для семей: миниатюры и детские аттракционы.',
    description:
      'Семейный парк в Dubai Parks and Resorts. При исследовании официальный сайт показывал Closed на текущий день, что не доказывает закрытие на всю поездку. Сначала проверьте календарь 6–10 октября, затем покупайте билет.',
    source: 'legoland',
    minutes: [240, 360],
    tags: ['kids', 'photos'],
    best: 'По подтверждённому календарю работы.',
    transport: 'Dubai Parks and Resorts, рядом с Motiongate и Riverland.',
    availabilityNote:
      'На 2 октября официальный сайт показывал Closed. Доступность 6–10 октября не подтверждена.',
    booking: true,
    review: review(
      ['review-legoland', 'review-parks'],
      ['Детям, увлечённым LEGO, нравится атмосфера и миниатюры.'],
      [
        'Подросткам и взрослым без интереса к LEGO может быть скучнее.',
        'Еда внутри кажется дорогой части посетителей.',
      ],
      ['Ориентируйтесь на интересы ребёнка, а не только на бренд.'],
      'Отзывы чаще рекомендуют парк детям младшего школьного возраста.',
    ),
  },
  {
    id: 'legoland-waterpark',
    name: 'LEGOLAND Water Park',
    nameRu: 'Аквапарк LEGOLAND',
    area: 'jebel-ali',
    coordinates: [24.9171, 55.0104],
    category: 'waterpark',
    image: 'legoland',
    imageNote: 'На фото — LEGOLAND Dubai; не сами водные горки.',
    short: 'Семейный водный парк, рассчитанный на детей.',
    description:
      'Отдельный аквапарк комплекса Dubai Parks and Resorts, который оператор описывает как рассчитанный на детей 2–12 лет. Вход в обычный LEGOLAND не обязательно включает водный парк. На текущий день сайт показывал Closed; поездку планируйте после проверки календаря.',
    source: 'parks',
    extraSources: ['legoland'],
    minutes: [180, 300],
    tags: ['kids', 'beach'],
    best: 'По подтверждённому календарю и с подходящим детским билетом.',
    transport: 'Dubai Parks and Resorts, рядом с LEGOLAND Dubai.',
    availabilityNote:
      'На 2 октября сайт показывал Closed. Уточните дату открытия и календарь поездки.',
    booking: true,
  },
  {
    id: 'riverland',
    name: 'The World of RIVERLAND',
    nameRu: 'Riverland',
    area: 'jebel-ali',
    coordinates: [24.9228, 55.0088],
    category: 'walk',
    image: 'riverland',
    short: 'Тематическая прогулка между парками, без целого дня на горках.',
    description:
      'Рестораны и тематические общественные пространства в комплексе Dubai Parks and Resorts. В актуальных материалах оператора есть входные билеты: старое утверждение о полностью бесплатном посещении здесь не используем. Условия доступа и события уточняются на нужный день.',
    source: 'riverland',
    minutes: [60, 120],
    tags: ['evening', 'photos', 'kids'],
    best: 'С учётом текущего календаря, удобно сочетать с парком.',
    transport: 'Dubai Parks and Resorts, между тематическими парками.',
  },
  {
    id: 'lahbab-desert',
    name: 'Lahbab · Red Dunes Safari',
    nameRu: 'Красные дюны Лахбаб',
    area: 'desert',
    coordinates: [25.048, 55.592],
    category: 'desert',
    image: 'desert',
    short: 'За городом: дюны, тишина и вечернее небо.',
    description:
      'Сафари бронируем как отдельный тур, а не как обычное место на карте. Для шестерых есть частная машина King of Desert за 1000 AED на всю компанию; поездка, программа и ужин занимают около шести часов. Это пример пакета, не оценка качества оператора. До оплаты подтвердим забор из JA, время и ограничения для ребёнка. Условия возврата строгие: по указанной политике до 48 часов возвращают до 10% денег либо предлагают ваучер на 40%.',
    source: 'desert',
    extraSources: ['desert-ticket'],
    minutes: [360, 360],
    tags: ['must-see', 'sunset', 'extreme', 'photos'],
    best: 'Во второй половине дня, если оператор подтверждает программу с закатом.',
    transport: 'Обычно трансфер оператора; для JA отдельно уточняйте зону забора.',
    booking: true,
    priceNote:
      'Индивидуальные и групповые туры сильно различаются. Цена за человека не подтверждена.',
  },
  {
    id: 'hatta-dam',
    name: 'Hatta Dam',
    nameRu: 'Водохранилище Хатта',
    area: 'hatta',
    coordinates: [24.7833, 56.1147],
    category: 'nature',
    image: 'hatta',
    short: 'Горы и бирюзовая вода — совсем другой эмират по ощущению.',
    description:
      'Хатта находится далеко от прибрежных районов и требует отдельного выезда. Имеет смысл ради гор, каяков и смены пейзажа, а не как короткое «что рядом». Условия водных активностей и сезонный режим проверяйте у оператора перед дорогой.',
    source: 'hatta',
    extraSources: ['hatta-map'],
    minutes: [360, 600],
    tags: ['photos', 'couple'],
    best: 'На отдельный день, с ранним выездом и подтверждением работы активностей.',
    transport: 'Удалённый горный район. Из JA особенно важно заранее решить вопрос транспорта.',
    booking: true,
    priceNote:
      'Стоимость водных активностей и экскурсии зависит от оператора; подтверждённой суммы нет.',
  },
]
const photoNotes: Record<string, { image?: string; note: string }> = {
  'dubai-frame': { note: 'На фото — панорама со смотровой Dubai Frame.' },
  'al-fahidi': {
    note: 'На фото — форт Аль-Фахиди рядом с историческим кварталом. Это не подтверждение работы музея.',
  },
  'difc-gate-avenue': { image: 'hero', note: 'На фото — общий вид Дубая; не сам квартал DIFC.' },
  terra: { image: 'expo', note: 'На фото — Expo City; не сам павильон Terra.' },
  'museum-of-the-future': { note: 'Интерьер до обновления экспозиций. Музей временно закрыт.' },
  'ja-beach': {
    note: 'Архивное фото бассейна JA Palm Tree Court, 2012 год. Текущий вид и условия могут отличаться.',
  },
  'ja-watersports': { note: 'Архивное фото территории JA; не сам водный центр.' },
}
const extraReviews: Record<string, ReturnType<typeof review>> = {
  'dubai-aquarium': review(
    ['review-aquarium'],
    [
      'Родители часто хвалят пингвинов и подводный зоопарк.',
      'Большой аквариум впечатляет даже при осмотре снаружи.',
    ],
    [
      'Повторяются жалобы на короткий тоннель, высокую стоимость и доплаты за дополнительные активности.',
      'Опытным посетителям других океанариумов экспозиция иногда кажется скромной.',
    ],
    [
      'Сначала посмотрите на главный резервуар из торгового центра, затем решите, нужен ли платный пакет.',
      'Уточните, какие встречи с животными входят в билет.',
    ],
    'С детьми платная часть нравится чаще; ради одного тоннеля оценки выгодности расходятся.',
    'Разбор нескольких отзывов на русском за 2024–2026 годы. Отзывы с описаниями дельфинария исключены как вероятная путаница объектов.',
  ),
  'dubai-frame': review(
    ['review-frame'],
    [
      'Посетительница отмечает красивые исторические инсталляции перед подъёмом.',
      'Стеклянный пол выделяют как самостоятельное впечатление.',
    ],
    [
      'В русскоязычных отзывах встречаются очереди на фотографирование и разочарование видом вдали от Downtown.',
    ],
    ['Оцените, нужна ли вам ещё одна смотровая; учитывайте ожидание и ограниченный вид центра.'],
    'Впечатления неоднозначны: архитектурный объект и историческая экспозиция интересны, панорама нравится не всем.',
    'Разбор двух русскоязычных отзывов о посещении в 2025–2026 годах; не общий рейтинг и не прогноз очереди.',
  ),
  'al-fahidi': review(
    ['review-fahidi'],
    [
      'Повторяются похвала атмосферным переулкам, кафе и возможностям для фото.',
      'Нравится контраст с высотным городом.',
    ],
    ['Часть посетителей жалуется на навязчивую торговлю и считает район слишком компактным.'],
    ['В отзывах советуют совместить квартал с Al Seef и переправой через Creek.'],
    'Хорош для спокойной прогулки и смены настроения; интерес зависит от отношения к рынкам и небольшим историческим кварталам.',
    'Несколько русскоязычных отзывов Яндекс Карт 2024–2026; описания работы отдельных музеев не использованы как текущие факты.',
  ),
  'madinat-jumeirah': review(
    ['review-madinat'],
    [
      'В отзывах ценят каналы, арабский стиль и виды на Burj Al Arab.',
      'Место рекомендуют для прогулки и фотографий.',
    ],
    ['Встречается критика дорогих сувениров и ощущения туристического рынка.'],
    ['Приходить ради прогулки у воды; покупки и ресторан планировать отдельно.'],
    'Архивные впечатления сходятся на привлекательной атмосфере; оценки выгодности покупок различаются.',
    'Несколько русскоязычных отзывов 2014–2017 годов. Архивный опыт: не подтверждает нынешние цены, доступ или транспорт.',
  ),
  'lahbab-desert': review(
    ['review-desert'],
    [
      'Путешественники хвалят дюны, катание по песку и фотографии.',
      'Хороший водитель заметно влияет на впечатление.',
    ],
    [
      'Повторяются претензии к ожиданию, ужину и доплатам в лагере.',
      'Комфорт трансфера и длительность катания сильно отличаются.',
    ],
    ['До оплаты уточнить трансфер из отеля, фактическое время катания, доплаты и состав ужина.'],
    'Природа и поездка по дюнам нравятся чаще, чем лагерная программа; выбирайте конкретного оператора.',
    'Разбор нескольких русскоязычных отзывов о разных safari packages. Это не оценка одного выбранного тура.',
  ),
}
for (const seed of seeds) {
  seed.review ??= extraReviews[seed.id]
  const override = photoNotes[seed.id]
  if (override) {
    seed.image = override.image ?? seed.image
    seed.imageNote = override.note
  }
}
sources.push(
  ...ticketLinks.map(([slug, providerId, url]) => ({
    ...source(
      `ticket-${slug}-${providerId}`,
      `${providerId} • ${seeds.find((seed) => seed.id === slug)!.name}`,
      url,
      'ticket-provider',
      'Проверена страница конкретного предложения. Цена и наличие слотов на даты поездки не подтверждены.',
    ),
    accessedAt: ticketLinksCheckedAt,
  })),
)
sources.push(
  ...priceUpdates.map((update) => ({
    ...source(
      `price-${update.slug}`,
      `Тариф • ${seeds.find((seed) => seed.id === update.slug)!.name}`,
      update.url,
      'official',
      update.note,
    ),
    accessedAt: '2026-10-03',
  })),
)
for (const place of extraPlaces)
  sources.push({
    ...source(place.source, `${place.name} • информация для посещения`, place.website!, 'official'),
    accessedAt: '2026-10-03',
  })
for (const [id, title, url] of currentReviewSources)
  sources.push({ ...source(id, title, url, 'review'), accessedAt: '2026-10-03' })
const verifiedHours = hoursFeedSchema.parse(hoursSnapshot).places
for (const hours of verifiedHours)
  sources.push({
    ...source(`hours-${hours.placeId}`, 'Официальное расписание', hours.sourceUrl, 'official'),
    accessedAt: hours.checkedAt,
  })
sources.push(
  source(
    'miracle-season',
    'Miracle Garden • открытие сезона 15 и тарифы',
    'https://www.traveldailymedia.com/dubai-miracle-garden-opens-for-season-15/',
    'other',
    'Сообщение об открытии 8 октября 2026 и тарифах; VAT и детский возраст сверяются при бронировании.',
  ),
)
const places = [...seeds, ...extraPlaces].map((s) => {
  const sourceIds = [s.source, ...(s.extraSources ?? [])]
  const hours = verifiedHours.find((hours) => hours.placeId === `dubai-${s.id}`)
  const update = priceUpdates.find((update) => update.slug === s.id)
  const officialWebsite = update?.url ?? sources.find((v) => v.id === s.source)!.url
  const pricing = price(
    s.free ? 0 : s.amount,
    s.id === 'dubai-aquarium' ? 'aquarium-guide' : s.source,
    s.priceNote ??
      (s.amount === undefined && !s.free
        ? 'Цена зависит от выбранного билета. Посмотрим варианты на наши даты.'
        : 'Цена на дату исследования; это не гарантия доступности слота.'),
  )
  if (s.checkedAt) pricing.checkedAt = s.checkedAt
  if (s.id === 'lahbab-desert') Object.assign(pricing, { unit: 'group', groupCapacity: 6 })
  const childPrices =
    s.childPrices ??
    (s.id === 'dubai-frame'
      ? [
          { minAge: 0, maxAge: 2, amount: 0 },
          { minAge: 3, maxAge: 12, amount: 20 },
        ]
      : s.id === 'terra'
        ? [{ minAge: 4, maxAge: 11, amount: 80 }]
        : s.id === 'green-planet'
          ? [
              { minAge: 0, maxAge: 1, amount: 0 },
              { minAge: 2, maxAge: 10, amount: 135 },
              { minAge: 11, maxAge: 17, amount: 155 },
            ]
          : ['legoland-dubai', 'legoland-waterpark'].includes(s.id)
            ? [
                { minAge: 0, maxAge: 2, amount: 0 },
                { minAge: 3, maxAge: 17, amount: 295 },
              ]
            : [])
  Object.assign(pricing, {
    childPrices: childPrices.map((child) => ({
      ...child,
      sourceIds: update ? [`price-${s.id}`] : pricing.sourceIds,
    })),
  })
  if (s.id === 'dubai-frame')
    pricing.variants = [
      { label: 'Взрослый', type: 'adult', amount: 50, sourceIds: ['frame'] },
      { label: 'Дети 3–12 лет', type: 'child', amount: 20, sourceIds: ['frame'] },
    ]
  if (s.id === 'the-view-at-the-palm')
    pricing.variants = [
      { label: 'Standard • взрослый', type: 'standard', amount: 110, sourceIds: ['view'] },
      { label: 'Next Level • взрослый', type: 'premium', amount: 185, sourceIds: ['view'] },
    ]
  if (s.id === 'terra')
    pricing.variants = [
      { label: '12+ лет', type: 'adult', amount: 100, sourceIds: ['terra'] },
      { label: '4–11 лет', type: 'child', amount: 80, sourceIds: ['terra'] },
    ]
  if (s.id === 'sky-views')
    pricing.variants = [
      { label: 'Взрослый', type: 'adult', amount: 89, sourceIds: ['skyviews'] },
      { label: 'Ребёнок', type: 'child', amount: 69, sourceIds: ['skyviews'] },
      { label: 'Aquarium + Sky Views', type: 'combination', amount: 219, sourceIds: ['skyviews'] },
    ]
  if (update)
    Object.assign(pricing, {
      amount: update.amount,
      kind: update.amount === 0 ? 'free' : 'from',
      note: update.note,
      sourceIds: [`price-${s.id}`],
      checkedAt: '2026-10-03',
      variants: update.variants.map(([label, type, amount]) => ({
        label,
        type,
        amount,
        sourceIds: [`price-${s.id}`],
      })),
    })
  const offers =
    pricing.kind === 'free' || s.availability === 'temporarily-closed'
      ? []
      : [
          {
            providerId: 'official',
            url: officialWebsite,
            linkType: 'direct',
            price: pricing,
            russianCardSupport: officialPayment,
            checkedAt: pricing.checkedAt,
          },
        ]
  if (s.offer)
    offers.push({
      providerId: s.offer[0],
      url: s.offer[1],
      linkType: 'direct',
      price:
        s.id === 'the-view-at-the-palm'
          ? price(
              100,
              'review-view',
              'Стартовый тариф на странице продавца; слот и пакет могут отличаться.',
            )
          : price(
              undefined,
              s.review!.sourceIds[0],
              'Цена конкретного предложения на даты поездки не подтверждена.',
            ),
      russianCardSupport: s.offer[0] === 'sputnik8' ? sputnikPayment : tripsterPayment,
      checkedAt,
    })
  for (const [slug, providerId, url, note] of ticketLinks) {
    if (slug !== s.id || offers.some((offer) => offer.providerId === providerId)) continue
    offers.push({
      providerId,
      url,
      linkType: 'direct',
      price: {
        ...price(undefined, `ticket-${slug}-${providerId}`, note),
        checkedAt: ticketLinksCheckedAt,
      },
      russianCardSupport: providers.find((provider) => provider.id === providerId)!
        .russianCardSupport,
      checkedAt: ticketLinksCheckedAt,
    })
  }
  return {
    id: `dubai-${s.id}`,
    slug: s.id,
    destinationId: 'dubai',
    areaId: s.area,
    name: s.name,
    nameRu: s.nameRu,
    shortDescription: s.short,
    description: s.description,
    coordinates: { lat: s.coordinates[0], lng: s.coordinates[1] },
    coordinateNote:
      'Ориентировочная точка объекта или прогулочной зоны. Это не обязательно точный вход; сверяйте маршрут у оператора.',
    categories: [s.category],
    tags: s.tags,
    imageId: s.id in placePhotos ? placePhotos[s.id].imageId : s.image,
    gallery: galleries[s.id] ?? [],
    ...((s.id in placePhotos ? placePhotos[s.id].note : s.imageNote)
      ? { imageNote: s.id in placePhotos ? placePhotos[s.id].note : s.imageNote }
      : {}),
    duration: {
      minMinutes: s.minutes[0],
      maxMinutes: s.minutes[1],
      note:
        s.area === 'desert'
          ? 'Около шести часов на весь тур: дорога, программа и ужин. Время забора согласуем с оператором.'
          : s.area === 'hatta'
            ? 'На этот выезд лучше выделить целый день: здесь учтена и дорога.'
            : 'Примерно столько стоит заложить на прогулку и возможное ожидание. Можно задержаться, если понравится.',
    },
    openingHours: {
      text:
        hours?.text ??
        s.hours ??
        'Перед выездом посмотрим часы работы на сайте места — расписание на наши даты ещё нужно сверить.',
      sourceIds: hours ? [`hours-${hours.placeId}`] : sourceIds,
      checkedAt: hours?.checkedAt ?? s.checkedAt ?? checkedAt,
      schedule: hours?.schedule ?? (s.schedule ? { ...s.schedule, closedWeekdays: [] } : undefined),
      sessions: hours?.sessions,
      closedWeekdays: hours?.closedWeekdays,
    },
    availability: {
      opensOn: s.opensOn,
      status: s.availability ?? 'check-dates',
      note:
        s.availabilityNote ??
        (s.opensOn
          ? `Сезон начинается ${s.opensOn}. До этой даты место в план не ставим.`
          : 'Перед выездом сверим часы и билеты на выбранный день.'),
      sourceIds,
      checkedAt,
    },
    pricing,
    ticketProviders: offers,
    ...(reviewUpdates[s.id] || s.review ? { reviewInsights: reviewUpdates[s.id] ?? s.review } : {}),
    officialWebsite,
    bookingRecommended: s.booking ?? false,
    bestTime: [s.best],
    transport: { text: s.transport, sourceIds },
    sourceIds,
    updatedAt: s.checkedAt ?? checkedAt,
  }
})
const areaRows: [string, string, string, string, number, number][] = [
  [
    'downtown',
    'Downtown',
    'Даунтаун',
    'Главные городские символы, фонтаны и высотные панорамы.',
    25.197,
    55.276,
  ],
  [
    'business-bay',
    'Business Bay',
    'Бизнес-Бэй',
    'Вода, пешеходные мосты и современный город.',
    25.184,
    55.259,
  ],
  ['difc', 'DIFC', 'DIFC', 'Архитектура, галереи и ресторанная жизнь.', 25.215, 55.281],
  ['zabeel', 'Zabeel', 'Забиль', 'Парк и Рамка между старым и новым городом.', 25.234, 55.299],
  [
    'city-walk',
    'City Walk',
    'City Walk',
    'Городские прогулки и крытые впечатления.',
    25.208,
    55.263,
  ],
  ['jumeirah', 'Jumeirah', 'Джумейра', 'Публичные пляжи и узнаваемый отель-парус.', 25.173, 55.213],
  [
    'palm',
    'Palm Jumeirah',
    'Пальма Джумейра',
    'Искусственный остров, пляжи и Atlantis.',
    25.117,
    55.134,
  ],
  [
    'marina',
    'Dubai Marina / JBR',
    'Марина и JBR',
    'Небоскрёбы у воды и городской пляж.',
    25.08,
    55.138,
  ],
  [
    'bluewaters',
    'Bluewaters',
    'Bluewaters',
    'Островная прогулка и колесо Ain Dubai.',
    25.08,
    55.122,
  ],
  [
    'harbour',
    'Dubai Harbour',
    'Dubai Harbour',
    'Яхтенная гавань между Marina и Palm.',
    25.097,
    55.137,
  ],
  [
    'old-dubai',
    'Old Dubai / Bur Dubai',
    'Старый Дубай',
    'Creek, исторические кварталы и музейные дома.',
    25.266,
    55.297,
  ],
  ['deira', 'Deira', 'Дейра', 'Рынки по северную сторону Creek.', 25.271, 55.299],
  ['expo', 'Expo City', 'Expo City', 'Архитектура выставки и Terra.', 24.961, 55.151],
  [
    'jebel-ali',
    'JA / Jebel Ali',
    'JA и Джебель-Али',
    'Курортная база, водные активности и парки южнее города.',
    24.989,
    55.02,
  ],
  [
    'desert',
    'Dubai Desert / Lahbab',
    'Пустыня',
    'Дюны, сафари и закат за городом.',
    25.048,
    55.592,
  ],
  ['hatta', 'Hatta', 'Хатта', 'Горный выезд на отдельный день.', 24.783, 56.115],
]
export default {
  country: {
    id: 'uae',
    name: 'United Arab Emirates',
    nameRu: 'Объединённые Арабские Эмираты',
    isoCode: 'AE',
  },
  destination: {
    id: 'dubai',
    countryId: 'uae',
    name: 'Dubai',
    nameRu: 'Дубай',
    tagline: 'Море, город и пять дней вместе.',
    description:
      'Выбираем места на 6–10 октября: от прогулок у моря до садов и смотровых. Живём в JA Palm Tree Court и объединяем соседние места в один выезд.',
    center: { lat: 25.12, lng: 55.2 },
    heroImageId: 'hero',
    timezone: 'Asia/Dubai',
    climate: {
      text: 'В начале октября ещё жарко. Прогулки у моря и в городе удобнее планировать утром и вечером; это климатическая заметка, не прогноз.',
      sourceIds: ['climate'],
      checkedAt,
    },
    featuredAreaId: 'jebel-ali',
    featuredAreaComparisons: ['downtown', 'marina'],
  },
  trip: {
    destinationId: 'dubai',
    startDate: '2026-10-06',
    endDate: '2026-10-10',
    arrivalDate: '2026-10-05',
    departureDate: '2026-10-11',
    accommodation: {
      name: 'JA Palm Tree Court',
      address: 'JA The Resort, Jebel Ali, Sheikh Zayed Road, Exit 13',
      coordinates: { lat: 24.9873835, lng: 55.0219208 },
      website: 'https://www.jaresortshotels.com/dubai/ja-palm-tree-court',
      sourceIds: ['ja-palm-tree-court'],
      checkedAt: '2026-10-03',
    },
  },
  exchangeRate: {
    baseCurrency: 'AED',
    quoteCurrency: 'RUB',
    rate: 22.6672,
    usdRub: 83.2454,
    effectiveAt: checkedAt,
    checkedAt,
    sourceIds: ['fx'],
  },
  areas: [...areaRows, ...extraAreas].map(([id, name, nameRu, description, lat, lng]) => ({
    id,
    name,
    nameRu,
    description,
    destinationId: 'dubai',
    center: { lat, lng },
  })),
  providers,
  paymentRestrictions: [
    {
      title: 'Российские Visa и Mastercard',
      support: payment(
        'unavailable',
        'Через международные сети за пределами РФ не работают. Это ограничение этих систем, а не вывод обо всех российских картах, включая UnionPay и локальные способы оплаты.',
        ['visa', 'mastercard'],
        'russian-visa-mastercard',
      ),
    },
  ],
  sources,
  places,
}
