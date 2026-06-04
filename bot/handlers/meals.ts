import type { Telegraf } from "telegraf";

import { parseUserCommand } from "@/services/ai";
import { formatMealTotals, saveMealItems } from "@/services/meals";
import type { BotContext } from "../middleware/loadUser";
import { replyWithTodayAnalysis } from "../utils/replyWithTodayAnalysis";
import { transcribeTelegramVoice } from "../utils/transcribeTelegramVoice";

export function registerMealsHandler(bot: Telegraf<BotContext>) {
  bot.on("text", async (ctx) => {
    return handleUserMessage(ctx, ctx.message.text);
  });

  bot.on("voice", async (ctx) => {
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

async function handleUserMessage(
  ctx: BotContext,
  message: string,
  options?: {
    transcription?: string;
  },
) {
  const user = ctx.state.user!;

  const command = await parseUserCommand(message);

  if (command.confidence < 0.45 || command.action === "UNKNOWN") {
    return ctx.reply(command.reply);
  }

  if (command.action === "ANALYZE_DAY") {
    return replyWithTodayAnalysis(ctx, user);
  }

  const totals = await saveMealItems({
    userId: user.id,
    items: command.meal.items,
  });

  return ctx.reply(
    [
      options?.transcription ? `Ho capito: "${options.transcription}"` : null,
      command.reply,
      "",
      formatMealTotals(totals),
    ]
      .filter(Boolean)
      .join("\n"),
  );
}
