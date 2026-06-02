import type { Telegraf } from "telegraf";

import { streamTodayAnalysis } from "@/services/daily-analysis.service";

import type { BotContext } from "../middleware/loadUser";

export function registerDailyHandler(bot: Telegraf<BotContext>) {
  bot.command("oggi", async (ctx) => {
    const user = ctx.state.user;

    if (!user) {
      return ctx.reply("Completa prima il profilo con /start.");
    }

    if (!user.onboardingCompleted) {
      return ctx.reply("Completiamo prima il profilo. Rispondi alla domanda precedente.");
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
        ctx.chat.id,
        loadingMessage.message_id,
        undefined,
        ["Riepilogo di oggi:", "Analisi in corso...", "", fullText].join("\n"),
      );
    });

    return ctx.telegram.editMessageText(
      ctx.chat.id,
      loadingMessage.message_id,
      undefined,
      ["Riepilogo di oggi:", result.summary, "", result.aiComment].join("\n"),
    );
  });
}
