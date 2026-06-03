import { prisma } from "@/lib/prisma";
import type { NutritionItem } from "@/services/ai";

export type MealTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export async function saveMealItems({
  userId,
  items,
}: {
  userId: number;
  items: NutritionItem[];
}) {
  const totals = getMealTotals(items);

  for (const item of items) {
    await prisma.meal.create({
      data: {
        userId,
        name: item.name,
        calories: item.calories,
        protein: item.protein_g,
        carbs: item.carbohydrates_total_g,
        fat: item.fat_total_g,
      },
    });
  }

  return totals;
}

export function getMealTotals(items: NutritionItem[]): MealTotals {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein_g,
      carbs: acc.carbs + item.carbohydrates_total_g,
      fat: acc.fat + item.fat_total_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function formatMealTotals(totals: MealTotals) {
  return [
    "Analisi pasto:",
    `Calorie: ${Math.round(totals.calories)} kcal`,
    `Proteine: ${totals.protein.toFixed(1)} g`,
    `Carboidrati: ${totals.carbs.toFixed(1)} g`,
    `Grassi: ${totals.fat.toFixed(1)} g`,
  ].join("\n");
}
