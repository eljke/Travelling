import { Link } from 'react-router-dom'
import changelog from '../../CHANGELOG.md?raw'

const releases = changelog
  .split(/^## /m)
  .slice(1)
  .filter((release) => !release.startsWith('[Unreleased]'))
  .map((release) => {
    const [heading, ...lines] = release.trim().split('\n')
    const match = heading.match(/^\[([^\]]+)\] - (\d{4}-\d{2}-\d{2})/)
    return {
      version: match![1],
      date: match![2],
      groups: lines
        .join('\n')
        .split(/^### /m)
        .slice(1)
        .map((group) => {
          const [title, ...items] = group.trim().split('\n')
          return {
            title:
              (
                {
                  Added: 'Добавили',
                  Changed: 'Изменили',
                  Fixed: 'Исправили',
                  Removed: 'Убрали',
                } as Record<string, string>
              )[title] ?? title,
            items: items.filter((line) => line.startsWith('- ')).map((line) => line.slice(2)),
          }
        }),
    }
  })

export default function UpdatesPage() {
  return (
    <main className="sources-page container" id="main">
      <Link className="text-button" to="/">
        ← К поездкам
      </Link>
      <span className="eyebrow">ИСТОРИЯ ОБНОВЛЕНИЙ</span>
      <h1>Что нового.</h1>
      <p>
        Новые возможности получают новую минорную версию, исправления — патч. Если обновление
        нарушает совместимость, меняется основная версия.
      </p>
      {releases.map((release) => (
        <section key={release.version}>
          <span className="eyebrow">
            {release.date} · v{release.version}
          </span>
          {release.groups.map((group) => (
            <div key={group.title}>
              <h2>{group.title}</h2>
              <ul className="release-notes">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
      <a
        className="text-button"
        href="https://github.com/eljke/Travelling/blob/main/CHANGELOG.md"
        target="_blank"
        rel="noreferrer"
      >
        Полный журнал изменений ↗
      </a>
    </main>
  )
}
