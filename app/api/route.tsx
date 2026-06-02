import { NextRequest, NextResponse } from "next/server";
import bot from "./botTelegram";

export async function POST(req: NextRequest) {
  const body = await req.json();

  await bot.handleUpdate(body);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    status: "Telegram API online",
  });
}
