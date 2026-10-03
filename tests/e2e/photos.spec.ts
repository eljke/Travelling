import { test, expect } from '@playwright/test'

test('shows each outlet with its own photo and labels missing photos', async ({ page }) => {
  await page.goto('/#/dubai/place/dubai-mall')
  const mall = await page.locator('.place-hero img').getAttribute('src')
  await page.goto('/#/dubai/place/dubai-outlet-mall')
  await expect(page.locator('.place-hero img')).not.toHaveAttribute('src', mall!)
  await expect(page.locator('.image-credit')).toContainText('2010')
  await page.goto('/#/dubai/place/outlet-village')
  await expect(page.locator('.place-hero img')).toHaveAttribute('src', /outlet-village/)
  await page.goto('/#/dubai/place/sky-views')
  await expect(page.locator('.place-hero')).toContainText('Фото этого места пока нет')
  await expect(page.locator('.image-credit a')).toHaveAttribute('href', /skyviews/)
})
