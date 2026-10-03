import type { Place } from '../../domain/model'

export const queues: Record<
  string,
  { queue: NonNullable<Place['queue']>; minutes: [number, number] }
> = {
  'burj-khalifa': {
    minutes: [60, 90],
    queue: {
      minutes: 60,
      peakMinutes: 120,
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
      checkedAt: '2026-10-03',
      sourceIds: ['review-aquarium', 'review-aquarium-current'],
      note: 'Добавляем 20 минут на обмен билета и вход. В загруженные часы можно заложить 45; активности внутри зависят от пакета.',
    },
  },
}
