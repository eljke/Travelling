import type { PaymentSupport, Place } from '../domain/model'

export const categoryLabels: Record<Place['categories'][number], string> = {
  shopping: 'Торговый центр',
  attraction: 'Достопримечательность',
  viewpoint: 'Смотровая',
  architecture: 'Архитектура',
  museum: 'Музей',
  beach: 'Пляж',
  waterpark: 'Аквапарк',
  'theme-park': 'Парк развлечений',
  desert: 'Пустыня',
  'old-city': 'Старый город',
  walk: 'Прогулка',
  experience: 'Впечатление',
  nature: 'Природа',
  'food-view': 'Еда с видом',
  'hidden-gem': 'Особое место',
}
export const paymentLabels: Record<PaymentSupport['status'], string> = {
  confirmed: 'Можно оплатить картой РФ',
  likely: 'Зависит от способа оплаты',
  unavailable: 'Оплата недоступна',
  unknown: 'Приём карты РФ не подтверждён',
}
export const tagLabels: Record<string, string> = {
  shopping: 'Покупки',
  indoors: 'В помещении',
  outdoors: 'На свежем воздухе',
  'must-see': 'Обязательно увидеть',
  sunset: 'На закате',
  evening: 'Вечером',
  kids: 'С детьми',
  couple: 'Вдвоём',
  photos: 'Для фото',
  beach: 'У моря',
  extreme: 'Адреналин',
  'russian-card': 'Оплата картой РФ',
  booking: 'Бронь заранее',
  free: 'Бесплатно',
}
export const ui = {
  brand: 'elsewhere',
  search: 'Место, район или настроение',
  favorites: 'Избранное',
  catalog: 'Места',
  map: 'Карта',
  allAreas: 'Все районы',
  allTypes: 'Любой тип',
  allPrices: 'Любая цена',
  allDurations: 'Любое время',
  reset: 'Сбросить фильтры',
  sources: 'Источники и актуальность',
  nearby: 'Что рядом',
  disclaimer:
    'Цены, способы оплаты и часы работы могут меняться. Курс ориентировочный. Перед покупкой проверьте условия продавца.',
}
