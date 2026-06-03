import type { Telegraf } from "telegraf";

import { replyWithTodayAnalysis } from "../utils/replyWithTodayAnalysis";

import type { BotContext } from "../middleware/loadUser";

export function registerDailyHandler(bot: Telegraf<BotContext>) {
  bot.command("oggi", async (ctx) => {
    const user = ctx.state.user;

    if (!user) {
      return ctx.reply("Completa prima il profilo con /start.");
    }

    return replyWithTodayAnalysis(ctx, user);
  });
}
