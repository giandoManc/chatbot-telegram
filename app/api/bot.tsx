import { prisma } from "@/app/lib/prisma";
import { Telegraf } from "telegraf";

class Bot {
  bot: Telegraf = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  static start = async (ctx: any) => {
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
      return ctx.reply(
        "Completiamo prima il profilo. Rispondi alla domanda precedente.",
      );
    }

    return ctx.reply("Bentornato 💪 Scrivimi cosa hai mangiato oggi.");
  };
}

export default Bot;
