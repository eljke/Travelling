import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
const PlaceMap = lazy(() => import('./PlaceMap'))
export default function LazyMap(props: ComponentProps<typeof PlaceMap>) {
  const container = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(container.current!)
    return () => observer.disconnect()
  }, [])
  return (
    <div className="lazy-map" ref={container}>
      {visible ? (
        <Suspense fallback={<div className="map-placeholder skeleton">Готовим карту…</div>}>
          <PlaceMap {...props} />
        </Suspense>
      ) : (
        <div className="map-placeholder skeleton">Карта мест</div>
      )}
    </div>
  )
}
