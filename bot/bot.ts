import { Telegraf } from "telegraf";

import { registerOnboardingHandler } from "./handlers/onboarding";
import { registerProfileHandlers } from "./handlers/profile";
import { registerStartHandler } from "./handlers/start";
import { registerUserMessageHandler } from "./handlers/userMessage";
import {
  checkUserProfile,
  loadUser,
  type BotContext,
} from "./middleware/loadUser";

export const bot = new Telegraf<BotContext>(process.env.TELEGRAM_BOT_TOKEN!);

bot.use(loadUser);
bot.use(checkUserProfile);

registerStartHandler(bot);
registerProfileHandlers(bot);
registerOnboardingHandler(bot);
registerUserMessageHandler(bot);
