import type { Telegraf } from "telegraf";

import type { BotContext } from "../middleware/loadUser";
import { createOnboardingUser } from "./onboarding";

export function registerStartHandler(bot: Telegraf<BotContext>) {
  bot.start(async (ctx) => {
    const telegramId = ctx.state.telegramId;

    if (!telegramId) {
      return ctx.reply("Non riesco a leggere il tuo profilo Telegram. Riprova.");
    }

    if (!ctx.from) {
      return ctx.reply("Non riesco a leggere il tuo profilo Telegram. Riprova.");
    }

    const user = ctx.state.user;

    if (!user) {
      await createOnboardingUser({
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      return ctx.reply("Ciao 👋 Prima di iniziare, quanti anni hai?");
    }

    if (!user.onboardingCompleted) {
      return ctx.reply("Completiamo prima il profilo. Rispondi alla domanda precedente.");
    }

    return ctx.reply("Bentornato 💪 Scrivimi cosa hai mangiato oggi.");
  });
}
