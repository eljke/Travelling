import { writeFile } from 'node:fs/promises'
import { fetchDailyRates } from '../src/domain/exchangeRates'

const rates = await fetchDailyRates()
await writeFile('public/exchange-rates.json', `${JSON.stringify(rates, null, 2)}\n`)
console.log(
  `Rates updated: ${rates.effectiveAt}; AED ${rates.rates.AED}, USD ${rates.rates.USD} RUB`,
)
