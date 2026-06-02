import type { Telegraf } from "telegraf";

import type { BotContext } from "../middleware/loadUser";
import { resetOnboardingUser } from "./onboarding";

export function registerProfileHandlers(bot: Telegraf<BotContext>) {
  bot.command("reset", async (ctx) => {
    const telegramId = ctx.state.telegramId;

    if (!telegramId) {
      return ctx.reply("Non riesco a leggere il tuo profilo Telegram. Riprova.");
    }

    if (!ctx.from) {
      return ctx.reply("Non riesco a leggere il tuo profilo Telegram. Riprova.");
    }

    await resetOnboardingUser({
      telegramId,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
    });

    return ctx.reply("Profilo resettato. Quanti anni hai?");
  });
}
