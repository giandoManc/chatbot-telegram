import { session, Telegraf } from "telegraf";

import { registerMealHandler } from "./handlers/meal";
import { registerOnboardingHandler } from "./handlers/onboarding";
import { registerProfileHandlers } from "./handlers/profile";
import { registerStartHandler } from "./handlers/start";
import { registerUserMessageHandler } from "./handlers/userMessage";
import {
  checkUserProfile,
  loadUser,
  type BotContext,
} from "./middleware/loadUser";
import { createDefaultSession } from "./session/advice-session";

export const bot = new Telegraf<BotContext>(process.env.TELEGRAM_BOT_TOKEN!);

bot.use(session({ defaultSession: createDefaultSession }));
bot.use(loadUser);
bot.use(checkUserProfile);

registerStartHandler(bot);
registerProfileHandlers(bot);
registerOnboardingHandler(bot);
registerMealHandler(bot);
registerUserMessageHandler(bot);
