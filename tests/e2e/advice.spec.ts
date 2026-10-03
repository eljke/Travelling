import { test, expect } from '@playwright/test'

test('keeps a separate queue buffer and offers a shorter viable day', async ({ page }) => {
  await page.goto('/#/dubai/place/dubai-frame')
  await expect(page.getByRole('region', { name: 'Очереди и время' })).toContainText('45–90 мин')
  await page
    .locator('.place-story')
    .getByRole('button', { name: 'В план: Дубайская рамка', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /День 1/ })
    .click()
  await page
    .locator('.place-story')
    .getByRole('link', { name: /В плане/ })
    .click()
  await expect(page.getByLabel('Запас на очередь: Дубайская рамка', { exact: true })).toHaveValue(
    '45',
  )
  await expect(page.locator('.route-timeline:visible')).toContainText('Запас на очередь: 45 мин')
  await page.getByLabel('Запас на очередь: Дубайская рамка', { exact: true }).fill('90')
  await page.reload()
  await expect(page.getByLabel('Запас на очередь: Дубайская рамка', { exact: true })).toHaveValue(
    '90',
  )
  await page.getByRole('button', { name: 'Убрать из плана: Дубайская рамка', exact: true }).click()
  const picker = page.locator('.plan-picker')
  await picker.getByLabel('Поиск места').fill('Дубай Молл')
  await picker.getByRole('button', { name: 'Добавить: Дубай Молл', exact: true }).click()
  await page.getByLabel('Вернуться в отель до', { exact: true }).fill('15:30')
  const shorter = page
    .getByRole('region', { name: 'Как улучшить день' })
    .locator('article')
    .filter({ hasText: 'Сделать часть посещений короче' })
  await expect(shorter).toContainText('180 → 120 мин')
  await shorter.getByRole('button', { name: 'Применить вариант', exact: true }).click()
  await expect(page.locator('.route-result:visible')).toContainText('Укладываемся')
  await expect(page.getByLabel('Время на месте: Дубай Молл', { exact: true })).toHaveValue('120')
})
