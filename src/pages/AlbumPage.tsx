import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Camera, Download, Pencil, Trash2, Upload, X } from 'lucide-react'
import { useDestinationBundle } from '../app/ExchangeRates'
import {
  deletePhoto,
  downloadFile,
  exportAlbum,
  importAlbum,
  preparePhoto,
  readAlbum,
  savePhoto,
} from '../shared/photoAlbum'
import type { AlbumPhoto } from '../shared/photoAlbum'
import { formatDate } from '../shared/format'

function LocalPhoto({ photo, onOpen }: { photo: AlbumPhoto; onOpen?: () => void }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const next = URL.createObjectURL(photo.image)
    queueMicrotask(() => setUrl(next))
    return () => URL.revokeObjectURL(next)
  }, [photo.image])
  const image = (
    <img src={url || undefined} alt={photo.caption || 'Фото из нашей поездки'} loading="lazy" />
  )
  return onOpen ? (
    <button
      className="album-photo-button"
      aria-label={`Открыть наше фото: ${photo.caption || 'без подписи'}`}
      onClick={onOpen}
    >
      {image}
    </button>
  ) : (
    image
  )
}

export default function AlbumPage() {
  const { destinationId = '' } = useParams()
  const bundle = useDestinationBundle(destinationId)
  const [params, setParams] = useSearchParams()
  const [photos, setPhotos] = useState<AlbumPhoto[]>([])
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [caption, setCaption] = useState('')
  const [people, setPeople] = useState('')
  const [date, setDate] = useState('')
  const [placeId, setPlaceId] = useState(params.get('place') ?? '')
  const [files, setFiles] = useState<File[]>([])
  const [editing, setEditing] = useState<AlbumPhoto>()
  const [selected, setSelected] = useState<AlbumPhoto>()
  const [deleting, setDeleting] = useState<string>()
  const dialog = useRef<HTMLDialogElement>(null)
  const upload = useRef<HTMLInputElement>(null)
  const placeFilter = params.get('place') ?? ''
  const personFilter = params.get('person') ?? ''
  const kind = params.get('kind') ?? ''
  const refresh = async () => {
    setPhotos(await readAlbum())
  }
  useEffect(() => {
    let active = true
    void readAlbum()
      .then((rows) => {
        if (active) {
          setPhotos(rows)
          setReady(true)
        }
      })
      .catch(() => {
        if (active)
          setError(
            'Браузер не разрешил открыть альбом. Попробуйте обычный режим и разрешите хранение данных сайта.',
          )
      })
    const reload = () => {
      if (!document.hidden)
        void readAlbum()
          .then((rows) => {
            if (active) setPhotos(rows)
          })
          .catch(() => {})
    }
    document.addEventListener('visibilitychange', reload)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', reload)
    }
  }, [])
  if (!bundle)
    return (
      <main className="container empty" id="main">
        <h1>Поездка не найдена</h1>
        <Link to="/">К путешествиям</Link>
      </main>
    )
  const tripPhotos = photos.filter((photo) => photo.destinationId === destinationId)
  const visible = tripPhotos
    .filter(
      (photo) =>
        (!placeFilter || photo.placeId === placeFilter) &&
        (!personFilter || photo.people.includes(personFilter)) &&
        (!kind || (kind === 'group' ? photo.people.length >= 2 : photo.people.length === 1)),
    )
    .sort((a, b) => (b.date || b.addedAt).localeCompare(a.date || a.addedAt))
  const allPeople = [...new Set(tripPhotos.flatMap((photo) => photo.people))].sort((a, b) =>
    a.localeCompare(b, 'ru'),
  )
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await work()
    } catch (cause) {
      setError(
        cause instanceof Error &&
          !['QuotaExceededError', 'UnknownError'].includes(cause.name) &&
          !cause.message.includes('Invalid')
          ? cause.message
          : 'Не удалось сохранить данные. Проверьте формат файла и свободное место; уже сохранённые фото остались в альбоме.',
      )
    } finally {
      setBusy(false)
    }
  }
  const reset = () => {
    setCaption('')
    setPeople('')
    setDate('')
    setEditing(undefined)
    setFiles([])
    if (upload.current) upload.current.value = ''
  }
  const names = () => [
    ...new Set(
      people
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ]
  const submit = () =>
    run(async () => {
      if (!bundle.places.some((place) => place.id === placeId))
        throw new Error('Выберите место для снимка.')
      if (names().length > 20 || names().some((name) => name.length > 60))
        throw new Error('Укажите до 20 участников, имя — до 60 символов.')
      let saved = 0
      if (editing) {
        await savePhoto({ ...editing, placeId, caption: caption.trim(), people: names(), date })
        saved = 1
      } else {
        if (files.length > 20) throw new Error('За один раз можно добавить до 20 снимков.')
        for (const file of files) {
          await savePhoto({
            id: crypto.randomUUID(),
            destinationId,
            placeId,
            caption: caption.trim(),
            people: names(),
            date,
            addedAt: new Date().toISOString(),
            image: await preparePhoto(file),
          })
          saved++
          await refresh()
        }
        void navigator.storage?.persist().catch(() => {})
      }
      await refresh()
      reset()
      setMessage(`Сохранено снимков: ${saved}.`)
    })
  return (
    <main className="album-page container" id="main">
      <Link className="text-button" to={`/${destinationId}`}>
        ← К местам
      </Link>
      <div className="plan-heading">
        <div>
          <span className="eyebrow">СЕМЬЯ, ДРУЗЬЯ И НАШИ ВПЕЧАТЛЕНИЯ</span>
          <h1>Наши фото.</h1>
          <p>
            {bundle.destination.nameRu} · {tripPhotos.length} снимков
          </p>
        </div>
        <Camera size={40} strokeWidth={1.4} />
      </div>
      <p className="section-note">
        «Мы в Dubai Mall», «Все вместе на Пальме» — соберём поездку в фотографиях. Снимки остаются в
        этом браузере и никуда не отправляются. Сохраните копию альбома, чтобы перенести её на
        другой телефон или передать близким.
      </p>
      <details className="album-upload" open={Boolean(editing)}>
        <summary>{editing ? 'Изменить подпись и участников' : 'Добавить наши фотографии'}</summary>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <label>
            Где мы были
            <select
              aria-label="Место на фото"
              value={placeId}
              required
              onChange={(event) => setPlaceId(event.target.value)}
            >
              <option value="">Выберите место</option>
              {bundle.places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.nameRu}
                </option>
              ))}
            </select>
          </label>
          {!editing && (
            <label>
              Фотографии
              <input
                ref={upload}
                aria-label="Наши фотографии"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                required
                onChange={(event) => setFiles([...event.target.files!])}
              />
              <small>
                JPEG, PNG, WebP · до 20 за раз, до 30 МБ на файл. Сохраняем копии до 2048 px без
                геометок; оригиналы остаются у вас.
              </small>
            </label>
          )}
          <label>
            Подпись
            <input
              maxLength={300}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Мы у фонтанов после ужина"
            />
          </label>
          <label>
            Кто на фото
            <input
              maxLength={1200}
              value={people}
              onChange={(event) => setPeople(event.target.value)}
              placeholder="Илья, мама, папа — через запятую"
            />
            <small>
              Один участник — индивидуальное фото, двое и больше — общее. Можно оставить пустым.
            </small>
          </label>
          <label>
            Когда снято
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <div className="plan-actions">
            <button className="button dark-button" disabled={busy || !ready}>
              <Upload size={17} />
              {busy ? 'Сохраняем…' : editing ? 'Сохранить изменения' : 'Сохранить фото'}
            </button>
            {editing && (
              <button type="button" className="button secondary" onClick={reset}>
                Отмена
              </button>
            )}
          </div>
        </form>
      </details>
      <div className="album-tools">
        <button
          className="button secondary"
          disabled={busy || !visible.length || visible.length > 200}
          onClick={() =>
            void run(async () => {
              downloadFile(await exportAlbum(visible), `${destinationId}-photos.json`)
              setMessage(
                'Копия включает фотографии по текущим фильтрам. В ней есть сами снимки и подписи; передавайте её только тем, кому хотите показать альбом.',
              )
            })
          }
        >
          <Download size={17} />
          Скачать копию ({visible.length})
        </button>
        <label className="button secondary">
          <Upload size={17} />
          Загрузить копию
          <input
            aria-label="Загрузить копию альбома"
            type="file"
            accept="application/json,.json"
            disabled={busy || !ready}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file)
                void run(async () => {
                  const count = await importAlbum(
                    file,
                    new Set(bundle.places.map((place) => place.id)),
                    destinationId,
                  )
                  await refresh()
                  setMessage(
                    `Добавлено снимков: ${count}. Уже имеющиеся фотографии не дублируются.`,
                  )
                })
            }}
          />
        </label>
      </div>
      {error && (
        <p className="plan-warning" role="alert">
          {error}
        </p>
      )}
      <p className="plan-status" role="status">
        {message}
      </p>
      <div className="album-filters">
        <label>
          Место
          <select
            aria-label="Фильтр места в альбоме"
            value={placeFilter}
            onChange={(event) => filter('place', event.target.value)}
          >
            <option value="">Все места</option>
            {bundle.places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.nameRu}
              </option>
            ))}
          </select>
        </label>
        <label>
          Участник
          <select value={personFilter} onChange={(event) => filter('person', event.target.value)}>
            <option value="">Все участники</option>
            {allPeople.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Какие фото
          <select value={kind} onChange={(event) => filter('kind', event.target.value)}>
            <option value="">Все фотографии</option>
            <option value="group">Общие</option>
            <option value="individual">Индивидуальные</option>
          </select>
        </label>
      </div>
      {!visible.length && (
        <div className="plan-empty">
          <Camera size={35} />
          <h2>
            {tripPhotos.length ? 'Таких снимков пока нет.' : 'Здесь будут наши воспоминания.'}
          </h2>
          <p>
            {tripPhotos.length
              ? 'Попробуйте другие фильтры.'
              : 'Откройте «Добавить наши фотографии» и выберите первые снимки.'}
          </p>
        </div>
      )}
      <div className="album-grid">
        {visible.map((photo) => {
          const place = bundle.places.find((row) => row.id === photo.placeId)
          return (
            <article className="album-card" key={photo.id}>
              <LocalPhoto
                photo={photo}
                onOpen={() => {
                  setSelected(photo)
                  dialog.current!.showModal()
                }}
              />
              <div>
                <Link className="eyebrow" to={`/${destinationId}/place/${place?.slug ?? ''}`}>
                  {place?.nameRu ?? 'Место из поездки'}
                </Link>
                <p>{photo.caption || 'Без подписи'}</p>
                <small>
                  {photo.people.join(', ') || 'Участники не указаны'}
                  {photo.date && ` · ${formatDate(photo.date)}`}
                </small>
                <div className="plan-actions">
                  <button
                    className="text-button"
                    aria-label={`Изменить фото: ${photo.caption || 'без подписи'}`}
                    disabled={busy}
                    onClick={() => {
                      setEditing(photo)
                      setPlaceId(photo.placeId)
                      setCaption(photo.caption)
                      setPeople(photo.people.join(', '))
                      setDate(photo.date)
                      document
                        .querySelector('.album-upload')!
                        .scrollIntoView({ behavior: 'instant' })
                    }}
                  >
                    <Pencil size={16} />
                    Изменить
                  </button>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => setDeleting(deleting === photo.id ? undefined : photo.id)}
                  >
                    <Trash2 size={16} />
                    Удалить
                  </button>
                </div>
                {deleting === photo.id && (
                  <div className="album-delete">
                    <p>Удалить снимок из этого альбома?</p>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await deletePhoto(photo.id)
                          await refresh()
                          setDeleting(undefined)
                          if (editing?.id === photo.id) reset()
                          setMessage('Снимок удалён. Оригинал на вашем устройстве не затронут.')
                        })
                      }
                    >
                      Да, удалить
                    </button>
                    <button className="text-button" onClick={() => setDeleting(undefined)}>
                      Оставить
                    </button>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
      <p className="fine-print">
        Если очистить данные сайта или открыть его в другом браузере, местный альбом будет пустым.
        Копия поможет восстановить фотографии. За раз выгружаем до 200 снимков; большой альбом можно
        разделить фильтрами по местам.
      </p>
      <dialog ref={dialog} className="photo-dialog" aria-label="Наш снимок">
        <button
          className="dialog-close button secondary"
          aria-label="Закрыть наше фото"
          onClick={() => dialog.current!.close()}
        >
          <X size={20} />
        </button>
        {selected && (
          <>
            <LocalPhoto photo={selected} />
            <p>
              {selected.caption}
              <small>{selected.people.join(', ')}</small>
            </p>
            <button
              className="button secondary"
              onClick={() => downloadFile(selected.image, `${selected.id}.jpg`)}
            >
              <Download size={16} />
              Скачать снимок
            </button>
          </>
        )}
      </dialog>
    </main>
  )
}
