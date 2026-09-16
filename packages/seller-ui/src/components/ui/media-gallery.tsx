import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, UploadIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Badge } from "@/components/ui/badge"

export const DEFAULT_MEDIA_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
] as const

export const DEFAULT_MEDIA_MAX_SIZE_BYTES = 10_485_760

export type MediaGalleryItemStatus = "idle" | "uploading" | "error" | "done"

export type MediaGalleryItem = {
  id: string
  url: string
  contentType: string
  name?: string
  sizeBytes?: number
  file?: File
  rank: number
  storageKey?: string
  status?: MediaGalleryItemStatus
  error?: string
}

export type MediaGalleryRules = {
  accept?: string[]
  maxSizeBytes?: number
  maxItems?: number
  multiple?: boolean
}

export type MediaGalleryRejectionReason = "type" | "size" | "maxItems"

export type MediaGalleryRejection = {
  name: string
  reason: MediaGalleryRejectionReason
  message: string
}

export type MediaGalleryFileResult = {
  accepted: File[]
  rejected: MediaGalleryRejection[]
}

type MediaGalleryContextValue = {
  items: MediaGalleryItem[]
  onChange: (items: MediaGalleryItem[]) => void
  accept: string[]
  maxSizeBytes: number
  maxItems?: number
  multiple: boolean
  invalid?: boolean
  disabled?: boolean
  featuredLabel: string
  errors: MediaGalleryRejection[]
  setErrors: (errors: MediaGalleryRejection[]) => void
}

const MediaGalleryContext = React.createContext<MediaGalleryContextValue | null>(null)

export function useMediaGallery() {
  const context = React.useContext(MediaGalleryContext)
  if (!context) {
    throw new Error("MediaGallery components must be used within <MediaGallery />")
  }
  return context
}

export function createMediaGalleryItem(file: File, rank = 0): MediaGalleryItem {
  return {
    id: crypto.randomUUID(),
    url: URL.createObjectURL(file),
    contentType: file.type,
    name: file.name,
    sizeBytes: file.size,
    file,
    rank,
    status: "idle",
  }
}

export function validateMediaFiles(
  files: File[],
  rules: MediaGalleryRules & { currentCount?: number } = {},
): MediaGalleryFileResult {
  const accept = rules.accept ?? [...DEFAULT_MEDIA_ACCEPT]
  const maxSizeBytes = rules.maxSizeBytes ?? DEFAULT_MEDIA_MAX_SIZE_BYTES
  const multiple = rules.multiple ?? true
  const currentCount = rules.currentCount ?? 0
  const maxItems = multiple ? rules.maxItems : 1
  const remaining =
    maxItems == null ? Number.POSITIVE_INFINITY : Math.max(0, maxItems - currentCount)

  const accepted: File[] = []
  const rejected: MediaGalleryRejection[] = []

  for (const file of files) {
    if (!accept.includes(file.type)) {
      rejected.push({
        name: file.name,
        reason: "type",
        message: `${file.name} is not an allowed file type.`,
      })
      continue
    }
    if (file.size > maxSizeBytes) {
      rejected.push({
        name: file.name,
        reason: "size",
        message: `${file.name} exceeds the ${formatBytes(maxSizeBytes)} limit.`,
      })
      continue
    }
    if (accepted.length >= remaining) {
      rejected.push({
        name: file.name,
        reason: "maxItems",
        message: `Only ${maxItems} file${maxItems === 1 ? "" : "s"} can be added.`,
      })
      continue
    }
    accepted.push(file)
  }

  return { accepted, rejected }
}

export function reorderMediaGalleryItems(
  items: MediaGalleryItem[],
  from: number,
  to: number,
): MediaGalleryItem[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items.map((item, rank) => ({ ...item, rank }))
  }

  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next.map((item, rank) => ({ ...item, rank }))
}

export function revokeMediaGalleryUrl(item: MediaGalleryItem): void {
  if (item.file && item.url.startsWith("blob:")) {
    URL.revokeObjectURL(item.url)
  }
}

export function isMediaGalleryDirty(
  items: MediaGalleryItem[],
  seed: MediaGalleryItem[] = [],
): boolean {
  if (items.some((item) => item.file)) return true
  if (items.length !== seed.length) return true
  return items.some((item, index) => {
    const previous = seed[index]
    return (
      item.id !== previous?.id ||
      item.rank !== previous?.rank ||
      item.storageKey !== previous?.storageKey
    )
  })
}

export type MediaAttachmentPayload = {
  id?: string
  storageKey: string
  contentType: string
  rank: number
}

export function formatMediaReplacements(
  items: MediaGalleryItem[],
): MediaAttachmentPayload[] {
  return [...items]
    .sort((left, right) => left.rank - right.rank)
    .map((item) => {
      if (!item.storageKey) {
        throw new Error("Missing storage key for media item")
      }

      return {
        ...(item.file ? {} : { id: item.id }),
        storageKey: item.storageKey,
        contentType: item.contentType,
        rank: item.rank,
      }
    })
}

export function extractMediaFileName(storageKey?: string, fallback = "Media"): string {
  if (!storageKey) {
    return fallback
  }
  const slash = storageKey.lastIndexOf("/")
  const name = slash >= 0 ? storageKey.slice(slash + 1) : storageKey
  return name || fallback
}

export type RemoteMediaSource = {
  id: string
  url: string
  contentType: string
  rank: number
  storageKey?: string
  name?: string
  sizeBytes?: number
}

export function toMediaGalleryItems<T extends RemoteMediaSource>(
  medias: T[] | null | undefined,
): MediaGalleryItem[] {
  return (medias ?? []).map((media) => ({
    id: media.id,
    url: media.url,
    contentType: media.contentType,
    rank: media.rank,
    storageKey: media.storageKey,
    name: media.name ?? extractMediaFileName(media.storageKey),
    sizeBytes: media.sizeBytes,
    status: "done" as const,
  }))
}


function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round(bytes / (1024 * 1024))} MB`
}

function isVideo(contentType: string) {
  return contentType.startsWith("video/")
}

export type MediaGalleryProps = React.ComponentProps<"div"> &
  MediaGalleryRules & {
    value: MediaGalleryItem[]
    onChange: (items: MediaGalleryItem[]) => void
    invalid?: boolean
    disabled?: boolean
    featuredLabel?: string
  }

export function MediaGallery({
  value,
  onChange,
  accept,
  maxSizeBytes,
  maxItems,
  multiple = true,
  invalid,
  disabled,
  featuredLabel = "Featured",
  className,
  children,
  ...props
}: MediaGalleryProps) {
  const [errors, setErrors] = React.useState<MediaGalleryRejection[]>([])
  const items = value ?? []

  const context = React.useMemo<MediaGalleryContextValue>(
    () => ({
      items,
      onChange,
      accept: accept ?? [...DEFAULT_MEDIA_ACCEPT],
      maxSizeBytes: maxSizeBytes ?? DEFAULT_MEDIA_MAX_SIZE_BYTES,
      maxItems,
      multiple,
      invalid,
      disabled,
      featuredLabel,
      errors,
      setErrors,
    }),
    [
      items,
      onChange,
      accept,
      maxSizeBytes,
      maxItems,
      multiple,
      invalid,
      disabled,
      featuredLabel,
      errors,
    ],
  )

  return (
    <MediaGalleryContext.Provider value={context}>
      <div
        data-slot="media-gallery"
        data-invalid={invalid ? "true" : undefined}
        data-disabled={disabled ? "true" : undefined}
        className={cn("flex w-full flex-col gap-3", className)}
        {...props}
      >
        {children}
      </div>
    </MediaGalleryContext.Provider>
  )
}

export function MediaGalleryDropzone({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const {
    items,
    onChange,
    accept,
    maxSizeBytes,
    maxItems,
    multiple,
    disabled,
    setErrors,
  } = useMediaGallery()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const addFiles = React.useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList)
      const { accepted, rejected } = validateMediaFiles(files, {
        accept,
        maxSizeBytes,
        maxItems,
        multiple,
        currentCount: items.length,
      })
      setErrors(rejected)
      if (!accepted.length) return

      const startRank = multiple ? items.length : 0
      const nextItems = accepted.map((file, index) =>
        createMediaGalleryItem(file, startRank + index),
      )
      if (multiple) {
        onChange([...items, ...nextItems])
        return
      }
      items.forEach(revokeMediaGalleryUrl)
      onChange(nextItems)
    },
    [accept, items, maxItems, maxSizeBytes, multiple, onChange, setErrors],
  )

  return (
    <div
      data-slot="media-gallery-dropzone"
      data-dragging={isDragging ? "true" : undefined}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground transition-colors",
        "hover:bg-muted/50 focus-within:ring-1 focus-within:ring-ring/50",
        "data-[dragging=true]:border-primary data-[dragging=true]:bg-muted/70",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        if (!disabled) addFiles(event.dataTransfer.files)
      }}
      {...props}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept.join(",")}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.files) addFiles(event.target.files)
          event.target.value = ""
        }}
      />
      {children ?? (
        <>
          <UploadIcon className="size-5" />
          <span>Drop files here or click to upload</span>
        </>
      )}
    </div>
  )
}

export function MediaGalleryEmpty({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="media-gallery-empty"
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <ImageIcon className="size-4" />
          <span>No media added yet</span>
        </>
      )}
    </div>
  )
}

export function MediaGalleryList({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { items } = useMediaGallery()

  if (!items.length && !children) {
    return <MediaGalleryEmpty />
  }

  return (
    <div
      data-slot="media-gallery-list"
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3",
        className,
      )}
      {...props}
    >
      {children ?? items.map((item) => (
        <MediaGalleryItem key={item.id} item={item} />
      ))}
    </div>
  )
}

export function MediaGalleryItem({
  item,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { item: MediaGalleryItem }) {
  const { items, onChange, disabled, featuredLabel } = useMediaGallery()
  const index = items.findIndex((entry) => entry.id === item.id)
  const state = item.status === "error" ? "error" : item.status === "uploading" ? "uploading" : "done"
  const video = isVideo(item.contentType)

  const move = (to: number) => {
    if (disabled || index < 0) return
    onChange(reorderMediaGalleryItems(items, index, to))
  }

  const remove = () => {
    if (disabled || index < 0) return
    revokeMediaGalleryUrl(item)
    onChange(
      items
        .filter((entry) => entry.id !== item.id)
        .map((entry, rank) => ({ ...entry, rank })),
    )
  }

  return (
    <Attachment
      data-slot="media-gallery-item"
      orientation="vertical"
      state={state}
      className={cn("w-full max-w-none", className)}
      {...props}
    >
      {children ?? (
        <>
          <AttachmentMedia variant="image" className="relative w-full">
            {video ? (
              <video src={item.url} className="aspect-square w-full object-cover" muted />
            ) : (
              <img src={item.url} alt={item.name ?? "Media"} />
            )}
            {item.rank === 0 && (
              <Badge className="absolute top-2 left-2" variant="secondary">
                {featuredLabel}
              </Badge>
            )}
          </AttachmentMedia>
          <AttachmentTitle>{item.name ?? "Media"}</AttachmentTitle>
          {item.error ? (
            <AttachmentDescription>{item.error}</AttachmentDescription>
          ) : item.sizeBytes != null ? (
            <AttachmentDescription>{formatBytes(item.sizeBytes)}</AttachmentDescription>
          ) : null}
          <AttachmentActions>
            <AttachmentAction
              type="button"
              aria-label="Move earlier"
              disabled={disabled || index <= 0}
              onClick={() => move(index - 1)}
            >
              <ChevronLeftIcon />
            </AttachmentAction>
            <AttachmentAction
              type="button"
              aria-label="Move later"
              disabled={disabled || index < 0 || index >= items.length - 1}
              onClick={() => move(index + 1)}
            >
              <ChevronRightIcon />
            </AttachmentAction>
            <AttachmentAction
              type="button"
              aria-label="Remove media"
              disabled={disabled}
              onClick={remove}
            >
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </>
      )}
    </Attachment>
  )
}

export function MediaGalleryErrors({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  const { errors } = useMediaGallery()
  if (!errors.length) return null

  return (
    <ul
      data-slot="media-gallery-errors"
      className={cn("flex list-disc flex-col gap-1 pl-4 text-sm text-destructive", className)}
      {...props}
    >
      {errors.map((error) => (
        <li key={`${error.reason}-${error.name}`}>{error.message}</li>
      ))}
    </ul>
  )
}
