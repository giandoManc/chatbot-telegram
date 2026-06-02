import { Telegraf } from "telegraf";
import { prisma } from "@/app/lib/prisma";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start(async (ctx) => {
  const telegramId = String(ctx.from.id);

  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    await prisma.user.create({
      data: {
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        step: "ask_age",
        onboardingCompleted: false,
      },
    });

    return ctx.reply("Ciao 👋 Prima di iniziare, quanti anni hai?");
  }

  if (!user.onboardingCompleted) {
    return ctx.reply("Completiamo prima il profilo. Rispondi alla domanda precedente.");
  }

  return ctx.reply("Bentornato 💪 Scrivimi cosa hai mangiato oggi.");
});

bot.command("reset", async (ctx) => {
  const telegramId = String(ctx.from.id);

  await prisma.user.upsert({
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
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      step: "ask_age",
      onboardingCompleted: false,
    },
  });

  return ctx.reply("Profilo resettato. Quanti anni hai?");
});

bot.on("text", async (ctx) => {
  const telegramId = String(ctx.from.id);
  const message = ctx.message.text;

  let user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        step: "ask_age",
        onboardingCompleted: false,
      },
    });

    return ctx.reply("Ciao 👋 Prima di iniziare, quanti anni hai?");
  }

  if (!user.onboardingCompleted) {
    if (user.step === "ask_age") {
      const age = Number(message);

      if (isNaN(age)) {
        return ctx.reply("Inserisci un numero valido. Esempio: 29");
      }

      await prisma.user.update({
        where: { telegramId },
        data: {
          age,
          step: "ask_height",
        },
      });

      return ctx.reply("Perfetto. Quanto sei alto in cm?");
    }

    if (user.step === "ask_height") {
      const height = Number(message);

      if (isNaN(height)) {
        return ctx.reply("Inserisci l’altezza in cm. Esempio: 175");
      }

      await prisma.user.update({
        where: { telegramId },
        data: {
          height,
          step: "ask_weight",
        },
      });

      return ctx.reply("Quanto pesi attualmente in kg?");
    }

    if (user.step === "ask_weight") {
      const weight = Number(message.replace(",", "."));

      if (isNaN(weight)) {
        return ctx.reply("Inserisci il peso in kg. Esempio: 78");
      }

      await prisma.user.update({
        where: { telegramId },
        data: {
          weight,
          step: "ask_goal",
        },
      });

      return ctx.reply("Qual è il tuo obiettivo? Dimagrire, massa o mantenimento?");
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

      return ctx.reply("Perfetto ✅ Profilo creato. Ora scrivimi cosa hai mangiato oggi.");
    }
  }

  return ctx.reply(`Ok, ora posso analizzare il tuo pasto: ${message}`);
});

export default bot;
