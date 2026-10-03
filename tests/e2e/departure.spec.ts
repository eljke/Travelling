import { test, expect } from '@playwright/test'

test('keeps ticket purchases separate and carries them into backups and print', async ({
  page,
}) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  await page.getByRole('button', { name: 'Применить minmax на все пять дней', exact: true }).click()
  await page.getByRole('button', { name: /День 3/ }).click()
  const checklist = page
    .getByRole('region', { name: 'День 3', exact: true })
    .getByRole('group', { name: 'Подготовка к выезду', exact: true })
  await checklist.locator('summary').click()
  const firstName = 'Билеты куплены: Сад цветов Miracle Garden · Семья 1 · 4 взрослых'
  const secondName = 'Билеты куплены: Сад цветов Miracle Garden · Семья 2 · взрослый и ребёнок'
  await checklist.getByLabel(firstName, { exact: true }).check()
  await page.getByLabel('Чьи расходы показать', { exact: true }).selectOption('family-2')
  await expect(checklist.getByLabel(secondName, { exact: true })).not.toBeChecked()
  await checklist.getByLabel(secondName, { exact: true }).check()
  await page.getByLabel('Чьи расходы показать', { exact: true }).selectOption('both')
  await expect(checklist.getByLabel(firstName, { exact: true })).toBeChecked()
  await expect(checklist.getByLabel(secondName, { exact: true })).toBeChecked()
  await page.getByRole('combobox', { name: 'Возраст ребёнка', exact: true }).selectOption('12')
  await expect(checklist.getByLabel(firstName, { exact: true })).toBeChecked()
  await expect(checklist.getByLabel(secondName, { exact: true })).not.toBeChecked()
  await expect(checklist).toContainText('Изменились состав или время входа')
  await page.getByRole('combobox', { name: 'Возраст ребёнка', exact: true }).selectOption('11')
  const tools = page.getByRole('group', { name: 'Копия плана', exact: true })
  await tools.locator('summary').click()
  const download = page.waitForEvent('download')
  await tools.getByRole('button', { name: 'Скачать файл плана', exact: true }).click()
  const path = await (await download).path()
  await checklist.getByLabel(firstName, { exact: true }).uncheck()
  await tools.getByLabel('Загрузить копию плана', { exact: true }).setInputFiles(path!)
  await tools.getByRole('button', { name: 'Заменить план этой копией', exact: true }).click()
  await page.reload()
  await checklist.locator('summary').click()
  await expect(checklist.getByLabel(firstName, { exact: true })).toBeChecked()
  await expect(checklist.getByLabel(secondName, { exact: true })).toBeChecked()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.print-day').nth(2)).toContainText(
    'Семья 1 · 4 взрослых: билеты куплены',
  )
  await expect(page.locator('.print-day').nth(2)).toContainText(
    'Семья 2 · взрослый и ребёнок: билеты куплены',
  )
  await page.emulateMedia({ media: 'screen' })
  await page.getByLabel('Вход по билету: Сад цветов Miracle Garden', { exact: true }).fill('12:00')
  await expect(checklist.getByLabel(firstName, { exact: true })).not.toBeChecked()
  await checklist
    .getByRole('link', { name: 'Сравнить билеты и условия ↗', exact: true })
    .first()
    .click()
  await expect(page.locator('#purchase')).toBeFocused()
  await page.setViewportSize({ width: 360, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('shares purchase marks read-only and keeps them on their booked date', async ({ page }) => {
  await page.goto('/#/dubai/place/dubai-frame')
  await page
    .locator('.place-story')
    .getByRole('button', { name: 'В план: Дубайская рамка', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /День 1/ })
    .click()
  await page.getByRole('link', { name: 'План', exact: true }).click()
  const checklist = page
    .getByRole('region', { name: 'День 1', exact: true })
    .getByRole('group', { name: 'Подготовка к выезду', exact: true })
  await checklist.locator('summary').click()
  const checkbox = checklist.getByLabel('Билеты куплены: Дубайская рамка · Семья 1 · 4 взрослых', {
    exact: true,
  })
  await checkbox.check()
  await page.getByRole('button', { name: 'Поделиться', exact: true }).click()
  await page.goto(await page.getByLabel('Ссылка на план').inputValue())
  await checklist.locator('summary').click()
  await expect(checkbox).toBeChecked()
  await expect(checkbox).toBeDisabled()
  await page.getByRole('button', { name: 'Заменить мой план этой копией', exact: true }).click()
  await expect(checkbox).toBeEnabled()
  await page.getByLabel('День: Дубайская рамка', { exact: true }).selectOption('2026-10-07')
  await page.getByRole('button', { name: /День 2/ }).click()
  const nextDay = page
    .getByRole('region', { name: 'День 2', exact: true })
    .getByRole('group', { name: 'Подготовка к выезду', exact: true })
  await nextDay.locator('summary').click()
  await expect(nextDay.getByRole('checkbox')).not.toBeChecked()
})
