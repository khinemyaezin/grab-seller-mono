import { beforeEach, describe, expect, it, vi } from "vitest";
import { stageMediaDrafts, sortedMediaByRank, type MediaStagingItem } from "./media-staging.js";
import * as storage from "./storage.js";

vi.mock("./storage.js", () => ({
  putPresignedObject: vi.fn(),
  collapseRequiredHeaders: vi.fn(),
}));

describe("sortedMediaByRank", () => {
  it("sorts items in ascending order by rank", () => {
    const items = [
      { id: "b", rank: 2 },
      { id: "a", rank: 0 },
      { id: "c", rank: 1 },
    ];
    expect(sortedMediaByRank(items).map((i) => i.id)).toEqual(["a", "c", "b"]);
  });
});

describe("stageMediaDrafts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authorizes and uploads local draft files, returning storageKeys", async () => {
    const file = new File(["xyz"], "image.png", { type: "image/png" });
    const authorizer = vi.fn().mockResolvedValue({
      url: "https://s3.example.com/upload",
      method: "PUT",
      requiredHeaders: { "Content-Type": "image/png" },
      storageKey: "merchants/1/uploads/image.png",
    });
    vi.mocked(storage.putPresignedObject).mockResolvedValue(undefined);

    const onStatus = vi.fn();
    const onStaged = vi.fn();

    const items: MediaStagingItem[] = [
      {
        id: "item-1",
        contentType: "image/png",
        name: "image.png",
        file,
        rank: 0,
        sizeBytes: 3,
      },
    ];

    const result = await stageMediaDrafts({
      items,
      authorizer,
      onItemStatus: onStatus,
      onStaged,
    });

    expect(authorizer).toHaveBeenCalledWith({
      filename: "image.png",
      contentType: "image/png",
      sizeBytes: 3,
    });
    expect(storage.putPresignedObject).toHaveBeenCalledWith(
      "https://s3.example.com/upload",
      file,
      { "Content-Type": "image/png" },
      "PUT",
    );
    expect(onStatus).toHaveBeenCalledWith("item-1", "uploading");
    expect(onStatus).toHaveBeenCalledWith("item-1", "done");
    expect(onStaged).toHaveBeenCalledWith("item-1", "merchants/1/uploads/image.png");
    expect(result.get("item-1")).toBe("merchants/1/uploads/image.png");
  });

  it("skips items that already have a storageKey", async () => {
    const authorizer = vi.fn();
    const items: MediaStagingItem[] = [
      {
        id: "item-1",
        contentType: "image/png",
        file: new File(["x"], "img.png", { type: "image/png" }),
        storageKey: "already/staged.png",
        rank: 0,
      },
    ];

    const result = await stageMediaDrafts({ items, authorizer });
    expect(authorizer).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it("retries failed PUT attempts up to maxAttempts", async () => {
    const file = new File(["data"], "retry.png", { type: "image/png" });
    const authorizer = vi.fn()
      .mockResolvedValueOnce({
        url: "https://s3/expired",
        storageKey: "expired.png",
      })
      .mockResolvedValueOnce({
        url: "https://s3/fresh",
        storageKey: "fresh.png",
      });

    vi.mocked(storage.putPresignedObject)
      .mockRejectedValueOnce(new Error("Storage upload failed (403)"))
      .mockResolvedValueOnce(undefined);

    const result = await stageMediaDrafts({
      items: [{ id: "retry-1", file, contentType: "image/png", rank: 0 }],
      authorizer,
    });

    expect(authorizer).toHaveBeenCalledTimes(2);
    expect(result.get("retry-1")).toBe("fresh.png");
  });

  it("marks error and throws when all retries fail", async () => {
    const file = new File(["data"], "fail.png", { type: "image/png" });
    const authorizer = vi.fn().mockResolvedValue({
      url: "https://s3/fail",
      storageKey: "fail.png",
    });
    vi.mocked(storage.putPresignedObject).mockRejectedValue(new Error("Storage upload failed (500)"));

    const onStatus = vi.fn();

    await expect(
      stageMediaDrafts({
        items: [{ id: "fail-1", file, contentType: "image/png", rank: 0 }],
        authorizer,
        maxAttempts: 2,
        onItemStatus: onStatus,
      }),
    ).rejects.toThrow("Storage upload failed (500)");

    expect(authorizer).toHaveBeenCalledTimes(2);
    expect(onStatus).toHaveBeenCalledWith("fail-1", "error", "Storage upload failed (500)");
  });
});
