import type { Telegraf } from "telegraf";

import { prisma } from "@/lib/prisma";
import { analyzeMeal } from "@/services/nutrition.service";
import type { BotContext } from "../middleware/loadUser";

interface MealAnalysis {
  name?: string | null;
  calories: GLfloat | null;
  protein: GLfloat | null;
  carbs: GLfloat | null;
  fat: GLfloat | null;
}

export function registerMealsHandler(bot: Telegraf<BotContext>) {
  bot.on("text", async (ctx) => {
    const result = await analyzeMeal(ctx.message.text);
    if (!result.length) {
      ctx.reply(`Non ho trovato valori nutrizionali per: ${ctx.message.text}`);
      return;
    }

    const totals = result.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein_g,
        carbs: acc.carbs + item.carbohydrates_total_g,
        fat: acc.fat + item.fat_total_g,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    await prisma.meal.create({
      data: {
        userId: ctx.state.user!.id,
        name: ctx.message.text,
        ...totals,
      },
    });

    ctx.reply(
      [
        "Analisi pasto:",
        `Calorie: ${Math.round(totals.calories)} kcal`,
        `Proteine: ${totals.protein.toFixed(1)} g`,
        `Carboidrati: ${totals.carbs.toFixed(1)} g`,
        `Grassi: ${totals.fat.toFixed(1)} g`,
      ].join("\n"),
    );

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const meals: MealAnalysis[] = await prisma.meal.findMany({
      where: {
        userId: ctx.state.user!.id,
        createdAt: {
          gte: startOfToday,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    let text = "";
    const totCount = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
    for (const meal of meals) {
      totCount.calories += meal.calories || 0;
      totCount.protein += meal.protein || 0;
      totCount.carbs += meal.carbs || 0;
      totCount.fat += meal.fat || 0;
    }

    text = `Totale oggi:\nCalorie: ${Math.round(totCount.calories)} kcal\n
    Proteine: ${totCount.protein.toFixed(1)} g\n
    Carboidrati: ${totCount.carbs.toFixed(1)} g\n
    Grassi: ${totCount.fat.toFixed(1)} g`;

    await ctx.reply(text);
  });
}
