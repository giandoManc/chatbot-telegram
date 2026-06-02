type NutritionItem = {
  name: string;
  calories: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
};

export async function analyzeMeal(message: string) {
  const response = await fetch(
    `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(message)}`,
    {
      headers: {
        "X-Api-Key": process.env.CALORIE_NINJAS_API_KEY!,
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const items = data.items as NutritionItem[];
  return items;
}
