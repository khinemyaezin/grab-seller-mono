import { putPresignedObject } from "./storage.js";

export const DEFAULT_MEDIA_UPLOAD_ATTEMPTS = 3;

export type MediaStagingStatus = "idle" | "uploading" | "error" | "done";

export type MediaUploadAuthorization = {
  url: string;
  storageKey: string;
  method?: string;
  requiredHeaders?: Record<string, string>;
};

export type MediaUploadAuthorizer = (metadata: {
  filename: string;
  contentType: string;
  sizeBytes: number;
}) => Promise<MediaUploadAuthorization>;

export type MediaStagingItem = {
  id: string;
  file?: File;
  storageKey?: string;
  contentType: string;
  name?: string;
  sizeBytes?: number;
  rank: number;
  status?: MediaStagingStatus;
  error?: string;
};

export type MediaUploader = (
  url: string,
  body: Blob,
  requiredHeaders?: Record<string, string>,
  method?: string,
) => Promise<void>;

export type StageMediaDraftsOptions<T extends MediaStagingItem = MediaStagingItem> = {
  items: T[];
  authorizer: MediaUploadAuthorizer;
  uploader?: MediaUploader;
  maxAttempts?: number;
  onItemStatus?: (id: string, status: MediaStagingStatus, error?: string) => void;
  onStaged?: (id: string, storageKey: string) => void;
};

export function sortedMediaByRank<T extends { rank: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.rank - right.rank);
}

function uploadErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Storage upload failed";
}

async function uploadMediaDraft<T extends MediaStagingItem>(
  item: T,
  authorizer: MediaUploadAuthorizer,
  uploader: MediaUploader,
  maxAttempts: number,
  onItemStatus?: (id: string, status: MediaStagingStatus, error?: string) => void,
): Promise<string> {
  const file = item.file;
  if (!file) {
    throw new Error("Missing file for media upload");
  }

  onItemStatus?.(item.id, "uploading");
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const upload = await authorizer({
        filename: item.name ?? file.name,
        contentType: item.contentType,
        sizeBytes: item.sizeBytes ?? file.size,
      });
      await uploader(
        upload.url,
        file,
        upload.requiredHeaders ?? {},
        upload.method,
      );
      onItemStatus?.(item.id, "done");
      return upload.storageKey;
    } catch (error) {
      lastError = error;
    }
  }

  const message = uploadErrorMessage(lastError);
  onItemStatus?.(item.id, "error", message);
  throw lastError instanceof Error ? lastError : new Error(message);
}

export async function stageMediaDrafts<T extends MediaStagingItem = MediaStagingItem>({
  items,
  authorizer,
  uploader = putPresignedObject,
  maxAttempts = DEFAULT_MEDIA_UPLOAD_ATTEMPTS,
  onItemStatus,
  onStaged,
}: StageMediaDraftsOptions<T>): Promise<Map<string, string>> {
  const uploadedKeys = new Map<string, string>();
  const drafts = sortedMediaByRank(items).filter((item) => item.file && !item.storageKey);

  for (const item of drafts) {
    const storageKey = await uploadMediaDraft(item, authorizer, uploader, maxAttempts, onItemStatus);
    uploadedKeys.set(item.id, storageKey);
    onStaged?.(item.id, storageKey);
  }

  return uploadedKeys;
}

