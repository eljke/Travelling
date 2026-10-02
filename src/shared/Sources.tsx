import { ExternalLink } from 'lucide-react'
import type { DestinationBundle } from '../domain/model'
import { formatDate } from './format'

export default function Sources({ bundle, ids }: { bundle: DestinationBundle; ids: string[] }) {
  const sources = bundle.sources.filter((source) => ids.includes(source.id))
  return (
    <ul className="source-list">
      {sources.map((source) => (
        <li key={source.id}>
          <a href={source.url} target="_blank" rel="noreferrer">
            {source.title}
            <ExternalLink size={14} />
          </a>
          <small>
            Проверено {formatDate(source.accessedAt)} ·{' '}
            {source.type === 'review'
              ? 'Опыт путешественников'
              : source.type === 'official'
                ? 'Официальный источник'
                : 'Внешний источник'}
          </small>
          {source.note && <p>{source.note}</p>}
        </li>
      ))}
    </ul>
  )
}
