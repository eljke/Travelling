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
