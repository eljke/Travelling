import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { DestinationBundle } from '../domain/model'
import type { Itinerary } from '../domain/itinerary'
import { tripProposal, type DowntownExtra } from '../domain/tripProposal'
import { clockTime } from '../domain/dayRoute'
import { familyRouteBudget, families } from '../domain/families'
import { usePreferences } from '../app/Preferences'
import { formatDate, formatMoney } from './format'
import Photo from './Photo'

export default function TripProposal({
  bundle,
  plan,
  onApply,
  expanded,
}: {
  bundle: DestinationBundle
  plan: Itinerary
  onApply: (plan: Itinerary) => void
  expanded: boolean
}) {
  const [resortFirst, setResortFirst] = useState(false)
  const [aquarium, setAquarium] = useState(false)
  const [downtownExtra, setDowntownExtra] = useState<DowntownExtra>('city-walk')
  const [previous, setPrevious] = useState<Itinerary>()
  const { budgetScope } = usePreferences()
  const proposal = useMemo(
    () => tripProposal(bundle, resortFirst, aquarium, downtownExtra),
    [bundle, resortFirst, aquarium, downtownExtra],
  )
  const budgets = proposal.days.map(({ day, route }) =>
    familyRouteBudget(
      route,
      budgetScope,
      day.settings!,
      day.date,
      bundle.exchangeRate.baseCurrency,
    ),
  )
  const total = budgets.reduce((sum, budget) => sum + budget.cost + budget.ticketCost, 0)
  const high = budgets.reduce((sum, budget) => sum + budget.highCost + budget.ticketCost, 0)
  const fits = proposal.days.every(({ route }) => route.fits)
  return (
    <details className="trip-proposal" open={expanded || undefined}>
      <summary>Наш minmax · 6–10 октября · хорошие впечатления без лишних поездок</summary>
      <p>
        Все обязательные места, Рамка и два сада. На Dubai Mall — шесть часов. Близкие прогулки
        вместе; дорогие дополнения выбираем по интересу. Выезды с 10:00, возвращение до 22:00 с
        запасом, очередями и перерывом на еду.
      </p>
      <aside className="arrival-idea">
        <h3>5 октября · знакомимся с JA после заезда</h3>
        <p>
          Когда заселимся и отдохнём: пройдёмся по садовым дорожкам Palm Tree Court, понаблюдаем за
          свободно гуляющими павлинами и выйдем к пляжу. Если останутся силы — короткая прогулка к
          соседним отелям. Время прилёта не привязываем к обещанным сеансам.
        </p>
        <a
          href="https://www.jaresortshotels.com/dubai/ja-palm-tree-court"
          target="_blank"
          rel="noreferrer"
        >
          Территория и возможности JA Palm Tree Court ↗
        </a>
        <p className="fine-print">
          Пляж и бассейны считаем включёнными в проживание. Доступ к отдельным зонам, кормление
          животных, конные и водные активности заранее уточним у отеля; дополнительные услуги в
          сумму не входят.
        </p>
      </aside>
      <div className="proposal-options">
        <label>
          Полный день на территории отеля
          <select
            value={resortFirst ? '6' : '10'}
            onChange={(event) => setResortFirst(event.target.value === '6')}
          >
            <option value="10">10 октября · город начинаем 6-го</option>
            <option value="6">6 октября · город начинаем 7-го</option>
          </select>
        </label>
        <label>
          С чем совместим Dubai Mall
          <select
            value={downtownExtra}
            onChange={(event) => setDowntownExtra(event.target.value as DowntownExtra)}
          >
            <option value="city-walk">City Walk · прогулка вечером около часа</option>
            <option value="sky-views">Sky Views · смотровая утром, по билету</option>
            <option value="none">Только молл и фонтаны · больше свободного времени</option>
            <option value="both">City Walk + Sky Views · проверим, поместятся ли</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={aquarium}
            onChange={(event) => setAquarium(event.target.checked)}
          />
          Добавить платный туннель и экспозиции Dubai Aquarium
        </label>
      </div>
      <div className="proposal-total">
        <strong>{formatMoney(total, bundle.exchangeRate, high)}</strong>
        <span>{families[budgetScope].label} · билеты и доля дороги за все пять дней</span>
      </div>
      <p className="fine-print">
        Без еды, покупок и дополнительных активностей. Это диапазон по тарифам «от» и оценке дороги;
        реальных пробок и наличия билетов нет. Отельный день — не дополнительный day pass.
      </p>
      <div className="proposal-days">
        {proposal.days.map(({ day, route, title, note }, index) => (
          <article key={day.date}>
            <span className="eyebrow">{formatDate(day.date)}</span>
            <h3>{title}</h3>
            <p>{note}</p>
            <div className="proposal-places">
              {route.stops.map(({ place }) => (
                <Link key={place.id} to={`/dubai/place/${place.slug}`}>
                  <Photo imageId={place.imageId} alt={place.nameRu} />
                  <span>{place.nameRu}</span>
                </Link>
              ))}
            </div>
            <p>
              <strong>
                {day.settings!.start} → {clockTime(route.returnAt)}
              </strong>{' '}
              · дорога {route.travelMinutes} мин · очередь/подготовка{' '}
              {route.stops.reduce((sum, stop) => sum + stop.queueMinutes, 0)} мин
            </p>
            <p>
              {formatMoney(
                budgets[index].cost + budgets[index].ticketCost,
                bundle.exchangeRate,
                budgets[index].highCost + budgets[index].ticketCost,
              )}
            </p>
            {!route.fits && (
              <p className="plan-warning">
                Возвращение около {clockTime(route.returnAt)}, а с резервом {day.settings!.buffer}{' '}
                мин нужно быть в отеле до {day.settings!.end}. Молл, еду и очереди не сокращаем.
                Выберите одно дополнение или только молл с фонтанами.
              </p>
            )}
            {route.stops.some((stop) => stop.warnings.length) && (
              <details>
                <summary>Что проверить перед выездом</summary>
                {route.stops
                  .filter((stop) => stop.warnings.length)
                  .map((stop) => (
                    <p key={stop.place.id}>
                      {stop.place.nameRu}: {stop.warnings.join(' ')}
                    </p>
                  ))}
              </details>
            )}
          </article>
        ))}
      </div>
      <div className="plan-actions">
        <button
          className="button dark-button"
          disabled={!fits}
          onClick={() => {
            setPrevious(structuredClone(plan))
            onApply(proposal.plan)
          }}
        >
          Применить minmax на все пять дней
        </button>
        {previous && (
          <button
            className="button secondary"
            onClick={() => {
              onApply(previous)
              setPrevious(undefined)
            }}
          >
            Вернуть предыдущий план
          </button>
        )}
      </div>
      <p className="fine-print">
        Применение заменит текущие остановки и настройки дней. До нажатия ваш план не меняется.
        После замены можно вернуть предыдущий план, пока эта страница открыта.
      </p>
    </details>
  )
}
