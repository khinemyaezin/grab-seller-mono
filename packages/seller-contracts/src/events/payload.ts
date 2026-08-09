import { PricingPayload } from "../schemas";
import { EventBusMeta, EventEnvelope, ExtensionFieldErrors } from "./core";

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

export type StateEventPayloads = {
    "extension:pricing:hydrate:v1": EventEnvelope<unknown>;
    "extension:pricing:updated:v1": EventEnvelope<PricingPayload>;
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
}

export type EventPayloads = StateEventPayloads & SignalEventPayloads;