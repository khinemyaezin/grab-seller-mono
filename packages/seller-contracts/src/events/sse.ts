
export type StreamReadyV1 = {
    producerId: "backend" | "host";
    lastEventId?: string;
};

export type StreamDisconnectedV1 = {
    producerId: "host";
    reason?: "abort" | "error" | "logout" | "context-change";
};

export type WorkflowUpdatedV1 = {
    producerId: string;
    workflowId: string;
    workflowName: string;
    status: string;
    idempotencyKey?: string;
    errorMessage?: string;
};