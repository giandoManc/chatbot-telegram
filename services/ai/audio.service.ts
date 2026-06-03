import type { AudioTranscriptionInput } from "./types";
import { transcribeGroqAudio } from "./groq.client";

export function transcribeAudio(input: AudioTranscriptionInput) {
  return transcribeGroqAudio(input);
}
