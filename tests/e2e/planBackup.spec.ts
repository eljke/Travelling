import { test, expect } from '@playwright/test'

test('previews a downloaded plan, restores its settings and can undo the replacement', async ({
  page,
}) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  await page.getByRole('button', { name: 'Применить minmax на все пять дней', exact: true }).click()
  const day = page.getByRole('region', { name: 'День 1', exact: true })
  await day.getByLabel('Время на месте: Дубай Молл', { exact: true }).fill('120')
  await day.getByLabel('Запас на очередь: Дубай Молл', { exact: true }).fill('15')
  await day.getByLabel('Вход по билету: Дубай Молл', { exact: true }).fill('11:30')
  const tools = page.getByRole('group', { name: 'Копия плана', exact: true })
  await tools.locator('summary').click()
  const download = page.waitForEvent('download')
  await tools.getByRole('button', { name: 'Скачать файл плана', exact: true }).click()
  const path = await (await download).path()
  await day.getByRole('button', { name: 'Убрать из плана: Дубай Молл', exact: true }).click()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(2)
  await tools.getByLabel('Загрузить копию плана', { exact: true }).setInputFiles(path!)
  const preview = tools.getByRole('region', { name: 'Просмотр копии плана', exact: true })
  await expect(preview).toContainText('Дубай Молл')
  await expect(page.locator('.plan-stop:visible')).toHaveCount(2)
  await preview.getByRole('button', { name: 'Заменить план этой копией', exact: true }).click()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(3)
  await expect(day.getByLabel('Время на месте: Дубай Молл', { exact: true })).toHaveValue('120')
  await expect(day.getByLabel('Запас на очередь: Дубай Молл', { exact: true })).toHaveValue('15')
  await expect(day.getByLabel('Вход по билету: Дубай Молл', { exact: true })).toHaveValue('11:30')
  await tools.getByRole('button', { name: 'Отменить восстановление', exact: true }).click()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(2)
  await page.reload()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(2)
})

test('rejects broken files without replacing a personal plan', async ({ page }) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  await page.getByRole('button', { name: 'Применить minmax на все пять дней', exact: true }).click()
  const tools = page.getByRole('group', { name: 'Копия плана', exact: true })
  await tools.locator('summary').click()
  await tools.getByLabel('Загрузить копию плана', { exact: true }).setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  })
  await expect(tools.getByRole('status')).toContainText('Нужна копия плана')
  await expect(
    tools.getByRole('region', { name: 'Просмотр копии плана', exact: true }),
  ).toHaveCount(0)
  await expect(page.locator('.plan-stop:visible')).toHaveCount(3)
  await page.setViewportSize({ width: 360, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
