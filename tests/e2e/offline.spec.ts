import { test, expect } from '@playwright/test'
import { pathToFileURL } from 'node:url'

test('opens a saved day offline with photos and separate family ticket status', async ({
  page,
  browser,
}, testInfo) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  await page.getByRole('button', { name: 'Применить minmax на все пять дней', exact: true }).click()
  await page.getByRole('button', { name: /День 3/ }).click()
  await page.getByLabel('Вход по билету: Сад цветов Miracle Garden', { exact: true }).fill('12:00')
  const checklist = page
    .getByRole('region', { name: 'День 3', exact: true })
    .getByRole('group', { name: 'Подготовка к выезду', exact: true })
  await checklist.locator('summary').click()
  const purchased = checklist.getByLabel(
    'Билеты куплены: Сад цветов Miracle Garden · Семья 1 · 4 взрослых',
    { exact: true },
  )
  await purchased.check()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Скачать карточку дня', exact: true }).click()
  const saved = await download
  expect(saved.suggestedFilename()).toBe('dubai-2026-10-08.html')
  const filename = testInfo.outputPath('day.html')
  await saved.saveAs(filename)
  await purchased.uncheck()
  const context = await browser.newContext({ offline: true, viewport: { width: 390, height: 844 } })
  try {
    const card = await context.newPage()
    await card.goto(pathToFileURL(filename).href)
    await expect(card.getByRole('heading', { level: 1 })).toContainText('8 октября')
    const garden = card.getByRole('article', { name: 'Сад цветов Miracle Garden', exact: true })
    await expect(garden).toContainText('Время входа: 12:00')
    await expect(garden).toContainText('Семья 1 · 4 взрослых: билеты куплены')
    await expect(garden).toContainText('Семья 2 · взрослый и ребёнок: покупка не отмечена')
    await expect(garden).toContainText('Очередь / подготовка')
    await expect(card.getByRole('region', { name: 'Расходы', exact: true })).toContainText('₽')
    await expect(card.getByRole('region', { name: 'Расходы', exact: true })).toContainText(
      'Семья 1 · 4 взрослых',
    )
    await expect(
      card.getByRole('region', { name: 'Возвращение в отель', exact: true }),
    ).toContainText('JA Palm Tree Court')
    await expect(
      card.getByRole('region', { name: 'Возвращение в отель', exact: true }),
    ).toContainText('Hala Max')
    await expect(card.getByRole('article', { name: 'Дубай Молл', exact: true })).toHaveCount(0)
    await expect(card.locator('img')).toHaveCount(3)
    expect(
      await card
        .locator('img')
        .evaluateAll((nodes) =>
          nodes.every(
            (node) =>
              node instanceof HTMLImageElement &&
              node.complete &&
              node.naturalWidth > 0 &&
              node.src.startsWith('data:image/'),
          ),
        ),
    ).toBe(true)
    await expect(card.locator('footer')).toContainText('Сохраните QR-коды продавца отдельно')
    await expect(card.locator('footer')).toContainText('Изменения на сайте сюда не попадут')
    expect(await card.locator('script').count()).toBe(0)
    expect(await card.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await card.getByText('Источники фотографий', { exact: true }).click()
    await expect(card.locator('.attribution')).toContainText('CC')
    await expect(
      card.getByRole('link', { name: 'Дорога на карте ↗', exact: true }).first(),
    ).toHaveAttribute('href', /^https:\/\/www.google.com\/maps\//)
  } finally {
    await context.close()
  }
})

test('downloads the full route when a photo is unavailable and retains an overfull warning', async ({
  page,
  browser,
}, testInfo) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  await page.getByRole('button', { name: 'Применить minmax на все пять дней', exact: true }).click()
  await page
    .getByRole('region', { name: 'День 1', exact: true })
    .getByLabel('Вернуться в отель до', { exact: true })
    .fill('18:00')
  await page.route('**/images/*', (route) => route.abort())
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Скачать карточку дня', exact: true }).click()
  const filename = testInfo.outputPath('day-without-photos.html')
  await (await download).saveAs(filename)
  await expect(page.locator('.day-download:visible [role="status"]')).toContainText(
    'маршрут и билеты на месте',
  )
  const context = await browser.newContext({ offline: true })
  try {
    const card = await context.newPage()
    await card.goto(pathToFileURL(filename).href)
    await expect(card.locator('main > .warning')).toContainText('Маршрут требует правки')
    await expect(card.getByRole('article', { name: 'Дубай Молл', exact: true })).toContainText(
      '360 мин на месте',
    )
    await expect(card.getByRole('article', { name: 'Фонтаны Дубая', exact: true })).toContainText(
      '45 мин на месте',
    )
    await expect(
      card.getByRole('region', { name: 'Возвращение в отель', exact: true }),
    ).toBeVisible()
    await expect(card.locator('img')).toHaveCount(0)
  } finally {
    await context.close()
  }
})
