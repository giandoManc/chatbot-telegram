import type { AudioTranscriptionInput } from "./types";
import { transcribeOpenRouterAudio } from "./openrouter.client";

export function transcribeAudio(input: AudioTranscriptionInput) {
  return transcribeOpenRouterAudio(input);
}
