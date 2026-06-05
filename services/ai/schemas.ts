import type { CompletionCreateParams } from "groq-sdk/resources/chat";

const nutritionItemSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "calories",
    "protein_g",
    "carbohydrates_total_g",
    "fat_total_g",
  ],
  properties: {
    name: { type: "string" },
    calories: { type: "number" },
    protein_g: { type: "number" },
    carbohydrates_total_g: { type: "number" },
    fat_total_g: { type: "number" },
  },
};

export const nutritionItemsSchema = {
  type: "array",
  items: nutritionItemSchema,
};

export const userIntentResponseFormat: CompletionCreateParams.ResponseFormatJsonSchema = {
  type: "json_schema",
  json_schema: {
    name: "user_intent",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["action", "confidence", "reply"],
      properties: {
        action: {
          type: "string",
          enum: [
            "ADD_MEAL",
            "ANALYZE_DAY",
            "FOOD_ADVICE",
            "DELETE_LAST_MEAL",
            "UNKNOWN",
          ],
        },
        confidence: {
          type: "number",
        },
        reply: {
          type: "string",
        },
      },
    },
  },
};

export const mealParserResponseFormat: CompletionCreateParams.ResponseFormatJsonSchema = {
  type: "json_schema",
  json_schema: {
    name: "parsed_meal",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["name", "items", "reply"],
      properties: {
        name: { type: "string" },
        items: nutritionItemsSchema,
        reply: { type: "string" },
      },
    },
  },
};
