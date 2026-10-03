import { test, expect } from '@playwright/test'

test('compares dated Trip.com packages without hiding their restrictions', async ({ page }) => {
  await page.goto('/#/dubai/place/the-view-at-the-palm#purchase')
  const view = page.locator('.provider-row').filter({ hasText: 'Trip.com' })
  await expect(view).toContainText('2 298'.replace(' ', '\u00a0'))
  await expect(view).toContainText('Дети 3–12 лет — 1 572 ₽')
  await expect(view).toContainText('10:00–15:30')
  await expect(view).toContainText('Без возврата')
  await expect(view).toContainText('Цена проверена 3 октября 2026')
  await expect(view.getByRole('link', { name: 'Открыть билет' })).toHaveAttribute(
    'href',
    'https://ru.trip.com/things-to-do/detail/103874472/',
  )
  await page.goto('/#/dubai/place/aquaventure#purchase')
  const park = page.locator('.provider-row').filter({ hasText: 'Trip.com' })
  await expect(park).toContainText('5 029'.replace(' ', '\u00a0'))
  await expect(park).toContainText('из JA нужно выехать раньше')
  await expect(park).toContainText('WhatsApp')
  await page.goto('/#/dubai/place/miracle-garden#purchase')
  const garden = page.locator('.provider-row').filter({ hasText: 'Trip.com' })
  await expect(garden).toContainText('Цена уточняется')
  await expect(garden).toContainText('отдельный входной билет не показан')
  await expect(garden.getByRole('link', { name: 'Открыть билет' })).toHaveAttribute(
    'href',
    /dubai-miracle-garden-15053335/,
  )
})
