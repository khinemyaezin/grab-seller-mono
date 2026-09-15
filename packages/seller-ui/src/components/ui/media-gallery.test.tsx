import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import {
  MediaGallery,
  MediaGalleryDropzone,
  MediaGalleryErrors,
  MediaGalleryList,
  createMediaGalleryItem,
  reorderMediaGalleryItems,
  revokeMediaGalleryUrl,
  validateMediaFiles,
  type MediaGalleryItem,
} from "./media-gallery"

function jpegFile(name: string, size = 1024) {
  return new File(["x".repeat(size)], name, { type: "image/jpeg" })
}

afterEach(() => {
  cleanup()
})

describe("validateMediaFiles", () => {
  it("accepts allowed types and rejects others", () => {
    const result = validateMediaFiles([
      jpegFile("hero.jpg"),
      new File(["x"], "notes.pdf", { type: "application/pdf" }),
    ])

    expect(result.accepted.map((file) => file.name)).toEqual(["hero.jpg"])
    expect(result.rejected[0]).toMatchObject({
      name: "notes.pdf",
      reason: "type",
    })
  })

  it("rejects files over the size limit", () => {
    const result = validateMediaFiles([jpegFile("big.jpg", 2048)], {
      maxSizeBytes: 1024,
    })

    expect(result.accepted).toHaveLength(0)
    expect(result.rejected[0]).toMatchObject({
      name: "big.jpg",
      reason: "size",
    })
  })

  it("rejects files beyond maxItems remaining slots", () => {
    const result = validateMediaFiles(
      [jpegFile("a.jpg"), jpegFile("b.jpg"), jpegFile("c.jpg")],
      { maxItems: 2, currentCount: 1 },
    )

    expect(result.accepted.map((file) => file.name)).toEqual(["a.jpg"])
    expect(result.rejected.map((file) => file.reason)).toEqual(["maxItems", "maxItems"])
  })
})

describe("reorderMediaGalleryItems", () => {
  it("rewrites rank after moving an item", () => {
    const items: MediaGalleryItem[] = [
      { id: "a", url: "a", contentType: "image/jpeg", rank: 0 },
      { id: "b", url: "b", contentType: "image/jpeg", rank: 1 },
      { id: "c", url: "c", contentType: "image/jpeg", rank: 2 },
    ]

    expect(reorderMediaGalleryItems(items, 2, 0).map((item) => item.id)).toEqual([
      "c",
      "a",
      "b",
    ])
    expect(reorderMediaGalleryItems(items, 2, 0).map((item) => item.rank)).toEqual([
      0, 1, 2,
    ])
  })
})

describe("revokeMediaGalleryUrl", () => {
  it("revokes blob URLs owned by a file", () => {
    const revoke = vi.fn()
    vi.stubGlobal("URL", {
      ...URL,
      revokeObjectURL: revoke,
    })
    const file = jpegFile("hero.jpg")
    revokeMediaGalleryUrl({
      id: "1",
      url: "blob:http://localhost/1",
      contentType: "image/jpeg",
      file,
      rank: 0,
    })
    expect(revoke).toHaveBeenCalledWith("blob:http://localhost/1")
    vi.unstubAllGlobals()
  })
})

describe("MediaGallery", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("adds files from the dropzone and shows a featured badge on rank 0", () => {
    const onChange = vi.fn()
    render(
      <MediaGallery value={[]} onChange={onChange}>
        <MediaGalleryDropzone />
        <MediaGalleryList />
      </MediaGallery>,
    )

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [jpegFile("hero.jpg")] } })

    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0] as MediaGalleryItem[]
    expect(next).toHaveLength(1)
    expect(next[0].name).toBe("hero.jpg")
    expect(next[0].rank).toBe(0)
  })

  it("shows rejected file errors without adding them", () => {
    const onChange = vi.fn()
    render(
      <MediaGallery value={[]} onChange={onChange}>
        <MediaGalleryDropzone />
        <MediaGalleryList />
        <MediaGalleryErrors />
      </MediaGallery>,
    )

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File(["x"], "notes.pdf", { type: "application/pdf" })] },
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText("notes.pdf is not an allowed file type.")).toBeTruthy()
  })

  it("moves and removes items", () => {
    const first = createMediaGalleryItem(jpegFile("first.jpg"), 0)
    const second = createMediaGalleryItem(jpegFile("second.jpg"), 1)
    const onChange = vi.fn()

    const { rerender } = render(
      <MediaGallery value={[first, second]} onChange={onChange}>
        <MediaGalleryList />
      </MediaGallery>,
    )

    fireEvent.click(screen.getAllByLabelText("Move later")[0])
    expect(onChange.mock.calls[0][0].map((item: MediaGalleryItem) => item.name)).toEqual([
      "second.jpg",
      "first.jpg",
    ])

    rerender(
      <MediaGallery value={[first, second]} onChange={onChange}>
        <MediaGalleryList />
      </MediaGallery>,
    )
    fireEvent.click(screen.getAllByLabelText("Remove media")[1])
    expect(onChange.mock.calls[1][0].map((item: MediaGalleryItem) => item.name)).toEqual([
      "first.jpg",
    ])
  })
})
