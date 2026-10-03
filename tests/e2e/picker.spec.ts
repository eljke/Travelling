import { test, expect } from '@playwright/test'

test('chooses a date explicitly and searches nearby places for that day', async ({ page }) => {
  await page.goto('/#/dubai/place/dubai-mall')
  await page
    .locator('.place-story')
    .getByRole('button', { name: 'В план: Дубай Молл', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Выбрать день: Дубай Молл' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /День 2/ }).click()
  await page
    .locator('.place-story')
    .getByRole('link', { name: /В плане/ })
    .click()
  await expect(page.locator('.plan-day-tab.active')).toContainText('День 2')
  const picker = page.locator('.plan-picker')
  await expect(picker.locator('.picker-recommendations')).toContainText('Можно совместить')
  await picker.getByLabel('Поиск места').fill('рамка')
  await expect(picker.locator('.picker-card')).toHaveCount(1)
  await expect(picker.locator('.picker-card img')).toBeVisible()
  await expect(picker.locator('.picker-preview')).toContainText('Возврат')
  await picker.getByRole('button', { name: 'Добавить: Дубайская рамка', exact: true }).click()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(2)
  await page.reload()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(2)
  await page.setViewportSize({ width: 360, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
