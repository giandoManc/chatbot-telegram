import type { Telegraf } from "telegraf";

import { deleteMeal, getLastMeal } from "@/services/meals";
import type { BotContext } from "../middleware/loadUser";

export function registerMealHandler(bot: Telegraf<BotContext>) {
  bot.command("delete_last", async (ctx) => {
    const user = ctx.state.user!;
    const lastMeal = await getLastMeal(user.id);

    if (!lastMeal) {
      return ctx.reply("Non ho trovato un pasto di oggi da cancellare.");
    }
    ctx.reply(`Sei sicuro di voler cancellare il pasto "${lastMeal.name}"?`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Conferma", callback_data: `delete_last:${lastMeal.id}` },
            { text: "Annulla", callback_data: "cancel_delete" },
          ],
        ],
      },
    });
  });

  bot.action(/delete_last:(\d+)/, async (ctx) => {
    const mealId = Number(ctx.match[1]);
    const user = ctx.state.user!;
    const deleted = await deleteMeal(user.id, mealId);

    if (!deleted) {
      return ctx.editMessageText("Non ho trovato quel pasto.");
    }

    return ctx.editMessageText("Ok, ho cancellato l'ultimo pasto.");
  });

  bot.action(/cancel_delete/, async (ctx) => {
    await ctx.deleteMessage();
  });
}
