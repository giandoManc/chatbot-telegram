import type { User } from "@prisma/client";
import type { MiddlewareFn, Telegraf } from "telegraf";

import { prisma } from "@/lib/prisma";

import type { BotContext } from "../middleware/loadUser";

type TelegramProfile = {
  telegramId: string;
  username?: string;
  firstName?: string;
};

export function createOnboardingUser({
  telegramId,
  username,
  firstName,
}: TelegramProfile) {
  return prisma.user.create({
    data: {
      telegramId,
      username,
      firstName,
      step: "ask_age",
      onboardingCompleted: false,
    },
  });
}

export function resetOnboardingUser({
  telegramId,
  username,
  firstName,
}: TelegramProfile) {
  return prisma.user.upsert({
    where: { telegramId },
    update: {
      age: null,
      height: null,
      weight: null,
      goal: null,
      step: "ask_age",
      onboardingCompleted: false,
    },
    create: {
      telegramId,
      username,
      firstName,
      step: "ask_age",
      onboardingCompleted: false,
    },
  });
}

export function registerOnboardingHandler(bot: Telegraf<BotContext>) {
  const handleText: MiddlewareFn<BotContext> = async (ctx, next) => {
    if (!ctx.message || !("text" in ctx.message)) {
      return next();
    }

    const telegramId = ctx.state.telegramId;
    const message = ctx.message.text;

    if (!telegramId) {
      return ctx.reply(
        "Non riesco a leggere il tuo profilo Telegram. Riprova.",
      );
    }

    if (!ctx.from) {
      return ctx.reply(
        "Non riesco a leggere il tuo profilo Telegram. Riprova.",
      );
    }

    let user = ctx.state.user;

    if (!user) {
      user = await createOnboardingUser({
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      return ctx.reply("Ciao 👋 Prima di iniziare, quanti anni hai?");
    }

    if (user.onboardingCompleted) {
      return next();
    }

    return ctx.reply(await getOnboardingReply({ telegramId, message, user }));
  };

  bot.on("text", handleText);
}

async function getOnboardingReply({
  telegramId,
  message,
  user,
}: {
  telegramId: string;
  message: string;
  user: User;
}) {
  if (user.step === "ask_age") {
    const age = Number(message);

    if (isNaN(age)) {
      return "Inserisci un numero valido. Esempio: 29";
    }

    await prisma.user.update({
      where: { telegramId },
      data: {
        age,
        step: "ask_height",
      },
    });

    return "Perfetto. Quanto sei alto in cm?";
  }

  if (user.step === "ask_height") {
    const height = Number(message);

    if (isNaN(height)) {
      return "Inserisci l’altezza in cm. Esempio: 175";
    }

    await prisma.user.update({
      where: { telegramId },
      data: {
        height,
        step: "ask_weight",
      },
    });

    return "Quanto pesi attualmente in kg?";
  }

  if (user.step === "ask_weight") {
    const weight = Number(message.replace(",", "."));

    if (isNaN(weight)) {
      return "Inserisci il peso in kg. Esempio: 78";
    }

    await prisma.user.update({
      where: { telegramId },
      data: {
        weight,
        step: "ask_goal",
      },
    });

    return "Qual è il tuo obiettivo? Dimagrire, massa o mantenimento?";
  }

  if (user.step === "ask_goal") {
    await prisma.user.update({
      where: { telegramId },
      data: {
        goal: message,
        step: "completed",
        onboardingCompleted: true,
      },
    });

    return "Perfetto ✅ Profilo creato.";
  }

  await resetOnboardingUser({ telegramId });

  return "Ripartiamo dal profilo. Quanti anni hai?";
}
