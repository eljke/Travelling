import { CalendarPlus, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePreferences } from '../app/Preferences'
import type { DestinationBundle, Place } from '../domain/model'
import { createItinerary, placeInDay } from '../domain/itinerary'
import { formatDate } from './format'

export default function PlanButton({ place, bundle }: { place: Place; bundle: DestinationBundle }) {
  const { plans, savePlan } = usePreferences()
  const plan = plans[bundle.destination.id] ?? createItinerary(bundle)
  const day = plan.days.find((day) => day.placeIds.includes(place.id))
  return day ? (
    <Link className="text-button plan-button" to={`/${bundle.destination.id}/plan`}>
      <Check size={15} /> В плане · {formatDate(day.date)}
    </Link>
  ) : (
    <button
      className="text-button plan-button"
      aria-label={`В план: ${place.nameRu}`}
      onClick={() => savePlan(bundle.destination.id, placeInDay(plan, place.id, plan.days[0].date))}
    >
      <CalendarPlus size={15} /> В план поездки
    </button>
  )
}
