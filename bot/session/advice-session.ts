import type { ConversationMessage, NutritionItem } from "@/services/ai";
import type { BotContext } from "../middleware/loadUser";

const MAX_RECENT_ADVICE_MESSAGES = 5;
const MAX_MESSAGE_LENGTH = 500;

export type PendingMealConfirmation = {
  items: NutritionItem[];
  reply: string;
  transcription?: string;
  createdAt: number;
};

export type BotSession = {
  recentAdviceMessages: ConversationMessage[];
  pendingMealConfirmation: PendingMealConfirmation | null;
};

export function createDefaultSession(): BotSession {
  return {
    recentAdviceMessages: [],
    pendingMealConfirmation: null,
  };
}

export function getRecentAdviceMessages(ctx: BotContext) {
  return ctx.session?.recentAdviceMessages || [];
}

export function addRecentAdviceMessage(
  ctx: BotContext,
  message: ConversationMessage,
) {
  if (!ctx.session) {
    return;
  }

  ctx.session.recentAdviceMessages = [
    ...ctx.session.recentAdviceMessages,
    {
      role: message.role,
      content: message.content.slice(0, MAX_MESSAGE_LENGTH),
    },
  ].slice(-MAX_RECENT_ADVICE_MESSAGES);
}

export function setPendingMealConfirmation(
  ctx: BotContext,
  pendingMeal: PendingMealConfirmation,
) {
  if (!ctx.session) {
    return;
  }

  ctx.session.pendingMealConfirmation = pendingMeal;
}

export function getPendingMealConfirmation(ctx: BotContext) {
  return ctx.session?.pendingMealConfirmation || null;
}

export function clearPendingMealConfirmation(ctx: BotContext) {
  if (!ctx.session) {
    return;
  }

  ctx.session.pendingMealConfirmation = null;
}
