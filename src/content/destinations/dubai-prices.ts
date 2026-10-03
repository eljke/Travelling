export const priceUpdates = [
  {
    slug: 'lahbab-desert',
    amount: 1000,
    url: 'https://thekingofdesert.com/product/desert-safari-private-car-6',
    note: 'Пример пакета King of Desert: 1000 AED за частную машину до 6 гостей, около 6 часов, с трансфером, программой и ужином. Забор из JA и время подтверждаем отдельно. Это не тариф любого сафари. Возврат до 48 ч ограничен: до 10% денег или ваучер 40%.',
    variants: [
      ['Частная машина, до 6 человек', 'standard', 1000],
      ['Shared car, на человека', 'adult', 250],
    ],
  },
  {
    slug: 'green-planet',
    amount: 155,
    url: 'https://www.thegreenplanetdubai.com/en/day-pass?adventure=day-pass&date=',
    note: 'Day Pass, взрослый 11+. Детский 2–10 лет — 135 AED; до 2 лет бесплатно. Resident offers требуют Emirates ID и не использованы.',
    variants: [
      ['Взрослый 11+', 'adult', 155],
      ['Ребёнок 2–10 лет', 'child', 135],
    ],
  },
  {
    slug: 'ain-dubai',
    amount: 145,
    url: 'https://www.aindubai.com/en',
    note: 'Ain Dubai Views, стартовая цена официального пакета. Views Plus — от 195 AED; Premium — от 265 AED. Слот и состав выбираются отдельно.',
    variants: [
      ['Views', 'standard', 145],
      ['Views Plus', 'premium', 195],
      ['Premium', 'premium', 265],
    ],
  },
  {
    slug: 'legoland-dubai',
    amount: 295,
    url: 'https://www.legoland.com/dubai/tickets-passes/',
    note: 'Один день в тематическом парке при онлайн-покупке минимум за день. На месте — 330 AED; аквапарк не включён.',
    variants: [
      ['Онлайн заранее', 'standard', 295],
      ['На месте', 'standard', 330],
      ['Парк + аквапарк, онлайн', 'combination', 355],
    ],
  },
  {
    slug: 'legoland-waterpark',
    amount: 295,
    url: 'https://www.legoland.com/dubai/tickets-passes/',
    note: 'Один день в аквапарке при онлайн-покупке минимум за день. На месте — 330 AED; тематический парк не включён. Детям до 3 лет бесплатно, нужен документ.',
    variants: [
      ['Онлайн заранее', 'standard', 295],
      ['На месте', 'standard', 330],
      ['Парк + аквапарк, онлайн', 'combination', 355],
    ],
  },
  {
    slug: 'motiongate',
    amount: 295,
    url: 'https://www.dubaiparksandresorts.com/en/booking-details?date=07%2F10%2F2026&park=161',
    note: 'One Day Ticket: стартовый онлайн-тариф в календаре 7 октября 2026. Выбранная дата, доступность и состав проверяются при оформлении.',
    variants: [
      ['Один парк', 'standard', 295],
      ['Два парка в один день', 'combination', 355],
    ],
  },
  {
    slug: 'riverland',
    amount: 25,
    url: 'https://www.dubaiparksandresorts.com/en/riverland',
    note: 'Entry ticket — вход на территорию. Игровые активности и пакеты Standard/Plus/Premium оплачиваются отдельно.',
    variants: [
      ['Вход', 'standard', 25],
      ['Standard Package', 'combination', 79],
      ['Plus Package', 'combination', 99],
    ],
  },
  {
    slug: 'ja-beach',
    amount: 150,
    url: 'https://source.jaresortshotels.com/offer-detail/pool-beach-day-experience',
    note: 'Day pass для внешних посетителей: пн–чт 150 AED, пт–вс 200 AED. Зачёт суммы на еду и напитки в указанных ресторанах; бронь за 24 ч. Гостям JA Palm Tree Court проверьте включённый в проживание доступ — отдельный day pass может не требоваться.',
    variants: [
      ['Пн–чт', 'standard', 150],
      ['Пт–вс', 'standard', 200],
      ['Дети 6–12 лет', 'child', 75],
    ],
  },
  {
    slug: 'expo-city',
    amount: 0,
    url: 'https://www.expocitydubai.com/en/plan-your-visit/',
    note: 'Прогулка по городу и Al Wasl Plaza без входного билета. Павильоны, события и отдельные аттракционы оплачиваются отдельно.',
    variants: [],
  },
  {
    slug: 'aquaventure',
    amount: 285,
    url: 'https://experiences.visitdubai.com/productDetail/39356',
    note: 'Atlantis Aquaventure Day Pass на официальной туристической платформе Visit Dubai — от 285 AED. На информационной странице встречается тариф от 345 AED; цена зависит от продукта и даты. Это дневной аквапарк, не After Dark.',
    variants: [],
  },
  {
    slug: 'hatta-dam',
    amount: 60,
    url: 'https://hattakayak.com/our-boats',
    note: 'Цена активности: одноместный каяк для взрослого 16+, не входной билет на водохранилище. Двухместный каяк — 120 AED за лодку. Дорога из отеля, экскурсия и другие активности отдельно.',
    variants: [
      ['Один каяк, 1 взрослый', 'standard', 60],
      ['Двойной каяк, за лодку', 'combination', 120],
    ],
  },
  {
    slug: 'the-view-at-the-palm',
    amount: 115,
    url: 'https://www.theviewpalm.ae/en',
    note: 'Standard Admission — стартовый взрослый тариф. Next Level — от 190 AED; выбранный слот и пакет могут менять цену.',
    variants: [
      ['Standard Admission', 'standard', 115],
      ['Next Level', 'premium', 190],
    ],
  },
  {
    slug: 'jumeirah-mosque',
    amount: 55,
    url: 'https://www.jumeirahmosque.ae/mosque-visit-public/',
    note: 'Публичный визит: 55 AED за человека, лёгкое угощение и активности Majlis включены. Суббота–четверг, сеансы 10:00 и 14:00; предварительная бронь не требуется.',
    variants: [],
  },
] as const
