import { test, expect } from '@playwright/test'
import { pathToFileURL } from 'node:url'

test('offers an optional skip after the mall and downloads the continuation without changing the plan', async ({
  page,
  browser,
}, testInfo) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  await page.getByRole('button', { name: 'Применить minmax на все пять дней', exact: true }).click()
  const helper = page.getByRole('group', { name: 'План Б на этот день', exact: true })
  await helper.locator('summary').click()
  await helper
    .getByRole('group', { name: 'Откуда продолжаем', exact: true })
    .getByRole('button', { name: /1\. Дубай Молл/ })
    .click()
  await expect(helper.locator('.continuation-anchors img')).toHaveCount(3)
  await helper.getByLabel('Готовы продолжить в', { exact: true }).fill('18:30')
  await expect(helper.getByLabel('Перерыв на еду уже был', { exact: true })).toBeChecked()
  await helper.getByRole('button', { name: 'Проверить остаток дня', exact: true }).click()
  const result = helper.getByRole('region', { name: 'Продолжение дня', exact: true })
  await expect(
    result.getByRole('heading', { name: 'Продолжение требует изменений', exact: true }),
  ).toBeVisible()
  await expect(result.locator('.continuation-stops li')).toHaveCount(2)
  await helper.getByRole('checkbox', { name: 'City Walk', exact: true }).check()
  await expect(result).toHaveCount(0)
  await helper.getByRole('button', { name: 'Проверить остаток дня', exact: true }).click()
  await result.getByRole('button', { name: /Без «City Walk»/ }).click()
  await expect(result.getByRole('heading', { name: /^Успеваем:/ })).toBeVisible()
  await expect(result.locator('.continuation-stops li')).toHaveCount(1)
  await expect(result.locator('.continuation-stops')).toContainText('Фонтаны Дубая')
  await expect(page.locator('.plan-stop:visible')).toHaveCount(3)
  await expect(page.getByLabel('Время на месте: Дубай Молл', { exact: true })).toHaveValue('360')
  const download = page.waitForEvent('download')
  await result.getByRole('button', { name: 'Скачать продолжение дня', exact: true }).click()
  const saved = await download
  expect(saved.suggestedFilename()).toBe('dubai-2026-10-06-remaining.html')
  const filename = testInfo.outputPath('remaining.html')
  await saved.saveAs(filename)
  const context = await browser.newContext({ offline: true, viewport: { width: 390, height: 844 } })
  try {
    const card = await context.newPage()
    await card.goto(pathToFileURL(filename).href)
    await expect(card.locator('header')).toContainText('Продолжение дня')
    await expect(card.locator('header')).toContainText('Дубай Молл')
    await expect(card.locator('header')).toContainText('18:30')
    await expect(card.getByRole('article')).toHaveCount(1)
    await expect(card.getByRole('article')).toContainText('Пешком')
    await expect(card.getByRole('article')).toContainText('45 мин на месте')
    expect(
      await card
        .locator('img')
        .evaluateAll((nodes) =>
          nodes.every(
            (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
          ),
        ),
    ).toBe(true)
  } finally {
    await context.close()
  }
  await page.setViewportSize({ width: 360, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.reload()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(3)
  await expect(page.getByLabel('Время на месте: Дубай Молл', { exact: true })).toHaveValue('360')
})

test('protects bought visits and calculates a return after the last place', async ({ page }) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  await page.getByRole('button', { name: 'Применить minmax на все пять дней', exact: true }).click()
  await page.getByRole('button', { name: /День 3/ }).click()
  const day = page.getByRole('region', { name: 'День 3', exact: true })
  const checklist = day.getByRole('group', { name: 'Подготовка к выезду', exact: true })
  await checklist.locator('summary').click()
  await checklist
    .getByLabel('Билеты куплены: Сад цветов Miracle Garden · Семья 1 · 4 взрослых', { exact: true })
    .check()
  const helper = day.getByRole('group', { name: 'План Б на этот день', exact: true })
  await helper.locator('summary').click()
  await expect(helper.getByRole('checkbox', { name: /Сад цветов Miracle Garden/ })).toBeDisabled()
  await helper
    .getByRole('group', { name: 'Откуда продолжаем', exact: true })
    .getByRole('button', { name: /3\. Dubai Outlet Mall/ })
    .click()
  await helper.getByLabel('Готовы продолжить в', { exact: true }).fill('20:00')
  await helper.getByRole('button', { name: 'Проверить остаток дня', exact: true }).click()
  const result = helper.getByRole('region', { name: 'Продолжение дня', exact: true })
  await expect(result.locator('.continuation-stops li')).toHaveCount(0)
  await expect(result).toContainText('Hala Max')
  await expect(result).toContainText('JA Palm Tree Court')
  await expect(
    result.getByRole('link', { name: 'Обратная дорога на карте ↗', exact: true }),
  ).toHaveAttribute('href', /origin=25\.072/)
  await helper.getByLabel('Готовы продолжить в', { exact: true }).fill('22:30')
  await helper.getByRole('button', { name: 'Проверить остаток дня', exact: true }).click()
  await expect(result).toContainText('Готовы продолжить после времени возвращения')
})
