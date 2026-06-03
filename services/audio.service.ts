import { transcribeAudio } from "./ai.service";

export async function transcribeTelegramVoice(fileUrl: URL) {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    return null;
  }

  const audioBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString("base64");

  return transcribeAudio({
    data: audioBase64,
    format: "ogg",
    language: "it",
  });
}
