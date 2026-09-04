export type InventoryCreateContext = {
  sku: string;
};
export const InventoryLocationStockSchema = {
  type: "object" as const,
  properties: {
    locationId: {
      type: "string" as const,
      minLength: 1,
      errorMessage: {
        minLength: "Location is required",
      },
    },
    initialQuantity: {
      type: "number" as const,
      minimum: 0,
      errorMessage: {
        type: "Initial quantity must be a number",
        minimum: "Must be 0 or greater",
      },
    },
    safetyStock: {
      type: "number" as const,
      minimum: 0,
      errorMessage: {
        type: "Safety stock must be a number",
        minimum: "Must be 0 or greater",
      },
    },
    inventoryItemId: {
      type: "string" as const,
    },
  },
  required: ["locationId", "initialQuantity"],
  additionalProperties: false,
};

export const InventoryPayloadSchema = {
  type: "object" as const,
  properties: {
    sku: {
      type: "string" as const,
    },
    locations: {
      type: "array" as const,
      minItems: 1,
      items: InventoryLocationStockSchema,
      errorMessage: {
        minItems: "At least one location is required",
      },
    },
  },
  required: ["locations"],
  additionalProperties: false,
};

export type InventoryLocationStock = {
  locationId: string;
  initialQuantity: number;
  safetyStock: number;
  inventoryItemId?: string;
};

export type InventoryPayload = {
  sku: string;
  locations: InventoryLocationStock[];
};

export type InventoryEditContext = {
  variantId?: string;
  sku?: string;
};

export type InventoryAdjustmentReason =
  | "CYCLE_COUNT"
  | "DAMAGED"
  | "EXPIRED"
  | "LOST"
  | "FOUND"
  | "THEFT"
  | "CORRECTION";

export type InventorySyncOp = "CREATE" | "ADJUST" | "DAMAGE" | "WRITE_OFF" | "REORDER";

export type InventoryEditCreateStock = {
  initialQuantity: number;
  safetyStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  maxStock?: number;
};

export type InventoryEditAdjustStock = {
  newOnHandQuantity: number;
  reason: InventoryAdjustmentReason;
};

export type InventoryEditDamageStock = {
  quantity: number;
  notes?: string;
};

export type InventoryEditWriteOffStock = {
  quantity: number;
  reason: string;
  notes?: string;
};

export type InventoryEditReorder = {
  safetyStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  maxStock?: number;
};

export type InventoryEditOp =
  | { op: "CREATE"; locationId: string; create: InventoryEditCreateStock }
  | { op: "ADJUST"; inventoryItemId: string; adjust: InventoryEditAdjustStock; reorder?: InventoryEditReorder }

export type InventoryEditPayload = {
  sku: string;
  variantId?: string;
  ops: InventoryEditOp[];
};

export const InventoryEditCreateStockSchema = {
  type: "object" as const,
  properties: {
    initialQuantity: {
      type: "number" as const,
      minimum: 0,
      errorMessage: {
        type: "Initial quantity must be a number",
        minimum: "Must be 0 or greater",
      },
    },
    safetyStock: {
      type: "number" as const,
      minimum: 0,
      errorMessage: {
        type: "Safety stock must be a number",
        minimum: "Must be 0 or greater",
      },
    },
    reorderPoint: {
      type: "number" as const,
      minimum: 0,
      errorMessage: {
        type: "Reorder point must be a number",
        minimum: "Must be 0 or greater",
      },
    },
    reorderQuantity: {
      type: "number" as const,
      minimum: 0,
      errorMessage: {
        type: "Reorder quantity must be a number",
        minimum: "Must be 0 or greater",
      },
    },
    maxStock: {
      type: "number" as const,
      minimum: 0,
      errorMessage: {
        type: "Max stock must be a number",
        minimum: "Must be 0 or greater",
      },
    },
  },
  required: ["initialQuantity"],
  additionalProperties: false,
};

export const InventoryEditAdjustStockSchema = {
  type: "object" as const,
  properties: {
    newOnHandQuantity: {
      type: "number" as const,
      minimum: 0,
      errorMessage: {
        type: "New on hand quantity must be a number",
        minimum: "Must be 0 or greater",
      },
    },
    reason: {
      type: "string" as const,
      enum: [
        "CYCLE_COUNT",
        "DAMAGED",
        "EXPIRED",
        "LOST",
        "FOUND",
        "THEFT",
        "CORRECTION",
      ],
      errorMessage: {
        enum: "Invalid adjustment reason",
      },
    },
  },
  required: ["newOnHandQuantity", "reason"],
  additionalProperties: false,
};

export const InventoryEditPayloadSchema = {
  type: "object" as const,
  properties: {
    sku: {
      type: "string" as const,
    },
    variantId: {
      type: "string" as const,
    },
    ops: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          op: {
            type: "string" as const,
            enum: ["CREATE", "ADJUST"],
          },
          locationId: { type: "string" as const },
          inventoryItemId: { type: "string" as const },
          create: InventoryEditCreateStockSchema,
          adjust: InventoryEditAdjustStockSchema
        },
        required: ["op"],
        additionalProperties: false,
      },
    },
  },
  required: ["sku", "ops"],
  additionalProperties: false,
};

