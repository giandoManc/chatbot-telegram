import type { User } from "@prisma/client";
import type { Context, MiddlewareFn } from "telegraf";

import { prisma } from "@/lib/prisma";

export type BotContext = Context & {
  state: {
    telegramId?: string;
    user?: User | null;
  };
};

export const loadUser: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.from) {
    return next();
  }

  const telegramId = String(ctx.from.id);

  ctx.state.telegramId = telegramId;
  ctx.state.user = await prisma.user.findUnique({
    where: { telegramId },
  });

  return next();
};

export const checkUserProfile = (
  ctx: BotContext,
  next: () => Promise<void>,
) => {
  if (!ctx.state.user) {
    return ctx.reply("Completa prima il profilo con /start.");
  }
  return next();
};
