import { extractJson } from "./json";
import { groqChat } from "./groq.client";
import { mealParserPrompt } from "./prompts";
import { mealParserResponseFormat } from "./schemas";
import type { ChatMessage, NutritionItem, ParsedMeal } from "./types";

export async function parseMeal(message: string): Promise<ParsedMeal | null> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: mealParserPrompt,
    },
    {
      role: "user",
      content: message,
    },
  ];

  let response = await groqChat({
    messages,
    temperature: 0.05,
    responseFormat: mealParserResponseFormat,
  });

  if (!response) {
    response = await groqChat({
      messages,
      temperature: 0.05,
    });
  }

  if (!response) {
    return null;
  }

  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return null;
  }

  return normalizeParsedMeal(extractJson(content));
}

function normalizeParsedMeal(data: unknown): ParsedMeal | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const value = data as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name : "";
  const reply = typeof value.reply === "string" ? value.reply : "";

  if (!Array.isArray(value.items) || !value.items.every(isNutritionItem)) {
    return null;
  }

  if (value.items.length === 0) {
    return null;
  }

  return {
    name: name || "Pasto",
    items: value.items,
    reply: reply || "Ho registrato il pasto con valori stimati.",
  };
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
