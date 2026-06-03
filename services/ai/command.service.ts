import { extractJson } from "./json";
import { groqChat } from "./groq.client";
import { userCommandPrompt } from "./prompts";
import { userCommandResponseFormat } from "./schemas";
import type { AiUserCommand, ChatMessage, NutritionItem } from "./types";

export async function parseUserCommand(message: string): Promise<AiUserCommand> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: userCommandPrompt,
    },
    {
      role: "user",
      content: message,
    },
  ];

  let response = await groqChat({
    messages,
    temperature: 0.1,
    responseFormat: userCommandResponseFormat,
  });

  if (!response) {
    response = await groqChat({
      messages,
      temperature: 0.1,
    });
  }

  if (!response) {
    return unknownCommand();
  }

  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return unknownCommand();
  }

  return normalizeUserCommand(extractJson(content));
}

function normalizeUserCommand(data: unknown): AiUserCommand {
  if (!data || typeof data !== "object") {
    return unknownCommand();
  }

  const value = data as Record<string, unknown>;
  const confidence =
    typeof value.confidence === "number" ? value.confidence : 0;
  const reply = typeof value.reply === "string" ? value.reply : "";

  if (value.action === "ADD_MEAL" && isMealCommandPayload(value.meal)) {
    return {
      action: "ADD_MEAL",
      confidence,
      reply: reply || "Ho registrato il pasto.",
      meal: value.meal,
    };
  }

  if (value.action === "ANALYZE_DAY") {
    return {
      action: "ANALYZE_DAY",
      confidence,
      reply: reply || "Analizzo la tua giornata.",
      meal: null,
    };
  }

  return {
    action: "UNKNOWN",
    confidence,
    reply:
      reply ||
      "Non ho capito se vuoi aggiungere un pasto o analizzare la giornata.",
    meal: null,
  };
}

function isMealCommandPayload(
  meal: unknown,
): meal is { name: string; items: NutritionItem[] } {
  if (!meal || typeof meal !== "object") {
    return false;
  }

  const value = meal as Record<string, unknown>;

  return (
    typeof value.name === "string" &&
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.every(isNutritionItem)
  );
}

function isNutritionItem(item: unknown): item is NutritionItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const value = item as Record<string, unknown>;

  return (
    typeof value.name === "string" &&
    typeof value.calories === "number" &&
    typeof value.protein_g === "number" &&
    typeof value.carbohydrates_total_g === "number" &&
    typeof value.fat_total_g === "number"
  );
}

function unknownCommand(): AiUserCommand {
  return {
    action: "UNKNOWN",
    confidence: 0,
    reply:
      'Non ho capito se vuoi aggiungere un pasto o analizzare la giornata. Puoi scrivermi, ad esempio: "ho mangiato pasta e pollo" oppure "analizza oggi".',
    meal: null,
  };
}
