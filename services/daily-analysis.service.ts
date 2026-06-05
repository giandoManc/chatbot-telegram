import type { Meal, User } from "@prisma/client";

import { getStartOfToday } from "@/lib/date";
import { prisma } from "@/lib/prisma";

import { generateAiResponse, streamAiResponse } from "@/services/ai";
import {
  buildDailyPrompt,
  buildFoodAdvicePrompt,
} from "@/services/ai/prompts";

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
  return prisma.meal.findMany({
    where: {
      userId,
      createdAt: {
        gte: getStartOfToday(),
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

export async function analyzeFoodAdvice(user: User, message: string) {
  const meals = await getTodayMeals(user.id);
  const totals = getDailyTotals(meals);
  const prompt = buildFoodAdvicePrompt({ user, meals, totals, message });

  const aiComment = await generateAiResponse(prompt);

  return aiComment;
}
