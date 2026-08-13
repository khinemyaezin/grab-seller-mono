export type EventBusMeta = {
  producerId: string;
  groupId: string;
  entityKey?: string;
  sequence?: number;
  slotId?: string;
};

export type EventEnvelope<TPayload> = EventBusMeta & {
  payload: TPayload;
}

export type ExtensionFieldErrors = Record<string, string>;

export type EventSubscribeOptions = {
  replay?: boolean;
};
