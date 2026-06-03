import { transcribeAudio } from "@/services/ai";

export async function transcribeTelegramVoice(fileUrl: URL) {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    return null;
  }

  const audioBuffer = await response.arrayBuffer();

  return transcribeAudio({
    data: audioBuffer,
    fileName: "telegram-voice.ogg",
    mimeType: "audio/ogg",
    language: "it",
  });
}
