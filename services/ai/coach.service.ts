import { nutritionCoachPrompt } from "./prompts";
import { groqChat, hasGroqApiKey, streamGroqChat } from "./groq.client";

export async function generateAiResponse(prompt: string) {
  if (!hasGroqApiKey()) {
    return "Analisi AI non disponibile: manca GROQ_API_KEY.";
  }

  const response = await groqChat({
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

  if (!response) {
    return "Non riesco a generare l'analisi AI al momento. Riprova più tardi.";
  }

  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    return "Non ho ricevuto un'analisi valida dal modello.";
  }

  return content.trim();
}

export async function streamAiResponse(
  prompt: string,
  onToken: (token: string, fullText: string) => Promise<void>,
) {
  if (!hasGroqApiKey()) {
    return "Analisi AI non disponibile: manca GROQ_API_KEY.";
  }

  const result = await streamGroqChat({
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
