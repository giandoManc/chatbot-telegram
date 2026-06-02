import { Telegraf } from "telegraf";

import { registerMealsHandler } from "./handlers/meals";
import { registerOnboardingHandler } from "./handlers/onboarding";
import { registerProfileHandlers } from "./handlers/profile";
import { registerStartHandler } from "./handlers/start";
import { loadUser, type BotContext } from "./middleware/loadUser";

export const bot = new Telegraf<BotContext>(process.env.TELEGRAM_BOT_TOKEN!);

bot.use(loadUser);

registerStartHandler(bot);
registerProfileHandlers(bot);
registerOnboardingHandler(bot);
registerMealsHandler(bot);
