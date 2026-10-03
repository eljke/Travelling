import { test, expect } from '@playwright/test'

test('moves the viewpoint to another day while keeping the mall and fountains', async ({
  page,
}) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  const proposal = page.locator('.trip-proposal')
  await proposal
    .getByRole('combobox', { name: 'С чем совместим Dubai Mall', exact: true })
    .selectOption('both')
  await proposal
    .getByRole('button', { name: 'Перенести Sky Views на 9 октября', exact: true })
    .click()
  const first = proposal.locator('.proposal-days article').first()
  await expect(first).toContainText('21:30')
  await expect(first).toContainText('18:30 и 19:00')
  await expect(first).toContainText('два вечерних шоу')
  await expect(first).toContainText('Sky Views переносим на 9 октября')
  await expect(proposal.locator('.proposal-days article').nth(3)).toContainText('Sky Views')
  await expect(page.locator('.plan-stop:visible')).toHaveCount(0)
  await proposal
    .getByRole('button', { name: 'Применить minmax на все пять дней', exact: true })
    .click()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(3)
  await expect(page.locator('.plan-stops:visible')).toContainText('Фонтаны Дубая')
  await expect(page.getByLabel('Время на месте: Фонтаны Дубая', { exact: true })).toHaveValue('45')
  await expect(page.getByLabel('Время на месте: Дубай Молл', { exact: true })).toHaveValue('360')
  await expect(page.getByRole('combobox', { name: 'Когда поедим', exact: true })).toHaveValue(
    'dubai-dubai-mall',
  )
  await expect(page.locator('.route-result:visible')).toContainText('Укладываемся')
  await page.reload()
  await expect(page.getByLabel('Время на месте: Дубай Молл', { exact: true })).toHaveValue('360')
  await expect(page.getByRole('combobox', { name: 'Когда поедим', exact: true })).toHaveValue(
    'dubai-dubai-mall',
  )
  await page
    .getByRole('group', { name: 'Дни поездки', exact: true })
    .getByRole('button', { name: /День 4/ })
    .click()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(5)
  await expect(page.locator('.plan-stops:visible')).toContainText('Sky Views')
  await expect(page.locator('.route-result:visible')).toContainText('Укладываемся')
})

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
  await expect(page.locator('.plan-stop:visible')).toHaveCount(3)
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

test('keeps six hours in the mall and previews feasible extras before replacing a day', async ({
  page,
}) => {
  await page.goto('/#/dubai/plan?idea=minmax')
  const proposal = page.locator('.trip-proposal')
  const extra = proposal.getByRole('combobox', { name: 'С чем совместим Dubai Mall', exact: true })
  const first = proposal.locator('.proposal-days article').first()
  const apply = proposal.getByRole('button', {
    name: 'Применить minmax на все пять дней',
    exact: true,
  })
  await expect(first).toContainText('21:30')
  await expect(first).toContainText('После шоу — час')
  await extra.selectOption('both')
  await expect(first).toContainText('Молл, еду и очереди не сокращаем')
  await expect(apply).toBeDisabled()
  await expect(page.locator('.plan-stop:visible')).toHaveCount(0)
  await extra.selectOption('sky-views')
  await expect(apply).toBeDisabled()
  await expect(first).toContainText('21:45')
  await extra.selectOption('city-walk')
  await apply.click()
  await expect(page.getByLabel('Время на месте: Дубай Молл', { exact: true })).toHaveValue('360')
  const meal = page.getByRole('combobox', { name: 'Когда поедим', exact: true })
  await expect(meal).toHaveValue('dubai-dubai-mall')
  await expect(page.locator('.route-result:visible')).toContainText('Укладываемся')
  await meal.selectOption('dubai-dubai-fountain')
  await expect(page.locator('.route-result:visible')).toContainText('Нужно сократить день')
  await page.reload()
  await expect(meal).toHaveValue('dubai-dubai-fountain')
  await meal.selectOption('dubai-dubai-mall')
  await expect(page.locator('.route-result:visible')).toContainText('Укладываемся')
})
