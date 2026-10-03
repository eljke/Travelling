import type { Place } from '../../domain/model'

export const queues: Record<
  string,
  { queue: NonNullable<Place['queue']>; minutes?: [number, number] }
> = {
  'aya-universe': {
    queue: {
      minutes: 15,
      peakMinutes: 30,
      peakAfter: 16,
      seasonal: true,
      checkedAt: '2026-10-03',
      sourceIds: ['aya', 'review-aya'],
      note: 'Плановый запас на проверку билетов. К открытию в прочитанном отзыве было мало людей, но это не обещание отсутствия очереди; выходные и вечер считаем с большим запасом.',
    },
  },
  'crocodile-park': {
    queue: {
      minutes: 10,
      peakMinutes: 20,
      peakAfter: 16,
      seasonal: true,
      checkedAt: '2026-10-03',
      sourceIds: ['crocodile'],
      note: 'Наш запас на вход и проверку билетов, а не опубликованный замер очереди. Посещение аквариума и музея уже входит во время на месте.',
    },
  },
  'burj-khalifa': {
    minutes: [60, 90],
    queue: {
      minutes: 60,
      peakMinutes: 120,
      peakAfter: 15,
      seasonal: true,
      checkedAt: '2026-10-03',
      sourceIds: ['review-burj', 'review-burj-recent'],
      note: 'В отзывах ожидание сильно различается. Для нашего маршрута добавляем час отдельно от смотровой; в популярные часы разумно увеличить запас до двух. Онлайн-билет не гарантирует быстрый лифт.',
    },
  },
  'dubai-frame': {
    minutes: [45, 60],
    queue: {
      minutes: 45,
      peakMinutes: 90,
      peakAfter: 16,
      seasonal: true,
      checkedAt: '2026-10-03',
      sourceIds: ['review-frame'],
      note: 'Ожидание у входа и лифта меняется от визита к визиту. Закладываем 45 минут отдельно от прогулки внутри, в выходной или перед закатом можно увеличить запас до 90 минут. Это запас для плана, а не замер очереди.',
    },
  },
  'the-view-at-the-palm': {
    minutes: [45, 60],
    queue: {
      minutes: 30,
      peakMinutes: 60,
      peakAfter: 16,
      seasonal: true,
      checkedAt: '2026-10-03',
      sourceIds: ['review-view', 'review-view-queues'],
      note: 'Для контроля билетов и подъёма добавляем полчаса. Перед закатом можно заложить час; ускоренный проход зависит от конкретного билета.',
    },
  },
  'sky-views': {
    minutes: [45, 60],
    queue: {
      minutes: 20,
      peakMinutes: 45,
      peakAfter: 16,
      seasonal: true,
      checkedAt: '2026-10-03',
      sourceIds: ['review-skyviews', 'review-skyviews-current'],
      note: 'Добавляем 20 минут на вход. Ожидание дополнительных активностей может потребовать больше времени; горку и Edge Walk проверяем по своему пакету.',
    },
  },
  'dubai-aquarium': {
    minutes: [60, 90],
    queue: {
      minutes: 20,
      peakMinutes: 45,
      peakAfter: 16,
      seasonal: true,
      checkedAt: '2026-10-03',
      sourceIds: ['review-aquarium', 'review-aquarium-current'],
      note: 'Добавляем 20 минут на обмен билета и вход. В загруженные часы можно заложить 45; активности внутри зависят от пакета.',
    },
  },
}

const planningBuffers: [string, number, number, string, string][] = [
  [
    'miracle-garden',
    20,
    40,
    'miracle-garden',
    'В первые дни нового сезона и вечером у входа может быть людно. Онлайн-билет помогает избежать покупки в кассе.',
  ],
  [
    'butterfly-garden',
    15,
    30,
    'butterfly-garden',
    'Запас на проверку билетов; внутри куполов гуляем в своём темпе.',
  ],
  [
    'aquaventure',
    30,
    60,
    'aquaventure',
    'Это запас на вход и получение доступа. Очереди на горки зависят от выбора аттракционов и входят в длительность дня в аквапарке.',
  ],
  [
    'lost-world-aquarium',
    15,
    30,
    'aquaventure',
    'Запас на вход; совместный билет не означает быстрый проход на все активности.',
  ],
  [
    'ain-dubai',
    30,
    60,
    'ain',
    'Контроль билетов и посадка; прибытие к купленному сеансу планируем заранее.',
  ],
  [
    'inside-burj-al-arab',
    30,
    45,
    'inside-burj',
    'Встреча и регистрация перед туром. Время из подтверждения брони важнее этого ориентира.',
  ],
  ['green-planet', 15, 30, 'greenplanet', 'Проверка билетов и вход в крытую экспозицию.'],
  [
    'ski-dubai',
    30,
    45,
    'ski-dubai',
    'Запас включает регистрацию и выдачу экипировки, отдельно от времени активности.',
  ],
  [
    'motiongate',
    20,
    40,
    'motiongate',
    'Это только вход. Ожидание отдельных аттракционов оставляем внутри полноценного дня в парке.',
  ],
  [
    'legoland-dubai',
    20,
    40,
    'legoland',
    'Контроль у входа; очереди на аттракционы зависят от программы и входят во время посещения парка.',
  ],
  [
    'legoland-waterpark',
    20,
    40,
    'legoland',
    'Запас на вход и подготовку; ожидание горок входит во время в аквапарке.',
  ],
  [
    'global-village',
    20,
    45,
    'global-village',
    'Вечерний вход и выходные обычно требуют больше запаса. Дату сезонного открытия проверяем отдельно.',
  ],
  [
    'creek-abra',
    10,
    20,
    'free-guide',
    'Небольшой запас на посадку. Конкретный причал и оплату уточняем на месте.',
  ],
  [
    'jumeirah-mosque',
    30,
    30,
    'mosque',
    'Время на регистрацию перед экскурсией, а не очередь на свободную прогулку.',
  ],
  ['al-shindagha-museum', 10, 20, 'shindagha', 'Запас на билеты и вход в первую экспозицию.'],
  [
    'museum-of-the-future',
    30,
    45,
    'future',
    'Запас на регистрацию только после подтверждения открытия и сеанса. Закрытие в расчёте по-прежнему учитывается.',
  ],
  [
    'dubai-mall',
    0,
    0,
    'mall',
    'У обычной прогулки по торговому центру нет билетной очереди. Платные развлечения считаем отдельно.',
  ],
  [
    'madinat-jumeirah',
    0,
    0,
    'jumeirah',
    'Свободная прогулка по souk без билетной очереди. Для лодки время ожидания и билет уточняем отдельно.',
  ],
  [
    'dubai-fountain',
    15,
    30,
    'fountain',
    'Это время занять удобное место у набережной, а не билетная очередь. Ожидание вечернего шоу учитывается отдельно.',
  ],
]
for (const [slug, minutes, peakMinutes, source, note] of planningBuffers) {
  queues[slug] = {
    queue: {
      minutes,
      peakMinutes,
      peakAfter: slug === 'global-village' ? 18 : 16,
      seasonal: true,
      sourceIds: [source],
      checkedAt: '2026-10-03',
      note: `${note} Числа — наш ориентир для планирования, не статистика оператора. В октябре–апреле, в субботу и воскресенье или после указанного времени маршрут добавляет повышенный запас; в остальные месяцы ориентир ниже.`,
    },
  }
}
