import type { Telegraf } from "telegraf";

import { prisma } from "@/lib/prisma";
import { transcribeTelegramVoice } from "@/services/audio.service";
import { analyzeMeal } from "@/services/nutrition.service";
import type { BotContext } from "../middleware/loadUser";

export function registerMealsHandler(bot: Telegraf<BotContext>) {
  bot.on("text", async (ctx) => {
    if (!ctx.state.user) {
      return ctx.reply("Completa prima il profilo con /start.");
    }

    const result = await analyzeMeal(ctx.message.text);
    if (!result.length) {
      return ctx.reply(
        `Non ho trovato valori nutrizionali per: ${ctx.message.text}`,
      );
    }

    const totals = await saveMeal({
      userId: ctx.state.user.id,
      items: result,
    });

    return ctx.reply(formatMealReply(totals));
  });

  bot.on("voice", async (ctx) => {
    if (!ctx.state.user) {
      return ctx.reply("Completa prima il profilo con /start.");
    }

    await ctx.sendChatAction("typing");

    const fileUrl = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const transcription = await transcribeTelegramVoice(fileUrl);

    if (!transcription) {
      return ctx.reply(
        "Non sono riuscito a trascrivere il vocale. Prova a scrivere il pasto.",
      );
    }

    const result = await analyzeMeal(transcription);

    if (!result.length) {
      return ctx.reply(
        `Ho capito: "${transcription}", ma non ho trovato valori nutrizionali.`,
      );
    }

    const totals = await saveMeal({
      userId: ctx.state.user.id,
      items: result,
    });

    return ctx.reply(
      [`Ho capito: "${transcription}"`, "", formatMealReply(totals)].join("\n"),
    );
  });
}

type NutritionItem = {
  name: string;
  calories: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
};

type MealTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

async function saveMeal({
  userId,
  items,
}: {
  userId: number;
  items: NutritionItem[];
}) {
  const totals = getMealTotals(items);

  await prisma.meal.create({
    data: {
      userId,
      ...totals,
    },
  });

  return totals;
}

function getMealTotals(items: NutritionItem[]): MealTotals {
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

function formatMealReply(totals: MealTotals) {
  return [
    "Analisi pasto:",
    `Calorie: ${Math.round(totals.calories)} kcal`,
    `Proteine: ${totals.protein.toFixed(1)} g`,
    `Carboidrati: ${totals.carbs.toFixed(1)} g`,
    `Grassi: ${totals.fat.toFixed(1)} g`,
  ].join("\n");
}
