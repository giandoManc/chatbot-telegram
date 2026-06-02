import { Telegraf } from "telegraf";
import { NextRequest, NextResponse } from "next/server";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start((ctx) => {
  ctx.reply("Ciao! Sono il tuo coach dieta AI 🍽️\nPrima di iniziare, quanti anni hai?");
});

bot.on("text", (ctx) => {
  const message = ctx.message.text;

  ctx.reply(`Hai scritto: ${message}`);
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("Received update:", body);
  await bot.handleUpdate(body);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    status: "Bot API online",
  });
}