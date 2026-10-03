import { test, expect } from '@playwright/test'

test('opens a suggested day and preserves the date in the address', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Дубай\. Вместе\./ })).toBeVisible()
  await expect(page.locator('.family-ticket')).toContainText('JA Palm Tree Court')
  await page.getByRole('link', { name: /Цветы и бабочки в один день/ }).click()
  await expect(page.getByRole('button', { name: /День 3/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: /День 4/ }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: /День 4/ })).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/')
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  }
})
