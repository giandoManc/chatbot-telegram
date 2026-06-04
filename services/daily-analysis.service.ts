import type { Meal, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { generateAiResponse, streamAiResponse } from "@/services/ai";

type DailyTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export async function analyzeToday(user: User) {
  const context = await getTodayAnalysisContext(user);

  if (!context) {
    return "Non hai ancora registrato pasti oggi. Scrivimi cosa hai mangiato e poi riprova.";
  }

  const aiComment = await generateAiResponse(context.prompt);

  return ["Riepilogo di oggi:", context.summary, "", aiComment].join("\n");
}

export async function streamTodayAnalysis(
  user: User,
  onToken: (token: string, fullText: string) => Promise<void>,
) {
  const context = await getTodayAnalysisContext(user);

  if (!context) {
    return {
      summary: "",
      aiComment:
        "Non hai ancora registrato pasti oggi. Scrivimi cosa hai mangiato e poi riprova con /oggi.",
    };
  }

  const aiComment = await streamAiResponse(context.prompt, onToken);

  return {
    summary: context.summary,
    aiComment,
  };
}

async function getTodayAnalysisContext(user: User) {
  const meals = await getTodayMeals(user.id);

  if (meals.length === 0) {
    return null;
  }

  const totals = getDailyTotals(meals);
  const prompt = buildDailyPrompt({ user, meals, totals });
  const summary = [
    `Calorie: ${Math.round(totals.calories)} kcal`,
    `Proteine: ${totals.protein.toFixed(1)} g`,
    `Carboidrati: ${totals.carbs.toFixed(1)} g`,
    `Grassi: ${totals.fat.toFixed(1)} g`,
  ].join("\n");

  return {
    meals,
    totals,
    prompt,
    summary,
  };
}

async function getTodayMeals(userId: number) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return prisma.meal.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfToday,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

function getDailyTotals(meals: Meal[]): DailyTotals {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function buildDailyPrompt({
  user,
  meals,
  totals,
}: {
  user: User;
  meals: Meal[];
  totals: DailyTotals;
}) {
  const mealLines = meals
    .map((meal) => {
      return [
        `- ${meal.name || "Pasto senza nome"}`,
        `${Math.round(meal.calories || 0)} kcal`,
        `${(meal.protein || 0).toFixed(1)}g proteine`,
        `${(meal.carbs || 0).toFixed(1)}g carboidrati`,
        `${(meal.fat || 0).toFixed(1)}g grassi`,
      ].join(", ");
    })
    .join("\n");

  return [
    "Analizza questa giornata alimentare.",
    "",
    "Profilo utente:",
    `Età: ${user.age ?? "non indicata"}`,
    `Altezza: ${user.height ?? "non indicata"} cm`,
    `Peso: ${user.weight ?? "non indicato"} kg`,
    `Obiettivo: ${user.goal ?? "non indicato"}`,
    "",
    "Pasti registrati oggi:",
    mealLines,
    "",
    "Totali:",
    `${Math.round(totals.calories)} kcal`,
    `${totals.protein.toFixed(1)}g proteine`,
    `${totals.carbs.toFixed(1)}g carboidrati`,
    `${totals.fat.toFixed(1)}g grassi`,
    "",
    "Massimo 8 righe.",
  ].join("\n");
}

export async function analyzeFoodAdvice(user: User, message: string) {
  const meals = await getTodayMeals(user.id);
  const totals = getDailyTotals(meals);
  const prompt = buildFoodAdvicePrompt({ user, meals, totals, message });

  const aiComment = await generateAiResponse(prompt);

  return aiComment;
}

function buildFoodAdvicePrompt({
  user,
  meals,
  totals,
  message,
}: {
  user: User;
  meals: Meal[];
  totals: DailyTotals;
  message: string;
}) {
  const mealLines =
    meals.length > 0
      ? meals
          .map((meal) => {
            return [
              `- ${meal.name || "Pasto senza nome"}`,
              `${Math.round(meal.calories || 0)} kcal`,
              `${(meal.protein || 0).toFixed(1)}g proteine`,
              `${(meal.carbs || 0).toFixed(1)}g carboidrati`,
              `${(meal.fat || 0).toFixed(1)}g grassi`,
            ].join(", ");
          })
          .join("\n")
      : "Nessun pasto registrato oggi.";

  return [
    "Rispondi come coach nutrizionale italiano a una richiesta di consiglio alimentare.",
    "La risposta deve essere breve, carina e pratica, adatta a Telegram.",
    "Non fare diagnosi mediche e non dare prescrizioni cliniche.",
    "",
    "Regole di stile:",
    "- massimo 5 righe totali",
    "- usa 2 o 3 emoji pertinenti",
    "- niente introduzioni lunghe",
    "- proponi 2 o 3 idee concrete di piatti o alimenti",
    "- se utile, indica una nota breve su proteine/carboidrati/grassi",
    "",
    "Profilo utente:",
    `Età: ${user.age ?? "non indicata"}`,
    `Altezza: ${user.height ?? "non indicata"} cm`,
    `Peso: ${user.weight ?? "non indicato"} kg`,
    `Obiettivo: ${user.goal ?? "non indicato"}`,
    "",
    "Pasti registrati oggi:",
    mealLines,
    "",
    "Totali di oggi:",
    `${Math.round(totals.calories)} kcal`,
    `${totals.protein.toFixed(1)}g proteine`,
    `${totals.carbs.toFixed(1)}g carboidrati`,
    `${totals.fat.toFixed(1)}g grassi`,
    "",
    "Domanda utente:",
    message,
  ].join("\n");
}
