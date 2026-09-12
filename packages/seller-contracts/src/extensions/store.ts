import { SlotEntry } from "./slots";

export type ExtensionSyncStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ReadonlyMap<string, SlotEntry>;
  getEntry: (groupId: string) => SlotEntry | undefined;
  setPayload: (entry: SlotEntry) => void;
  prune: (liveGroupIds: ReadonlySet<string>) => string[];
  clear: () => void;
};
