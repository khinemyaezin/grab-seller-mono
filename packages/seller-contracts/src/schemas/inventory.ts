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
};

export type InventoryPayload = {
  sku: string;
  locations: InventoryLocationStock[];
};
