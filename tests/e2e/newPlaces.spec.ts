import { test, expect } from '@playwright/test'

test('finds new experiences with dated evidence and honest package prices', async ({ page }) => {
  await page.goto('/#/dubai?q=AYA')
  const card = page.locator('.place-card').filter({ hasText: 'AYA — мир света' })
  await expect(card).toBeVisible()
  await card.getByRole('heading').getByRole('link').click()
  await expect(page.locator('.price-variants')).toContainText('4 гостя · при наличии')
  await expect(page.locator('.booking-family-price')).toContainText('540')
  await expect(page.locator('.review-section')).toContainText('июнь–август 2026')
  await page.goto('/#/dubai/place/crocodile-park')
  await page.getByLabel('Чьи расходы показать', { exact: true }).selectOption('family-2')
  await expect(page.locator('.booking-family-price')).toContainText('170')
  await page.goto('/#/dubai/place/souk-al-bahar')
  await expect(page.locator('.place-hero img')).toHaveAttribute('src', /souk-al-bahar/)
  await expect(page.getByRole('region', { name: 'Фотозоны' })).toBeVisible()
})
