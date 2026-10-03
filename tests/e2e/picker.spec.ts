import { test, expect } from '@playwright/test'

test('compares days with photos and adds an overflowing place to the nearby day', async ({
  page,
}) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  await page.getByRole('button', { name: 'Применить minmax на все пять дней', exact: true }).click()
  const picker = page.locator('.plan-picker')
  await picker.getByLabel('Поиск места').fill('Sky Views')
  const card = picker.locator('[data-place-id="dubai-sky-views"]')
  await expect(card).toContainText('Нужно скорректировать день')
  await card.getByRole('button', { name: 'В план: Sky Views', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Выбрать день: Sky Views', exact: true })
  const recommended = dialog.locator('.day-choice.recommended')
  await expect(recommended).toContainText('9 октября')
  await expect(recommended).toContainText('По пути')
  await expect(recommended).toContainText('₽')
  await expect(recommended.locator('img')).toBeVisible()
  await expect(dialog.getByRole('button', { name: /День 1/ })).toContainText(
    'Нужно скорректировать день',
  )
  expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(3)
  await card.getByRole('button', { name: 'В план: Sky Views', exact: true }).click()
  await recommended.click()
  await expect(page.getByRole('region', { name: 'День 4', exact: true })).toBeFocused()
  await expect(page.locator('.plan-stops:visible')).toContainText('Sky Views')
  await page.reload()
  await expect(page.locator('.plan-stops:visible')).toContainText('Sky Views')
  await page
    .getByRole('group', { name: 'Дни поездки', exact: true })
    .getByRole('button', { name: /День 1/ })
    .click()
  await expect(page.getByLabel('Время на месте: Дубай Молл', { exact: true })).toHaveValue('360')
  await expect(page.getByLabel('Время на месте: Фонтаны Дубая', { exact: true })).toHaveValue('45')
})

test('adds a daytime stop before an evening visit using the displayed preview', async ({
  page,
}) => {
  await page.goto('/#/dubai/place/dubai-fountain')
  await page
    .locator('.place-story')
    .getByRole('button', { name: 'В план: Фонтаны Дубая', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /День 1/ })
    .click()
  await page.getByRole('link', { name: 'План', exact: true }).click()
  await page.getByLabel('Вход по билету: Фонтаны Дубая', { exact: true }).fill('19:00')
  const picker = page.locator('.plan-picker')
  await picker.getByLabel('Поиск места').fill('Дубай Молл')
  await picker.getByLabel('Помещается в день').check()
  const card = picker.locator('[data-place-id="dubai-dubai-mall"]')
  await expect(card).toContainText('Перед: Фонтаны Дубая')
  const returnAt = (await card.locator('.picker-preview').innerText()).match(
    /Возврат ≈ ([0-9:]+)/,
  )![1]
  await card.getByRole('button', { name: 'Добавить: Дубай Молл', exact: true }).click()
  await expect(page.locator('.plan-stop:visible').first()).toContainText('Дубай Молл')
  await expect(page.locator('.route-result:visible')).toContainText('Укладываемся')
  await expect(page.locator('.route-timeline:visible')).toContainText(
    `${returnAt} · Возвращение в отель`,
  )
  await page.reload()
  await expect(page.locator('.plan-stop:visible').first()).toContainText('Дубай Молл')
  await expect(page.getByLabel('Вход по билету: Фонтаны Дубая', { exact: true })).toHaveValue(
    '19:00',
  )
})

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
