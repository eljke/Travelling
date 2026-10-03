export const galleries: Record<string, { imageId: string; caption: string }[]> = {
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
  'dubai-marina': [{ imageId: 'marina-skyline', caption: 'Небоскрёбы Dubai Marina у воды' }],
  'jumeirah-mosque': [
    { imageId: 'mosque-courtyard', caption: 'Фасад мечети Джумейра и площадь перед ней' },
  ],
  'madinat-jumeirah': [
    { imageId: 'madinat-canals', caption: 'Лодка на каналах Madinat Jumeirah — архивный снимок' },
  ],
}
