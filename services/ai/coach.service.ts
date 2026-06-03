import { nutritionCoachPrompt } from "./prompts";
import { hasOpenRouterApiKey, openRouterChat, streamOpenRouterChat } from "./openrouter.client";

export async function generateAiResponse(prompt: string) {
  if (!hasOpenRouterApiKey()) {
    return "Analisi AI non disponibile: manca OPENROUTER_API_KEY.";
  }

  const response = await openRouterChat({
    messages: [
      {
        role: "system",
        content: nutritionCoachPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
  });

  if (!response.ok) {
    return "Non riesco a generare l'analisi AI al momento. Riprova più tardi.";
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    return "Non ho ricevuto un'analisi valida dal modello.";
  }

  return content.trim();
}

export async function streamAiResponse(
  prompt: string,
  onToken: (token: string, fullText: string) => Promise<void>,
) {
  if (!hasOpenRouterApiKey()) {
    return "Analisi AI non disponibile: manca OPENROUTER_API_KEY.";
  }

  const result = await streamOpenRouterChat({
    messages: [
      {
        role: "system",
        content: nutritionCoachPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
    onToken,
  });

  return result || "Non ho ricevuto un'analisi valida dal modello.";
}
