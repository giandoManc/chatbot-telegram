import { generateAiResponse } from "./ai.service";

export async function analyzeMeal(message: string) {
  await generateAiResponse(message);

  return `Ok, ora posso analizzare il tuo pasto: ${message}`;
}
