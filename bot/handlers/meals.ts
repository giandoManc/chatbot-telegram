import type { Telegraf } from "telegraf";

import { prisma } from "@/lib/prisma";
import { parseUserCommand, type NutritionItem } from "@/services/ai.service";
import { transcribeTelegramVoice } from "@/services/audio.service";
import type { BotContext } from "../middleware/loadUser";
import { replyWithTodayAnalysis } from "../utils/replyWithTodayAnalysis";

export function registerMealsHandler(bot: Telegraf<BotContext>) {
  bot.on("text", async (ctx) => {
    if (!ctx.state.user) {
      return ctx.reply("Completa prima il profilo con /start.");
    }

    return handleUserMessage(ctx, ctx.message.text);
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

    return handleUserMessage(ctx, transcription, {
      transcription,
    });
  });
}

type MealTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

async function handleUserMessage(
  ctx: BotContext,
  message: string,
  options?: {
    transcription?: string;
  },
) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.reply("Completa prima il profilo con /start.");
  }

  const command = await parseUserCommand(message);

  if (command.confidence < 0.45 || command.action === "UNKNOWN") {
    return ctx.reply(command.reply);
  }

  if (command.action === "ANALYZE_DAY") {
    return replyWithTodayAnalysis(ctx, user);
  }

  const totals = await saveMeal({
    userId: user.id,
    items: command.meal.items,
  });

  return ctx.reply(
    [
      options?.transcription ? `Ho capito: "${options.transcription}"` : null,
      command.reply,
      "",
      formatMealReply(totals),
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

async function saveMeal({
  userId,
  items,
}: {
  userId: number;
  items: NutritionItem[];
}) {
  // todo: non restituisce il name
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
