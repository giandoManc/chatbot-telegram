import { generateMealJson } from "./ai.service";

type NutritionItem = {
  name: string;
  calories: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
};

export async function analyzeMeal(message: string) {
  const data = await generateMealJson([
    "Stima i valori nutrizionali di questo pasto.",
    "Dividi in item se ci sono più alimenti.",
    `Pasto: ${message}`,
  ].join("\n"));

  if (!isNutritionResponse(data)) {
    return [];
  }

  return data.items;
}

function isNutritionResponse(data: unknown): data is { items: NutritionItem[] } {
  if (!data || typeof data !== "object" || !("items" in data)) {
    return false;
  }

  const items = (data as { items: unknown }).items;

  if (!Array.isArray(items)) {
    return false;
  }

  return items.every((item) => {
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
  });
}
