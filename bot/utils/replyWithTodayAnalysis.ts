import type { User } from "@prisma/client";
import type { Context } from "telegraf";

import { streamTodayAnalysis } from "@/services/daily-analysis.service";

export async function replyWithTodayAnalysis(ctx: Context, user: User) {
  if (!ctx.chat) {
    return;
  }

  const chatId = ctx.chat.id;

  if (!user.onboardingCompleted) {
    return ctx.reply(
      "Completiamo prima il profilo. Rispondi alla domanda precedente.",
    );
  }

  const loadingMessage = await ctx.reply("Analizzo la tua giornata... ⏳");
  let lastEditAt = 0;

  const result = await streamTodayAnalysis(user, async (_token, fullText) => {
    const now = Date.now();

    if (now - lastEditAt < 1200) {
      return;
    }

    lastEditAt = now;

    await ctx.telegram.editMessageText(
      chatId,
      loadingMessage.message_id,
      undefined,
      ["Riepilogo di oggi:", "Analisi in corso...", "", fullText].join("\n"),
    );
  });

  return ctx.telegram.editMessageText(
    chatId,
    loadingMessage.message_id,
    undefined,
    ["Riepilogo di oggi:", result.summary, "", result.aiComment].join("\n"),
  );
}
