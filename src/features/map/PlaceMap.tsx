import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Map as LibreMap,
  NavigationControl,
  AttributionControl,
  GeoJSONSource,
  Popup,
  Marker,
  setWorkerUrl,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import type { FeatureCollection, Point } from 'geojson'
import { LocateFixed, Maximize2, RotateCcw } from 'lucide-react'
import type { DestinationBundle, Coordinates, Place } from '../../domain/model'
import { images } from '../../content/registry'
import { assetUrl, formatPrice, formatRub } from '../../shared/format'
import { categoryLabels } from '../../shared/labels'
import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(workerUrl)
function featureData(places: Place[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: places.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.coordinates.lng, p.coordinates.lat] },
      properties: {
        id: p.id,
        category: p.categories[0],
        label:
          p.categories[0] === 'beach'
            ? '≈'
            : p.categories[0] === 'viewpoint'
              ? '↗'
              : ['theme-park', 'waterpark'].includes(p.categories[0])
                ? '✦'
                : ['nature', 'desert'].includes(p.categories[0])
                  ? '◇'
                  : '•',
      },
    })),
  }
}
export default function PlaceMap({
  bundle,
  places,
  selectedId,
  onSelect,
  userPosition,
}: {
  bundle: DestinationBundle
  places: Place[]
  selectedId?: string
  onSelect?: (id: string) => void
  userPosition?: Coordinates
}) {
  const container = useRef<HTMLDivElement>(null)
  const instance = useRef<LibreMap | null>(null)
  const popup = useRef<Popup | null>(null)
  const live = useRef({ places, onSelect })
  useEffect(() => {
    live.current = { places, onSelect }
  }, [places, onSelect])
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  useEffect(() => {
    let map: LibreMap
    try {
      map = new LibreMap({
        container: container.current!,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [bundle.destination.center.lng, bundle.destination.center.lat],
        zoom: 9.2,
        attributionControl: false,
        cooperativeGestures: true,
      })
      instance.current = map
    } catch (error) {
      console.error('Map initialization failed', error)
      // oxlint-disable-next-line react/set-state-in-effect -- Reflect an external WebGL initialization failure.
      setFailed(true)
      return
    }
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new AttributionControl({ compact: true }), 'bottom-right')
    const timeout = window.setTimeout(() => {
      if (!map.isStyleLoaded()) setFailed(true)
    }, 18000)
    map.on('error', (event) => {
      console.error('Map request failed', event.error)
      if (!map.isStyleLoaded()) setFailed(true)
    })
    map.on('load', () => {
      window.clearTimeout(timeout)
      setFailed(false)
      map.addSource('places', {
        type: 'geojson',
        data: featureData(live.current.places),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 42,
      })
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'places',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#153f38',
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 25],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        },
      })
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'places',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#fff' },
      })
      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'places',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 13,
          'circle-color': [
            'match',
            ['get', 'category'],
            'beach',
            '#1b7b88',
            'viewpoint',
            '#b65d37',
            'museum',
            '#74629e',
            'theme-park',
            '#aa8040',
            'waterpark',
            '#1b7b88',
            'nature',
            '#5b7850',
            'desert',
            '#aa8040',
            '#153f38',
          ],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
        },
      })
      map.addLayer({
        id: 'point-symbols',
        type: 'symbol',
        source: 'places',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 16,
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#fff' },
      })
      map.addSource('selected', { type: 'geojson', data: featureData([]) })
      map.addLayer({
        id: 'selection-ring',
        type: 'circle',
        source: 'selected',
        paint: {
          'circle-color': 'transparent',
          'circle-radius': 21,
          'circle-stroke-color': '#b65d37',
          'circle-stroke-width': 4,
        },
      })
      map.on('click', 'clusters', async (event) => {
        const feature = event.features?.[0]
        if (!feature || feature.geometry.type !== 'Point') return
        const clusterId = Number(feature.properties.cluster_id)
        try {
          const zoom = await (map.getSource('places') as GeoJSONSource).getClusterExpansionZoom(
            clusterId,
          )
          map.easeTo({
            center: feature.geometry.coordinates as [number, number],
            zoom,
            duration: reducedMotion() ? 0 : 500,
          })
        } catch {
          /* Source may have been replaced by a filter. */
        }
      })
      map.on('click', 'points', (event) => {
        const id = event.features?.[0]?.properties.id
        if (typeof id === 'string') live.current.onSelect?.(id)
      })
      for (const layer of ['clusters', 'points']) {
        map.on('mouseenter', layer, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', layer, () => {
          map.getCanvas().style.cursor = ''
        })
      }
      setReady(true)
    })
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(container.current!)
    return () => {
      window.clearTimeout(timeout)
      observer.disconnect()
      popup.current?.remove()
      popup.current = null
      map.remove()
      instance.current = null
    }
  }, [bundle.destination, retry])
  useEffect(() => {
    if (!ready || !userPosition) return
    const marker = new Marker({ color: '#326fb4' })
      .setLngLat([userPosition.lng, userPosition.lat])
      .addTo(instance.current!)
    marker.getElement().setAttribute('aria-label', 'Ваше положение')
    return () => {
      marker.remove()
    }
  }, [ready, userPosition])
  useEffect(() => {
    if (!ready) return
    const map = instance.current!
    ;(map.getSource('places') as GeoJSONSource).setData(featureData(places))
    popup.current?.remove()
  }, [places, ready])
  useEffect(() => {
    if (!ready) return
    const map = instance.current!
    const place = places.find((p) => p.id === selectedId)
    ;(map.getSource('selected') as GeoJSONSource).setData(featureData(place ? [place] : []))
    popup.current?.remove()
    if (!place) return
    map.easeTo({
      center: [place.coordinates.lng, place.coordinates.lat],
      zoom: Math.max(14, map.getZoom()),
      duration: reducedMotion() ? 0 : 700,
    })
    const panel = document.createElement('div')
    panel.className = 'map-popup'
    if (place.imageId) {
      const photo = document.createElement('img')
      photo.src = assetUrl(images[place.imageId].small)
      photo.alt = place.nameRu
      photo.width = 240
      photo.height = 110
      panel.append(photo)
    }
    const area = document.createElement('small')
    area.textContent = bundle.areas.find((a) => a.id === place.areaId)!.name
    panel.append(area)
    const title = document.createElement('strong')
    title.textContent = place.nameRu
    panel.append(title)
    const price = document.createElement('p')
    price.textContent = `${formatPrice(place.pricing)} ${formatRub(place.pricing, bundle.exchangeRate)}`
    panel.append(price)
    const link = document.createElement('a')
    link.href = `#/${bundle.destination.id}/place/${place.slug}`
    link.textContent = 'Подробнее о месте →'
    panel.append(link)
    popup.current = new Popup({ offset: 25, maxWidth: '260px', focusAfterOpen: false })
      .setLngLat([place.coordinates.lng, place.coordinates.lat])
      .setDOMContent(panel)
      .addTo(map)
  }, [selectedId, places, ready, bundle])
  const fitAll = () => {
    if (!instance.current || !places.length) return
    const lngs = places.map((p) => p.coordinates.lng),
      lats = places.map((p) => p.coordinates.lat)
    instance.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 55, maxZoom: 13, duration: reducedMotion() ? 0 : 700 },
    )
  }
  return (
    <div className="map-shell" data-testid="place-map" data-map-ready={ready}>
      <div
        ref={container}
        className="map-canvas"
        aria-label={`Интерактивная карта: ${bundle.destination.nameRu}, ${places.length} мест`}
      />
      {!ready && !failed && (
        <div className="map-loading">
          <span className="spinner" />
          Загружаем карту…
        </div>
      )}
      {failed && (
        <div className="map-error">
          <strong>Карта пока недоступна</strong>
          <p>
            Проверьте соединение или поддержку WebGL. Места, координаты и ссылки на маршруты
            остаются доступны.
          </p>
          <button
            className="button secondary"
            onClick={() => {
              setReady(false)
              setFailed(false)
              setRetry((v) => v + 1)
            }}
          >
            <RotateCcw size={16} />
            Повторить
          </button>
          <a
            href={`https://www.openstreetmap.org/#map=10/${bundle.destination.center.lat}/${bundle.destination.center.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            Открыть OpenStreetMap ↗
          </a>
        </div>
      )}
      {ready && (
        <div className="map-actions">
          <button
            aria-label="Показать все найденные места"
            title="Показать все найденные места"
            onClick={fitAll}
          >
            <Maximize2 size={17} />
            Все места
          </button>
          {userPosition && (
            <button
              aria-label="Показать моё положение"
              onClick={() =>
                instance.current!.easeTo({ center: [userPosition.lng, userPosition.lat], zoom: 13 })
              }
            >
              <LocateFixed size={18} />
            </button>
          )}
        </div>
      )}
      <div className="map-legend">
        <span>
          <i style={{ background: '#b65d37' }} />
          Смотровые
        </span>
        <span>
          <i style={{ background: '#1b7b88' }} />
          Море
        </span>
        <span>
          <i style={{ background: '#153f38' }} />
          Город
        </span>
      </div>
      <details className="map-accessible">
        <summary>Места на карте: {places.length}</summary>
        <ul>
          {places.map((p) => (
            <li key={p.id}>
              <button onClick={() => onSelect?.(p.id)}>
                {p.nameRu} · {categoryLabels[p.categories[0]]}
              </button>
              <Link to={`/${bundle.destination.id}/place/${p.slug}`}>Подробнее</Link>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
