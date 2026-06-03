import Groq, { toFile } from "groq-sdk";

import type { AudioTranscriptionInput } from "./types";

export async function transcribeGroqAudio(input: AudioTranscriptionInput) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return null;
  }

  const client = new Groq({
    apiKey,
  });

  try {
    const transcription = await client.audio.transcriptions.create({
      file: await toFile(Buffer.from(input.data), input.fileName, {
        type: input.mimeType,
      }),
      model: process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo",
      language: input.language || "it",
      response_format: "json",
      temperature: 0,
    });

    return typeof transcription.text === "string"
      ? transcription.text.trim()
      : null;
  } catch {
    return null;
  }
}
