import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { destinations } from '../content/registry'
import { fetchDailyRates, moscowDay, ratesSchema, ratesSourceUrl } from '../domain/exchangeRates'
import type { DailyRates } from '../domain/exchangeRates'
import { assetUrl } from '../shared/format'

async function availableRates() {
  let bundled: DailyRates | undefined
  try {
    const response = await fetch(assetUrl('exchange-rates.json'), {
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error('Bundled rates unavailable')
    bundled = ratesSchema.parse(await response.json())
    if (bundled.effectiveAt > moscowDay()) throw new Error('Future rate date')
    if (bundled.fetchedAt === moscowDay()) return bundled
  } catch {
    bundled = undefined
  }
  try {
    return await fetchDailyRates()
  } catch (error) {
    if (bundled) return bundled
    throw error
  }
}

const cacheKey = 'travelling:rates:v1'
function readCache() {
  try {
    const cached = ratesSchema.parse(JSON.parse(localStorage.getItem(cacheKey) ?? 'null'))
    return cached.effectiveAt <= moscowDay() && cached.fetchedAt <= moscowDay() ? cached : undefined
  } catch {
    return undefined
  }
}
const RatesContext = createContext<{
  data?: DailyRates
  status: 'loading' | 'fresh' | 'cached' | 'fallback'
}>({ status: 'loading' })
export function ExchangeRates({ children }: { children: ReactNode }) {
  const [data, setData] = useState(readCache)
  const latestData = useRef(data)
  const [status, setStatus] = useState<'loading' | 'fresh' | 'cached' | 'fallback'>('loading')
  useEffect(() => {
    let active = true
    let lastAttempt = ''
    let timer: number
    const refresh = async () => {
      const today = moscowDay()
      if (today === lastAttempt) return
      lastAttempt = today
      try {
        const latest = await availableRates()
        if (!active) return
        if (latestData.current && latestData.current.effectiveAt > latest.effectiveAt) {
          setStatus('cached')
          return
        }
        setData(latest)
        latestData.current = latest
        setStatus(latest.fetchedAt === today ? 'fresh' : 'cached')
        try {
          localStorage.setItem(cacheKey, JSON.stringify(latest))
        } catch {
          /* Memory still retains the rate. */
        }
      } catch {
        if (active) setStatus(latestData.current ? 'cached' : 'fallback')
      }
    }
    const schedule = () => {
      const tomorrow = moscowDay(new Date(Date.now() + 86400000))
      const delay = new Date(`${tomorrow}T00:05:00+03:00`).getTime() - Date.now()
      timer = window.setTimeout(() => {
        void refresh()
        schedule()
      }, delay)
    }
    const visible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    void refresh()
    schedule()
    document.addEventListener('visibilitychange', visible)
    return () => {
      active = false
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [])
  return <RatesContext.Provider value={{ data, status }}>{children}</RatesContext.Provider>
}
export function useExchangeRates() {
  return useContext(RatesContext)
}
export function useDestinationBundle(id: string) {
  const { data } = useExchangeRates()
  return useMemo(() => {
    const bundle = destinations[id]
    if (!bundle || !data || bundle.exchangeRate.quoteCurrency !== 'RUB') return bundle
    const rate = data.rates[bundle.exchangeRate.baseCurrency]
    if (!rate) return bundle
    return {
      ...bundle,
      exchangeRate: {
        ...bundle.exchangeRate,
        rate,
        usdRub: data.rates.USD,
        effectiveAt: data.effectiveAt,
        checkedAt: data.fetchedAt,
        sourceIds: ['daily-fx'],
      },
      sources: [
        ...bundle.sources,
        {
          id: 'daily-fx',
          type: 'other' as const,
          title: 'Курсы ЦБ РФ • ежедневный JSON через CBR XML Daily',
          url: ratesSourceUrl,
          accessedAt: data.fetchedAt,
          note: 'Независимый JSON-сервис данных Банка России. Курс за указанную дату; не курс списания банка.',
        },
      ],
    }
  }, [id, data])
}
