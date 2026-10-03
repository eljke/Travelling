import { test, expect } from '@playwright/test'

test('shows the period and actual review sources', async ({ page }) => {
  await page.goto('/#/dubai/place/aquaventure')
  await expect(page.getByRole('heading', { name: 'Что говорят после визита.' })).toBeVisible()
  await expect(page.locator('.review-coverage')).toContainText('Февраль–июль 2026')
  await expect(page.locator('.review-consensus')).toContainText('очереди оказались очень разными')
  await expect(
    page.getByRole('link', { name: /Aquaventure • отзывы посетителей 2026/ }).first(),
  ).toHaveAttribute('href', /2244-atlantis-aquaventure/)
})

test('shows dated Russian Madinat impressions and the AYA sample period', async ({ page }) => {
  await page.goto('/#/dubai/place/madinat-jumeirah')
  await expect(page.locator('.review-coverage')).toContainText('Март–ноябрь 2025 · Русский')
  await expect(page.locator('.review-consensus')).toContainText('прогулки у воды')
  await expect(
    page.getByRole('link', { name: 'Мадинат • русскоязычные впечатления 2025' }).first(),
  ).toHaveAttribute('href', /20956/)
  await page.goto('/#/dubai/place/aya-universe')
  await expect(page.locator('.review-coverage')).toContainText('Июнь–август 2026 · Английский')
})
