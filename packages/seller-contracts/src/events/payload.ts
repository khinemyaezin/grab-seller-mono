import {
    InventoryCreateContext,
    InventoryEditContext,
    InventoryEditPayload,
    InventoryPayload,
    PricingCreateContext,
    PricingEditContext,
    PricingEditPayload,
    PricingPayload,
} from "../schemas";
import { EventBusMeta, EventEnvelope, ExtensionFieldErrors } from "./core";
import { StreamDisconnectedV1, StreamReadyV1, WorkflowUpdatedV1 } from "./sse";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastPayload = {
    type: ToastType;
    message: string;
    description?: string;
    position?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
};

export type ShellBreadcrumbPayload = {
    leaf?: string | null;
    segments?: Record<string, string | null>;
};

export type FormDirtyPayload = {
    dirty: boolean;
    label?: string;
};

export type FormSavedPayload = EventBusMeta & {
    status: "success" | "failed";
    error?: string;
};

export type StateEventPayloads = {
    "form:dirty:v1": EventEnvelope<FormDirtyPayload>;
    "extension:pricing:new:hydrate:v1": EventEnvelope<PricingCreateContext>;
    "extension:pricing:new:updated:v1": EventEnvelope<PricingPayload>;
    "extension:pricing:edit:hydrate:v1": EventEnvelope<PricingEditContext>;
    "extension:pricing:edit:updated:v1": EventEnvelope<PricingEditPayload>;
    "extension:inventory:new:hydrate:v1": EventEnvelope<InventoryCreateContext>;
    "extension:inventory:new:updated:v1": EventEnvelope<InventoryPayload>;
    "extension:inventory:edit:hydrate:v1": EventEnvelope<InventoryEditContext>;
    "extension:inventory:edit:updated:v1": EventEnvelope<InventoryEditPayload>;
}

export type SignalEventPayloads = {
    "auth:login-success:v1": Record<string, never>;
    "auth:registration-success:v1": Record<string, never>;
    "auth:logout:v1": Record<string, never>;
    "auth:session-refreshed:v1": Record<string, never>;
    "auth:session-expired:v1": Record<string, never>;
    "auth:context-selected:v1": { assignmentId: string };
    "seller-merchant:registration-success:v1": Record<string, never>;
    "shell:toast:v1": ToastPayload;
    "shell:breadcrumb:v1": ShellBreadcrumbPayload;

    "extension:validate:v1": EventBusMeta;
    "extension:validated:v1": EventEnvelope<unknown> & { valid: boolean, errors?: ExtensionFieldErrors };

    "form:save:v1": EventBusMeta;
    "form:discard:v1": EventBusMeta;
    "form:saved:v1": FormSavedPayload;

    "stream:ready:v1": StreamReadyV1;
    "stream:disconnected:v1": StreamDisconnectedV1;
    "workflow:updated:v1": WorkflowUpdatedV1;
}

export type EventPayloads = StateEventPayloads & SignalEventPayloads;