import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { images } from '../content/registry'
import type { Place } from '../domain/model'
import Photo from './Photo'
import { assetUrl } from './format'

export default function PhotoGallery({ place }: { place: Place }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const photos = [
    { imageId: place.imageId, caption: place.imageNote ?? place.nameRu },
    ...place.gallery,
  ]
  if (!place.gallery.length) return null
  const selected = photos[index]
  const image = images[selected.imageId]
  const move = (step: number) =>
    setIndex((current) => (current + step + photos.length) % photos.length)
  return (
    <section className="photo-gallery" aria-label={`Фотографии: ${place.nameRu}`}>
      <div className="section-heading">
        <h2>Рассмотреть поближе.</h2>
        <span className="fine-print">{photos.length} фотографий</span>
      </div>
      <div className="gallery-grid">
        {photos.map((photo, photoIndex) => (
          <figure key={photo.imageId}>
            <button
              aria-label={`Открыть фото: ${photo.caption}`}
              onClick={() => {
                setIndex(photoIndex)
                dialog.current!.showModal()
              }}
            >
              <Photo imageId={photo.imageId} alt={photo.caption} />
              <Expand size={18} />
            </button>
            <figcaption>{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="photo-dialog"
        aria-label="Просмотр фотографии"
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') move(1)
          if (event.key === 'ArrowLeft') move(-1)
        }}
      >
        <button
          className="dialog-close button secondary"
          aria-label="Закрыть фотографию"
          onClick={() => dialog.current!.close()}
        >
          <X size={20} />
        </button>
        <img src={assetUrl(image.src)} alt={selected.caption} />
        <div className="gallery-navigation">
          <button
            className="button secondary"
            aria-label="Предыдущее фото"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <p>
            {selected.caption}
            <small>
              {index + 1} / {photos.length} ·{' '}
              <a href={image.sourceUrl} target="_blank" rel="noreferrer">
                {image.author}
              </a>{' '}
              ·{' '}
              <a href={image.licenseUrl} target="_blank" rel="noreferrer">
                {image.license}
              </a>
            </small>
          </p>
          <button className="button secondary" aria-label="Следующее фото" onClick={() => move(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </dialog>
    </section>
  )
}
