import type { Telegraf } from "telegraf";

import { prisma } from "@/lib/prisma";
import { analyzeMeal } from "@/services/nutrition.service";
import type { BotContext } from "../middleware/loadUser";

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
  });
}
