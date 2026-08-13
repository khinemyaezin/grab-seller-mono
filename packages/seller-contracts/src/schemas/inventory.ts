export type InventoryCreateContext = {
  sku?: string;
};

export const InventoryPayloadSchema = {
  type: "object" as const,
  properties: {
    sku: {
      type: "string" as const,
    },
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
  },
  required: ["locationId", "initialQuantity"],
  additionalProperties: false,
};

export type InventoryPayload = {
  sku: string;
  locationId: string;
  initialQuantity: number;
  safetyStock?: number;
};
