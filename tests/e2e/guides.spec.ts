import { test, expect } from '@playwright/test'

test('prioritizes the family trip and shows photo spots with practical choices', async ({
  page,
}) => {
  await page.goto('/#/dubai')
  await expect(page.locator('.place-card').first()).toContainText('Фонтаны Дубая')
  await expect(page.locator('.place-card').nth(1)).toContainText('Мадинат Джумейра')
  await page.locator('.viewpoint-comparison summary').click()
  await expect(page.locator('.viewpoint-comparison')).toContainText('не мировой рейтинг')
  await page.goto('/#/dubai/place/madinat-jumeirah')
  await expect(page.getByRole('region', { name: 'Фотозоны' })).toContainText('мостики')
  await expect(page.locator('.place-story')).toContainText('20 минут')
  await page.goto('/#/dubai/photos?place=dubai-dubai-mall')
  await page.getByText('Добавить наши фотографии', { exact: true }).click()
  const selected = page.locator('.place-selection').first()
  await expect(selected.locator('summary img')).toBeVisible()
  await expect(selected.locator('.place-picker')).toBeHidden()
})
