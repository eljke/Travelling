export const placePhotos: Record<string, { imageId?: string; note?: string }> = {
  'dubai-outlet-mall': {
    imageId: 'outlet-mall',
    note: 'Интерьер Dubai Outlet Mall, 2010 год. Архивный снимок не подтверждает нынешний состав магазинов.',
  },
  'outlet-village': {
    imageId: 'outlet-village',
    note: 'The Outlet Village в Дубае, архивный снимок.',
  },
  'global-village': { imageId: 'global-village' },
  'the-view-at-the-palm': {
    imageId: 'view-palm',
    note: 'Вид со смотровой над Nakheel Mall, 2023 год.',
  },
  'inside-burj-al-arab': {
    imageId: 'burj-arab-interior',
    note: 'Интерьер Burj Al Arab, 2007 год. Это архивное фото, а не подтверждение нынешнего маршрута экскурсии.',
  },
  'difc-gate-avenue': {
    imageId: 'difc-gate',
    note: 'The Gate Building — архитектура района DIFC, фото с сайта Gensler.',
  },
  terra: { imageId: 'terra-official' },
  'palm-west-beach': { imageId: 'west-beach-official' },
  'ja-watersports': { imageId: 'ja-water-official' },
  'legoland-waterpark': { imageId: 'legoland-water-official' },
  'sky-views': {},
  'lost-world-aquarium': {
    imageId: 'lost-tank',
    note: 'Аквариум Atlantis The Palm под прежним названием Lost Chambers. Архивный снимок до обновления Lost World; нынешнее оформление залов может отличаться.',
  },
}
export const galleries: Record<string, { imageId: string; caption: string }[]> = {
  'outlet-village': [
    { imageId: 'outlet-village-roof', caption: 'Архитектура внутри The Outlet Village' },
  ],
  'burj-khalifa': [
    { imageId: 'burj-deck', caption: 'На смотровой At the Top — архивный снимок' },
    { imageId: 'burj-city', caption: 'Город с высоты Burj Khalifa — архивный снимок' },
  ],
  'dubai-fountain': [
    { imageId: 'fountain-show', caption: 'Фонтаны во время вечернего представления' },
    { imageId: 'burj', caption: 'Burj Khalifa рядом с озером фонтанов' },
  ],
  'dubai-frame': [
    { imageId: 'frame-deck', caption: 'Смотровая внутри Dubai Frame' },
    { imageId: 'frame-view', caption: 'Панорама со смотровой Dubai Frame' },
  ],
  'dubai-aquarium': [
    { imageId: 'aquarium-tunnel', caption: 'Морские обитатели аквариума Dubai Mall' },
    { imageId: 'mall', caption: 'Dubai Mall, в котором находится аквариум' },
  ],
  'dubai-mall': [
    { imageId: 'aquarium-tunnel', caption: 'Аквариум внутри Dubai Mall' },
    { imageId: 'fountain-show', caption: 'Вечерние фонтаны рядом с Dubai Mall' },
  ],
  'the-view-at-the-palm': [
    {
      imageId: 'palm-coast',
      caption: 'Побережье Palm Jumeirah — контекст района, не вид со смотровой',
    },
  ],
  'palm-jumeirah': [{ imageId: 'palm-coast', caption: 'Побережье и застройка Palm Jumeirah' }],
  'dubai-marina-walk': [{ imageId: 'marina-skyline', caption: 'Небоскрёбы Dubai Marina у воды' }],
  'jumeirah-mosque': [
    { imageId: 'mosque-courtyard', caption: 'Фасад мечети Джумейра и площадь перед ней' },
  ],
  'madinat-jumeirah': [
    { imageId: 'madinat-canals', caption: 'Лодка на каналах Madinat Jumeirah — архивный снимок' },
    {
      imageId: 'madinat-bridge',
      caption: 'Каналы, мост и Burj Al Arab на горизонте — архивный снимок',
    },
    {
      imageId: 'madinat-boat',
      caption: 'Причал лодок среди арабской архитектуры — архивный снимок',
    },
  ],
  'lost-world-aquarium': [
    {
      imageId: 'lost-jellyfish',
      caption: 'Медузы в Atlantis The Palm — архивный снимок Lost Chambers',
    },
  ],
}
