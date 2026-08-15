export type PricingCreateContext = {
  sku: string;
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