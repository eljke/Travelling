import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/exchange-rates.json', (route) => route.abort())
  await page.route('https://www.cbr-xml-daily.ru/daily_json.js', (route) =>
    route.fulfill({
      json: {
        Date: '2026-10-02T11:30:00+03:00',
        PreviousDate: '2026-10-01T11:30:00+03:00',
        Valute: {
          AED: { Nominal: 1, Value: 25, Previous: 24 },
          USD: { Nominal: 1, Value: 90, Previous: 88 },
        },
      },
    }),
  )
  if (process.platform !== 'win32') return
  // Windows Chromium transport can stall; forward real tiles through the HTTP request context.
  await page.route('https://tiles.openfreemap.org/**', async (route) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await page.request.get(route.request().url(), {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 10000,
        })
        await route.fulfill({ response })
        return
      } catch {
        if (attempt === 2) await route.abort()
      }
    }
  })
})
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' })
})

test('opens trips and the destination', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Ваши путешествия' })).toBeVisible()
  await page.getByRole('link', { name: /АКТИВНАЯ ПОЕЗДКА/ }).click()
  await expect(page.getByRole('heading', { name: 'Dubai.', exact: true })).toBeVisible()
  await expect(page.locator('.place-card')).toHaveCount(12)
  await expect(page.locator('.destination-hero img')).toBeVisible()
})
test('shares filters and keeps them on refresh', async ({ page, isMobile }) => {
  await page.goto('/#/dubai')
  if (isMobile) await page.locator('.filter-details > summary').click()
  await page.getByRole('combobox', { name: 'Район', exact: true }).selectOption('jebel-ali')
  await expect(page.locator('.place-card')).toHaveCount(7)
  await expect(page).toHaveURL(/area=jebel-ali/)
  await page.reload()
  await expect(page.locator('.place-card')).toHaveCount(7)
  await page.getByRole('searchbox', { name: 'Поиск мест' }).fill('LEGO')
  await expect(page.locator('.place-card')).toHaveCount(3)
})
test('saves favorites across reloads', async ({ page }) => {
  await page.goto('/#/dubai')
  await page.getByRole('button', { name: 'Сохранить: Бурдж-Халифа', exact: true }).click()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Убрать из избранного: Бурдж-Халифа', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.locator('.favorite-filter').click()
  await expect(page.locator('.place-card')).toHaveCount(1)
})
test('opens detail with evidence and nearby places', async ({ page }) => {
  await page.goto('/#/dubai/place/the-view-at-the-palm')
  await expect(
    page.getByRole('heading', { name: 'The View — вид на Пальму', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Где купить.' })).toBeVisible()
  await expect(page.locator('.provider-list')).toContainText('Sputnik8')
  await expect(page.locator('.booking-price')).toContainText('₽')
  await expect(page.locator('.nearby-grid .place-card')).toHaveCount(4)
  await page.locator('.place-sources > summary').click()
  await expect(page.locator('.place-sources')).toContainText('The View • Standard')
})
test('loads a real map and selects a place', async ({ page }) => {
  test.setTimeout(90000)
  await page.goto('/#/dubai/map?selected=dubai-burj-khalifa')
  const map = page.getByTestId('place-map')
  await expect(map).toHaveAttribute('data-map-ready', 'true', { timeout: 60000 })
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  await expect(page.locator('.map-popup')).toContainText('Бурдж-Халифа')
  await page.getByRole('searchbox', { name: 'Поиск мест' }).fill('LEGOLAND')
  await expect(page.locator('.place-card')).toHaveCount(3)
  await page.getByRole('button', { name: 'На карте: LEGOLAND Dubai', exact: true }).click()
  await expect(page.locator('.map-popup')).toContainText('LEGOLAND Dubai')
})
test('degrades gracefully when map requests fail', async ({ page }) => {
  await page.route('https://tiles.openfreemap.org/**', (route) => route.abort())
  await page.goto('/#/dubai/map')
  await expect(page.getByText('Карта пока недоступна')).toBeVisible({ timeout: 25000 })
  await expect(page.locator('.place-card')).toHaveCount(53)
})
test('handles empty results and unavailable storage', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('blocked')
    }
  })
  await page.goto('/#/dubai')
  await page.getByRole('button', { name: 'Сохранить: Бурдж-Халифа', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('не разрешил сохранение')
  await page.getByRole('searchbox', { name: 'Поиск мест' }).fill('nonexistent-place')
  await expect(page.getByRole('heading', { name: 'Пока ничего не нашлось' })).toBeVisible()
})
test('has no horizontal overflow on mobile widths', async ({ page }) => {
  for (const width of [360, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 844 })
    for (const route of ['/#/dubai', '/#/dubai/map', '/#/dubai/place/ja-beach']) {
      await page.goto(route)
      await expect(page.locator('main:not(.page-loading):visible')).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true)
    }
  }
})
test('keeps dark theme and handles missing routes', async ({ page }) => {
  await page.goto('/#/dubai')
  await page.locator('.theme-menu summary').click()
  await page.getByRole('button', { name: 'Тёмная', exact: true }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.goto('/#/unknown/place/missing')
  await expect(page.getByRole('heading', { name: 'Место не найдено' })).toBeVisible()
})
test('updates AED and USD and retains rates offline', async ({ page }) => {
  await page.goto('/#/dubai')
  await expect(page.getByLabel('Курсы валют')).toContainText('1 AED ≈ 25 ₽')
  await expect(page.getByLabel('Курсы валют')).toContainText('1 USD ≈ 90 ₽')
  await expect(page.locator('.place-card').filter({ hasText: 'Бурдж-Халифа' })).toContainText(
    '4 750',
    { useInnerText: true },
  )
  await page.route('https://www.cbr-xml-daily.ru/daily_json.js', (route) => route.abort())
  await page.reload()
  await expect(page.getByLabel('Курсы валют')).toContainText('сохранённый курс')
  await expect(page.getByLabel('Курсы валют')).toContainText('1 AED ≈ 25 ₽')
})
test('keeps filters on map navigation and local anchors within detail', async ({
  page,
  isMobile,
}) => {
  await page.goto('/#/dubai?area=jebel-ali')
  await page
    .locator('.place-card')
    .filter({ hasText: 'JA The Resort и пляж' })
    .getByRole('link', { name: 'На карте', exact: true })
    .click()
  await expect(page).toHaveURL(/area=jebel-ali.*selected=dubai-ja-beach/)
  await page.goto('/#/dubai/place/burj-khalifa')
  await page.getByRole('button', { name: 'Сравнить способы покупки' }).click()
  await expect(page).toHaveURL(/place\/burj-khalifa$/)
  if (!isMobile) {
    await page.getByRole('link', { name: 'К содержимому', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/place\/burj-khalifa$/)
  }
})
