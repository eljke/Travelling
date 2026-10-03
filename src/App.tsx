import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Routes, Route, Link, useLocation, useNavigationType } from 'react-router-dom'
import { Compass, Heart, Map, ArrowUpRight, Sun, Moon, Monitor } from 'lucide-react'
import { Preferences, usePreferences } from './app/Preferences'
import ErrorBoundary from './app/ErrorBoundary'
import { destinations } from './content/registry'
import { ui } from './shared/labels'
import type { Theme } from './shared/persistence'
import HomePage from './pages/HomePage'
import { ExchangeRates } from './app/ExchangeRates'
import { PlaceHours } from './app/PlaceHours'

const DestinationPage = lazy(() => import('./pages/DestinationPage'))
const PlacePage = lazy(() => import('./pages/PlacePage'))
const SourcesPage = lazy(() => import('./pages/SourcesPage'))
const PlanPage = lazy(() => import('./pages/PlanPage'))
const AlbumPage = lazy(() => import('./pages/AlbumPage'))
const UpdatesPage = lazy(() => import('./pages/UpdatesPage'))
const scrollPositions = new globalThis.Map<string, number>()
function Shell() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const { favorites, theme, setTheme, storageMessage } = usePreferences()
  const bundle = destinations[location.pathname.split('/')[1]] ?? Object.values(destinations)[0]
  const destinationPath = `/${bundle.destination.id}`
  useEffect(() => {
    const current = destinations[location.pathname.split('/')[1]]
    const place = current?.places.find((p) => p.slug === location.pathname.split('/')[3])
    const title = place
      ? `${place.nameRu} · ${current.destination.name} — ${ui.brand}`
      : current
        ? `${current.destination.name} · ${location.pathname.endsWith('/plan') ? 'план поездки' : 'места и карта'} — ${ui.brand}`
        : `Ваши путешествия — ${ui.brand}`
    document.title = title
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        place?.shortDescription ??
          current?.destination.description ??
          'Личный путеводитель по местам, которые стоят вашего времени.',
      )
  }, [location.pathname])
  useEffect(() => {
    const pathname = location.pathname
    window.scrollTo({
      top: navigationType === 'POP' ? (scrollPositions.get(pathname) ?? 0) : 0,
      behavior: 'instant',
    })
    return () => {
      scrollPositions.set(pathname, window.scrollY)
    }
  }, [location.pathname, navigationType])
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          const main = document.getElementById('main')!
          main.tabIndex = -1
          main.focus()
        }}
      >
        К содержимому
      </a>
      <header className="site-header">
        <div className="header-inner container">
          <Link to="/" className="brand" aria-label="elsewhere — ваши путешествия">
            <Compass size={27} strokeWidth={1.5} />
            {ui.brand}
            <span>®</span>
          </Link>
          <nav aria-label="Основная навигация">
            <Link className={location.pathname === '/' ? 'active' : ''} to="/">
              Путешествия
            </Link>
            <Link
              className={location.pathname === destinationPath ? 'active' : ''}
              to={destinationPath}
            >
              Места
            </Link>
            <Link
              className={location.pathname.endsWith('/map') ? 'active' : ''}
              to={`${destinationPath}/map`}
            >
              <Map size={16} />
              <span>Карта</span>
            </Link>
            <Link
              className={location.pathname.endsWith('/plan') ? 'active' : ''}
              to={`${destinationPath}/plan`}
            >
              План
            </Link>
            <Link
              className={location.pathname.endsWith('/shopping') ? 'active' : ''}
              to={`${destinationPath}/shopping`}
            >
              ТЦ
            </Link>
            <Link
              className={location.pathname.endsWith('/photos') ? 'active' : ''}
              to={`${destinationPath}/photos`}
            >
              Фото
            </Link>
          </nav>
          <div className="header-actions">
            <Link
              to={`${destinationPath}?favorites=1`}
              className="header-favorites"
              aria-label={`Избранное, ${favorites.length} мест`}
            >
              <Heart size={18} />
              <span>Избранное</span>
              {favorites.length > 0 && <small>{favorites.length}</small>}
            </Link>
            <details className="theme-menu">
              <summary aria-label="Выбрать тему" title="Тема оформления">
                {theme === 'dark' ? (
                  <Moon size={18} />
                ) : theme === 'light' ? (
                  <Sun size={18} />
                ) : (
                  <Monitor size={18} />
                )}
              </summary>
              <div>
                {(
                  [
                    ['system', 'Как в системе'],
                    ['light', 'Светлая'],
                    ['dark', 'Тёмная'],
                  ] as [Theme, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={theme === value}
                    onClick={(e) => {
                      setTheme(value)
                      e.currentTarget.closest('details')!.open = false
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>
      </header>
      {storageMessage && (
        <div className="storage-message" role="status">
          {storageMessage}
        </div>
      )}
      <Suspense
        fallback={
          <main className="container page-loading" id="main">
            <div className="skeleton" />
            <p>Открываем новые места…</p>
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:destinationId" element={<DestinationPage />} />
          <Route path="/:destinationId/map" element={<DestinationPage mapMode />} />
          <Route path="/:destinationId/shopping" element={<DestinationPage shoppingMode />} />
          <Route
            path="/:destinationId/place/:slug"
            element={<PlacePage key={location.pathname} />}
          />
          <Route path="/:destinationId/sources" element={<SourcesPage />} />
          <Route path="/:destinationId/plan" element={<PlanPage key={location.pathname} />} />
          <Route path="/:destinationId/photos" element={<AlbumPage key={location.pathname} />} />
          <Route path="/updates" element={<UpdatesPage />} />
          <Route
            path="*"
            element={
              <main className="container empty" id="main">
                <h1>Страница не найдена</h1>
                <Link to="/">К путешествиям</Link>
              </main>
            }
          />
        </Routes>
        <footer className="site-footer container">
          <div>
            <Link className="brand" to="/">
              <Compass size={23} strokeWidth={1.5} />
              {ui.brand}
            </Link>
            <p>Места, которые стоят вашего времени.</p>
            <Link to={`${destinationPath}/photos`}>Наши фото ↗</Link>
          </div>
          <div>
            <Link to={`${destinationPath}/sources`}>
              {ui.sources}
              <ArrowUpRight size={15} />
            </Link>
            <p>{ui.disclaimer}</p>
          </div>
          <Link className="site-version" to="/updates">
            v{import.meta.env.VITE_APP_VERSION} · Что нового
          </Link>
        </footer>
      </Suspense>
    </>
  )
}
export default function App() {
  return (
    <ErrorBoundary>
      <Preferences>
        <PlaceHours>
          <ExchangeRates>
            <HashRouter>
              <Shell />
            </HashRouter>
          </ExchangeRates>
        </PlaceHours>
      </Preferences>
    </ErrorBoundary>
  )
}
