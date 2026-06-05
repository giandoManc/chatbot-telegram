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

export type AiUserCommand =
  | {
      action: "ADD_MEAL";
      confidence: number;
      reply: string;
      meal: {
        name: string;
        items: NutritionItem[];
      };
    }
  | {
      action: "ANALYZE_DAY";
      confidence: number;
      reply: string;
      meal: null;
    }
  | {
      action: "UNKNOWN";
      confidence: number;
      reply: string;
      meal: null;
    }
  | {
      action: "FOOD_ADVICE";
      confidence: number;
      reply: string;
      meal: null;
    }
  | {
      action: "DELETE_LAST_MEAL";
      confidence: number;
      reply: string;
      meal: null;
    };

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
