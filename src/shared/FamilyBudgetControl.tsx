import { usePreferences } from '../app/Preferences'
import { families } from '../domain/families'
import type { BudgetScope } from '../domain/families'

export default function FamilyBudgetControl() {
  const { budgetScope, setBudgetScope } = usePreferences()
  return (
    <div className="family-budget-control">
      <label>
        Чьи расходы показать
        <select
          aria-label="Чьи расходы показать"
          value={budgetScope}
          onChange={(event) => setBudgetScope(event.target.value as BudgetScope)}
        >
          {Object.entries(families).map(([id, family]) => (
            <option key={id} value={id}>
              {family.label}
            </option>
          ))}
        </select>
      </label>
      <p>
        Всего едем двумя семьями: 4 взрослых и взрослый с ребёнком 11 лет. Билеты считаем отдельно,
        общую дорогу и пакеты на шестерых делим по числу участников. Еда и покупки отдельно.
      </p>
    </div>
  )
}
