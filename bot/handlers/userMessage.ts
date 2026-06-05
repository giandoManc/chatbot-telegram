import type { Telegraf } from "telegraf";

import { parseUserCommand, type AiUserCommand } from "@/services/ai";
import { analyzeFoodAdvice } from "@/services/daily-analysis.service";
import { formatMealTotals, saveMealItems } from "@/services/meals";
import { replyWithDeleteLastMealConfirmation } from "./meal";
import type { BotContext } from "../middleware/loadUser";
import {
  addRecentAdviceMessage,
  getRecentAdviceMessages,
} from "../session/advice-session";
import { replyWithTodayAnalysis } from "../utils/replyWithTodayAnalysis";
import { transcribeTelegramVoice } from "../utils/transcribeTelegramVoice";

export function registerUserMessageHandler(bot: Telegraf<BotContext>) {
  bot.on("text", async (ctx) => {
    return handleUserMessage(ctx, ctx.message.text);
  });

  bot.on("voice", async (ctx) => {
    await ctx.sendChatAction("typing");

    const fileUrl = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const transcription = await transcribeTelegramVoice(fileUrl);
    await deleteTelegramMessage(ctx, ctx.message.message_id);

    if (!transcription) {
      return ctx.reply(
        "Non sono riuscito a trascrivere il vocale. Prova a scrivere.",
      );
    }

    return handleUserMessage(ctx, transcription, {
      transcription,
    });
  });
}

async function deleteTelegramMessage(ctx: BotContext, messageId: number) {
  if (!ctx.chat) {
    return;
  }

  try {
    await ctx.telegram.deleteMessage(ctx.chat.id, messageId);
  } catch {}
}

async function handleUserMessage(
  ctx: BotContext,
  message: string,
  options?: {
    transcription?: string;
  },
) {
  const user = ctx.state.user!;

  const command: AiUserCommand = await parseUserCommand(message);

  if (command.confidence < 0.45 || command.action === "UNKNOWN") {
    return ctx.reply(command.reply);
  }

  switch (command.action) {
    case "ANALYZE_DAY":
      return replyWithTodayAnalysis(ctx, user);

    case "FOOD_ADVICE":
      return replyWithFoodAdvice({ ctx, user, message });

    case "ADD_MEAL":
      return replyWithSavedMeal({
        ctx,
        command,
        transcription: options?.transcription,
        userId: user.id,
      });

    case "DELETE_LAST_MEAL":
      return replyWithDeleteLastMealConfirmation(ctx, user.id);
  }
}

async function replyWithFoodAdvice({
  ctx,
  user,
  message,
}: {
  ctx: BotContext;
  user: NonNullable<BotContext["state"]["user"]>;
  message: string;
}) {
  const aiMessage = await analyzeFoodAdvice(
    user,
    message,
    getRecentAdviceMessages(ctx),
  );

  addRecentAdviceMessage(ctx, {
    role: "user",
    content: message,
  });
  addRecentAdviceMessage(ctx, {
    role: "assistant",
    content: aiMessage,
  });

  return ctx.reply(aiMessage);
}

async function replyWithSavedMeal({
  ctx,
  command,
  transcription,
  userId,
}: {
  ctx: BotContext;
  command: Extract<AiUserCommand, { action: "ADD_MEAL" }>;
  transcription?: string;
  userId: number;
}) {
  const totals = await saveMealItems({
    userId,
    items: command.meal.items,
  });

  return ctx.reply(
    [
      transcription ? `Ho capito: "${transcription}"` : null,
      command.reply,
      "",
      formatMealTotals(totals),
    ]
      .filter(Boolean)
      .join("\n"),
  );
}
