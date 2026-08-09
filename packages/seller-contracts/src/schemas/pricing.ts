export type PricingCreateContext = {
  sku?: string;
};

export const PricingPayloadSchema = {
  type: "object" as const,
  properties: {
    sku: {
      type: "string" as const,
      minLength: 1,
    },
    currencyCode: {
      type: "string" as const,
      minLength: 3,
      maxLength: 3,
    },
    amount: {
      type: "number" as const,
      minimum: 0,
    },
  },
  required: ["sku", "currencyCode", "amount"],
  additionalProperties: false,
};

export type PricingPayload = {
  sku: string;
  currencyCode: string;
  amount: number;
};