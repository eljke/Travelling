import { test, expect } from '@playwright/test'

test('previews a trip, applies it deliberately and restores the previous plan', async ({
  page,
}) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  const proposal = page.locator('.trip-proposal')
  await expect(proposal.locator('.proposal-days article')).toHaveCount(5)
  await expect(proposal).toContainText('павлинами')
  await expect(page.locator('.plan-stop:visible')).toHaveCount(0)
  await proposal
    .getByRole('button', { name: 'Применить minmax на все пять дней', exact: true })
    .click()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(2)
  await expect(page.locator('.route-result:visible')).toContainText('Укладываемся')
  await page
    .getByRole('group', { name: 'Дни поездки', exact: true })
    .getByRole('button', { name: /День 3/ })
    .click()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(3)
  await expect(page.locator('.plan-stops:visible')).toContainText('Сад цветов Miracle Garden')
  await proposal.getByRole('button', { name: 'Вернуть предыдущий план', exact: true }).click()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(0)
})
