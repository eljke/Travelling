import { test, expect } from '@playwright/test'

test('defaults to our family and retains the selected budget throughout the site', async ({
  page,
}) => {
  await page.goto('/#/dubai/place/dubai-frame')
  const family = page.getByLabel('Чьи расходы показать', { exact: true })
  await expect(family).toHaveValue('family-1')
  await expect(page.locator('.booking-family-price')).toContainText('200 AED')
  await family.selectOption('family-2')
  await expect(page.locator('.booking-family-price')).toContainText('70 AED')
  await family.selectOption('both')
  await expect(page.locator('.booking-family-price')).toContainText('270 AED')
  await page.goto('/#/dubai/plan')
  await expect(page.getByLabel('Чьи расходы показать', { exact: true })).toHaveValue('both')
  await page.getByLabel('Чьи расходы показать', { exact: true }).selectOption('family-1')
  await page.reload()
  await expect(page.getByLabel('Чьи расходы показать', { exact: true })).toHaveValue('family-1')
  await page.setViewportSize({ width: 360, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
