import type { ConversationMessage } from "@/services/ai";
import type { BotContext } from "../middleware/loadUser";

const MAX_RECENT_ADVICE_MESSAGES = 5;
const MAX_MESSAGE_LENGTH = 500;

export type BotSession = {
  recentAdviceMessages: ConversationMessage[];
};

export function createDefaultSession(): BotSession {
  return {
    recentAdviceMessages: [],
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
