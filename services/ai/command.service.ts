import { extractJson } from "./json";
import { groqChat } from "./groq.client";
import { userCommandPrompt } from "./prompts";
import { userIntentResponseFormat } from "./schemas";
import { parseMeal } from "./meal-parser.service";
import type { AiUserCommand, ChatMessage } from "./types";

export async function parseUserCommand(message: string): Promise<AiUserCommand> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: userCommandPrompt,
    },
    {
      role: "user",
      content: message,
    },
  ];

  let response = await groqChat({
    messages,
    temperature: 0.1,
    responseFormat: userIntentResponseFormat,
  });

  if (!response) {
    response = await groqChat({
      messages,
      temperature: 0.1,
    });
  }

  if (!response) {
    return unknownCommand();
  }

  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return unknownCommand();
  }

  return normalizeUserCommand(extractJson(content), message);
}

async function normalizeUserCommand(
  data: unknown,
  message: string,
): Promise<AiUserCommand> {
  if (!data || typeof data !== "object") {
    return unknownCommand();
  }

  const value = data as Record<string, unknown>;
  const confidence =
    typeof value.confidence === "number" ? value.confidence : 0;
  const reply = typeof value.reply === "string" ? value.reply : "";

  if (value.action === "ADD_MEAL") {
    const meal = await parseMeal(message);

    if (!meal) {
      return {
        action: "UNKNOWN",
        confidence: 0.35,
        reply:
          "Non sono riuscito a stimare bene il pasto. Puoi indicarmi alimenti e quantità?",
        meal: null,
      };
    }

    return {
      action: "ADD_MEAL",
      confidence,
      reply: meal.reply || reply || "Ho registrato il pasto.",
      meal,
    };
  }

  if (value.action === "ANALYZE_DAY") {
    return {
      action: "ANALYZE_DAY",
      confidence,
      reply: reply || "Analizzo la tua giornata.",
      meal: null,
    };
  }

  if (value.action === "FOOD_ADVICE") {
    return {
      action: "FOOD_ADVICE",
      confidence,
      reply:
        reply ||
        "Posso aiutarti con qualche idea pratica. Dimmi obiettivo, fame e cosa hai in casa.",
      meal: null,
    };
  }

  if (value.action === "DELETE_LAST_MEAL") {
    return {
      action: "DELETE_LAST_MEAL",
      confidence,
      reply: reply || "Ti chiedo conferma prima di cancellare.",
      meal: null,
    };
  }

  return {
    action: "UNKNOWN",
    confidence,
    reply:
      reply ||
      "Non ho capito se vuoi aggiungere un pasto o analizzare la giornata.",
    meal: null,
  };
}

function unknownCommand(): AiUserCommand {
  return {
    action: "UNKNOWN",
    confidence: 0,
    reply:
      'Non ho capito se vuoi aggiungere un pasto o analizzare la giornata. Puoi scrivermi, ad esempio: "ho mangiato pasta e pollo" oppure "analizza oggi".',
    meal: null,
  };
}
