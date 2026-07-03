import type { Telegraf } from "telegraf";

import {
  deleteMeal,
  formatMealTotals,
  getLastMeal,
  saveMealItems,
} from "@/services/meals";
import type { BotContext } from "../middleware/loadUser";
import {
  clearPendingMealConfirmation,
  getPendingMealConfirmation,
} from "../session/advice-session";

export function registerMealHandler(bot: Telegraf<BotContext>) {
  bot.command("delete_last", async (ctx) => {
    return replyWithDeleteLastMealConfirmation(ctx, ctx.state.user!.id);
  });

  bot.action(/delete_last:(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();

    const mealId = Number(ctx.match[1]);
    const user = ctx.state.user!;
    const deleted = await deleteMeal(user.id, mealId);

    if (!deleted) {
      return ctx.editMessageText("Non ho trovato quel pasto.");
    }

    return ctx.editMessageText("Ok, ho cancellato l'ultimo pasto.");
  });

  bot.action(/cancel_delete/, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
  });

  bot.action("confirm_meal:yes", async (ctx) => {
    await ctx.answerCbQuery();

    const pendingMeal = getPendingMealConfirmation(ctx);

    if (!pendingMeal) {
      return ctx.editMessageText("Non ho trovato un pasto da confermare.");
    }

    const totals = await saveMealItems({
      userId: ctx.state.user!.id,
      items: pendingMeal.items,
    });

    clearPendingMealConfirmation(ctx);

    return ctx.editMessageText(
      [pendingMeal.reply, "", formatMealTotals(totals)].join("\n"),
    );
  });

  bot.action("confirm_meal:no", async (ctx) => {
    await ctx.answerCbQuery();
    clearPendingMealConfirmation(ctx);

    return ctx.editMessageText("Ok, non salvo questo pasto.");
  });
}

export async function replyWithDeleteLastMealConfirmation(
  ctx: BotContext,
  userId: number,
) {
  const lastMeal = await getLastMeal(userId);

  if (!lastMeal) {
    return ctx.reply("Non ho trovato un pasto di oggi da cancellare.");
  }

  return ctx.reply(
    `Sei sicuro di voler cancellare il pasto "${lastMeal.name}"?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Conferma", callback_data: `delete_last:${lastMeal.id}` },
            { text: "Annulla", callback_data: "cancel_delete" },
          ],
        ],
      },
    },
  );
}
