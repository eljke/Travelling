import { useState } from 'react'
import { images } from '../content/registry'
import { assetUrl } from './format'

export default function Photo({
  imageId,
  alt,
  priority = false,
  className = '',
}: {
  imageId?: string
  alt?: string
  priority?: boolean
  className?: string
}) {
  const [failedId, setFailedId] = useState<string>()
  const image = imageId ? images[imageId] : undefined
  return failedId === imageId || !image ? (
    <div
      className={`photo-fallback ${className}`}
      role="img"
      aria-label={alt ?? 'Фото места пока нет'}
    >
      <span>{alt ?? image?.alt}</span>
      <small>{image ? 'Фотография недоступна' : 'Фото этого места пока нет'}</small>
    </div>
  ) : (
    <img
      className={className}
      src={assetUrl(image.small)}
      srcSet={
        image.small === image.src
          ? undefined
          : `${assetUrl(image.small)} 640w, ${assetUrl(image.src)} 1280w`
      }
      sizes={priority ? '100vw' : '(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw'}
      alt={alt ?? image.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      width="1280"
      height="853"
      onError={() => setFailedId(imageId)}
    />
  )
}
