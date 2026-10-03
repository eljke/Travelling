import { test, expect } from '@playwright/test'

test('prints all planned days with readable rows and no editing controls', async ({ page }) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  await page.getByRole('button', { name: 'Применить minmax на все пять дней', exact: true }).click()
  await expect(page.locator('.print-plan')).toBeHidden()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.print-plan')).toBeVisible()
  await expect(page.locator('.print-day')).toHaveCount(5)
  await expect(page.locator('.print-plan')).toContainText('Сад цветов Miracle Garden')
  await expect(page.locator('.print-plan')).toContainText('Семья 1 · 4 взрослых')
  await expect(page.locator('.print-plan')).toContainText('₽')
  await expect(page.locator('.plan-heading')).toBeHidden()
  await expect(page.locator('.trip-proposal')).toBeHidden()
  const overflowing = await page
    .locator('.print-plan td')
    .evaluateAll((cells) => cells.filter((cell) => cell.scrollWidth > cell.clientWidth + 1).length)
  expect(overflowing).toBe(0)
})
