import { test, expect } from '@playwright/test'

test('shows rubles for ticket variants, day budgets and transport', async ({ page }) => {
  await page.goto('/#/dubai/place/green-planet')
  await expect(page.locator('.price-variants li').first()).toContainText('₽')
  await page.goto('/#/dubai/plan')
  await page
    .locator('.day-ideas:visible article')
    .filter({ hasText: 'Марина и море' })
    .getByRole('button')
    .click()
  await expect(page.locator('.route-options:visible button').first()).toContainText('₽')
  await expect(page.locator('.route-budget:visible > div').first()).toContainText('₽')
  await expect(page.locator('.route-leg:visible').first()).toContainText('₽')
  await expect(
    page.locator('.plan-stop:visible').filter({ hasText: 'Колесо Ain Dubai' }),
  ).toContainText('₽')
  await page.setViewportSize({ width: 360, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})
