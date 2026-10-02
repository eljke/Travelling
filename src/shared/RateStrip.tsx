import type { DestinationBundle } from '../domain/model'
import { useExchangeRates } from '../app/ExchangeRates'
import { formatDate } from './format'
import { ratesSourceUrl } from '../domain/exchangeRates'

export default function RateStrip({ bundle }: { bundle: DestinationBundle }) {
  const { data, status } = useExchangeRates()
  const usdRub = data?.rates.USD ?? bundle.exchangeRate.usdRub
  const number = (value: number) =>
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)
  return (
    <div className="rate-strip" aria-label="Курсы валют">
      <div>
        <strong>
          1 {bundle.exchangeRate.baseCurrency} ≈ {number(bundle.exchangeRate.rate)} ₽
        </strong>
        {usdRub && <strong>1 USD ≈ {number(usdRub)} ₽</strong>}
      </div>
      <small>
        <a href={ratesSourceUrl} target="_blank" rel="noreferrer">
          Курсы ЦБ РФ · API
        </a>
        {' · '}
        {formatDate(bundle.exchangeRate.effectiveAt)}
        {status === 'loading'
          ? ' · обновляем…'
          : status === 'cached'
            ? ' · сохранённый курс, сеть недоступна'
            : status === 'fallback'
              ? ' · резервный курс исследования, сеть недоступна'
              : ' · обновляется ежедневно'}
      </small>
    </div>
  )
}
