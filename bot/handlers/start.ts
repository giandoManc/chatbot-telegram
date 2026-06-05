import type { Telegraf } from "telegraf";

import type { BotContext } from "../middleware/loadUser";
import { createOnboardingUser } from "./onboarding";

const introMessage = [
  "Ciao 👋 Sono il tuo assistente nutrizionale.",
  "",
  "Scrivimi o mandami un vocale con cosa mangi: registro il pasto e stimo calorie e macro.",
  "",
  'Puoi anche scrivere "analizza la giornata" o chiedermi consigli.',
  "",
  "Prima creo il profilo. Quanti anni hai?",
].join("\n");

const welcomeBackMessage = [
  "Bentornato 💪",
  "",
  "Mandami un pasto scritto o vocale, oppure chiedimi un consiglio.",
].join("\n");

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

      return ctx.reply(introMessage);
    }

    if (!user.onboardingCompleted) {
      return ctx.reply("Completiamo prima il profilo. Rispondi alla domanda precedente.");
    }

    return ctx.reply(welcomeBackMessage);
  });
}
