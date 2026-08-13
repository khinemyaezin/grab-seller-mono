import { SlotEntry, SlotValidateResult } from "./slots";

export type DomainSubmitContract<ProjectionType> = {
  absorb: (results: SlotValidateResult[]) => void;
  project: () => ProjectionType;
};

export type DomainSubmitResult<ProjectionType> = {
  domains: string[];
  contributions: ProjectionType;
};

export type ExtensionSyncStore<ProjectionType> = {
  registerDomain: (domain: string, contract: DomainSubmitContract<ProjectionType> | undefined) => void;
  runDomainSubmit: (results: SlotValidateResult[]) => DomainSubmitResult<ProjectionType>;

  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ReadonlyMap<string, SlotEntry>;
  getEntry: (instanceId: string) => SlotEntry | undefined;
  setPayload: (entry: SlotEntry) => void;
  prune: (domain: string, liveInstanceIds: ReadonlySet<string>) => string[];
  clearDomain: (domain: string) => void;
};