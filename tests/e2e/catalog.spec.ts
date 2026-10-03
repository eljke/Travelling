import { test, expect } from '@playwright/test'

test('finds shopping centers and keeps the section focused', async ({ page }) => {
  await page.goto('/#/dubai/shopping')
  await expect(page.getByRole('heading', { name: 'Торговые центры.' })).toBeVisible()
  await expect(page.locator('.place-card')).toHaveCount(8)
  await page.getByRole('searchbox', { name: 'Поиск мест' }).fill('Outlet')
  await expect(page.locator('.place-card')).toHaveCount(2)
  await page.reload()
  await expect(page.locator('.place-card')).toHaveCount(2)
})

test('opens the changelog through the footer', async ({ page }) => {
  await page.goto('/#/dubai')
  await page.getByRole('link', { name: /v\d+\.\d+\.\d+ · Что нового/ }).click()
  await expect(page.getByRole('heading', { name: 'Что нового.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Полный журнал изменений ↗' })).toHaveAttribute(
    'href',
    /CHANGELOG\.md$/,
  )
})
