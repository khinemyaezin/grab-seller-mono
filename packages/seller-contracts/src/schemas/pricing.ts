export type PricingCreateContext = {
  sku: string;
};

export type PricingEditContext = {
  sku: string;
  variantId: string;
};

export const PricingPayloadSchema = {
  type: "object" as const,
  properties: {
    sku: {
      type: "string" as const
    },
    currencyCode: {
      type: "string" as const,
      minLength: 3,
      maxLength: 3,
    },
    amount: {
      type: "number" as const,
      minimum: 0,
      errorMessage: {
        type: "Amount must be a number",
        minimum: "Amount must be greater than or equal to 0",
      }
    },
  },
  required: ["currencyCode", "amount"],
  additionalProperties: false,
};

export type PricingPayload = {
  sku: string;
  currencyCode: string;
  amount: number;
};

export const PricingEditPayloadSchema = {
  type: "object" as const,
  properties: {
    sku: {
      type: "string" as const
    },
    currencyCode: {
      type: "string" as const,
      minLength: 3,
      maxLength: 3,
    },
    amount: {
      type: "number" as const,
      minimum: 0,
      errorMessage: {
        type: "Amount must be a number",
        minimum: "Amount must be greater than or equal to 0",
      }
    },
    priceSetId: {
      type: "string" as const,
    },
    priceId: {
      type: "string" as const,
    },
  },
  required: ["currencyCode", "amount"],
  additionalProperties: false,
};

export type PricingEditPayload = {
  sku: string;
  currencyCode: string;
  amount: number;
  priceSetId?: string;
  priceId?: string;
};