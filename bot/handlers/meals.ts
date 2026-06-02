import type { Telegraf } from "telegraf";

import type { BotContext } from "../middleware/loadUser";
import { analyzeMeal } from "@/services/nutrition.service";

export function registerMealsHandler(bot: Telegraf<BotContext>) {
  bot.on("text", async (ctx) => {
    const result = await analyzeMeal(ctx.message.text);

    return ctx.reply(result);
  });
}
