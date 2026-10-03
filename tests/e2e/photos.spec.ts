import { test, expect } from '@playwright/test'

test('shows each outlet with its own photo and labels missing photos', async ({ page }) => {
  await page.goto('/#/dubai/place/dubai-mall')
  const mall = await page.locator('.place-hero img').getAttribute('src')
  await page.goto('/#/dubai/place/dubai-outlet-mall')
  await expect(page.locator('.place-hero img')).not.toHaveAttribute('src', mall!)
  await expect(page.locator('.image-credit')).toContainText('2010')
  await page.goto('/#/dubai/place/outlet-village')
  await expect(page.locator('.place-hero img')).toHaveAttribute('src', /outlet-village/)
  await page.goto('/#/dubai/place/sky-views')
  await expect(page.locator('.place-hero')).toContainText('Фото этого места пока нет')
  await expect(page.locator('.image-credit a')).toHaveAttribute('href', /skyviews/)
})

test('loads another place after a failed photo and shows the actual Atlantis gallery', async ({
  page,
}) => {
  await page.route('**/images/mall-*.webp', (route) => route.abort())
  await page.goto('/#/dubai/photos?place=dubai-dubai-mall')
  await page.getByText('Добавить наши фотографии', { exact: true }).click()
  const places = page.locator('.album-upload .place-selection')
  await expect(places.locator('summary')).toContainText('Фотография недоступна')
  await places.locator('summary').click()
  await places.getByLabel('Поиск места').fill('Дубайская рамка')
  await places.getByRole('button', { name: 'Выбрать: Дубайская рамка', exact: true }).click()
  await expect(places.locator('summary img')).toHaveAttribute('src', /frame-/)
  await page.goto('/#/dubai/place/lost-world-aquarium')
  await expect(page.locator('.place-hero img')).toHaveAttribute('src', /lost-tank/)
  await expect(page.locator('.image-credit')).toContainText('до обновления Lost World')
  await expect(page.locator('.gallery-grid figure')).toHaveCount(2)
})
