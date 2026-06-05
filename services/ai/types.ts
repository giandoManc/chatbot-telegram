import type { CompletionCreateParams } from "groq-sdk/resources/chat";

export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export type NutritionItem = {
  name: string;
  calories: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
};

export type ParsedMeal = {
  name: string;
  items: NutritionItem[];
  reply: string;
};

type AiUserCommandBase = {
  confidence: number;
  reply: string;
  meal: null;
};

export type AiUserCommand =
  | {
      action: "ADD_MEAL";
      confidence: number;
      reply: string;
      meal: ParsedMeal;
    }
  | (AiUserCommandBase & { action: "ANALYZE_DAY" })
  | (AiUserCommandBase & { action: "UNKNOWN" })
  | (AiUserCommandBase & { action: "FOOD_ADVICE" })
  | (AiUserCommandBase & { action: "DELETE_LAST_MEAL" });

export type AiChatOptions = {
  messages: ChatMessage[];
  temperature: number;
  responseFormat?:
    | CompletionCreateParams.ResponseFormatText
    | CompletionCreateParams.ResponseFormatJsonSchema
    | CompletionCreateParams.ResponseFormatJsonObject;
  stream?: boolean;
};

export type AudioTranscriptionInput = {
  data: ArrayBuffer;
  fileName: string;
  mimeType: string;
  language?: string;
};
