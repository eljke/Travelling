import { test, expect } from '@playwright/test'

test('builds a day for six, optimizes it and retains limits', async ({ page }) => {
  await page.goto('/#/dubai/plan')
  await page
    .locator('.day-ideas:visible article')
    .filter({ hasText: 'Downtown за один выезд' })
    .getByRole('button')
    .click()
  const planner = page.getByRole('region', { name: 'Маршрут на день' })
  await expect(planner.getByRole('combobox', { name: 'Взрослые', exact: true })).toHaveValue('5')
  await expect(planner.getByRole('combobox', { name: 'Возраст ребёнка', exact: true })).toHaveValue(
    '11',
  )
  await expect(planner.getByRole('combobox', { name: 'Такси', exact: true })).toHaveValue('max')
  await planner.getByRole('button', { name: 'Оптимизировать день', exact: true }).click()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(4)
  await expect(planner.locator('.route-result')).toContainText('Укладываемся')
  await expect(planner.locator('.route-timeline')).toContainText(
    '09:00 · Выезд из JA Palm Tree Court',
  )
  await planner.getByLabel('Вернуться в отель до', { exact: true }).fill('10:00')
  await expect(planner.locator('.route-result')).toContainText('Нужно сократить день')
  await page.reload()
  await expect(page.getByLabel('Вернуться в отель до', { exact: true })).toHaveValue('10:00')
  await expect(page.locator('.plan-stop:visible')).toHaveCount(4)
})

test('respects seasonal dates and booked admission', async ({ page }) => {
  await page.goto('/#/dubai/plan')
  const gardens = page.locator('.day-ideas:visible article').filter({ hasText: 'Два сада рядом' })
  await expect(gardens.getByRole('button')).toBeDisabled()
  await page.getByRole('button', { name: /День 3/ }).click()
  await gardens.getByRole('button').click()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(2)
  await page.getByLabel('Вход по билету: Сад цветов Miracle Garden', { exact: true }).fill('09:00')
  await expect(page.locator('.route-result:visible')).toContainText(
    'Нужно изменить дату или время входа',
  )
  await page.getByLabel('Вход по билету: Сад цветов Miracle Garden', { exact: true }).fill('13:00')
  await page.getByLabel('Время на месте: Сад цветов Miracle Garden', { exact: true }).fill('60')
  await page.getByRole('button', { name: 'Оптимизировать день', exact: true }).click()
  await expect(page.locator('.route-result:visible')).toContainText('Укладываемся')
  await expect(page.locator('.route-timeline:visible')).toContainText('13:00')
  await page.setViewportSize({ width: 360, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})
