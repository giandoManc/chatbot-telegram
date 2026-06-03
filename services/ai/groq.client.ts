import Groq, { toFile } from "groq-sdk";

import type { AiChatOptions, AudioTranscriptionInput } from "./types";

export function hasGroqApiKey() {
  return Boolean(process.env.GROQ_API_KEY);
}

function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Groq({
    apiKey,
  });
}

export async function groqChat({
  messages,
  temperature,
  responseFormat,
}: AiChatOptions) {
  const client = createGroqClient();

  if (!client) {
    return null;
  }

  try {
    return await client.chat.completions.create({
      model: process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant",
      messages,
      temperature,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    });
  } catch {
    return null;
  }
}

export async function streamGroqChat({
  messages,
  temperature,
  onToken,
}: AiChatOptions & {
  onToken: (token: string, fullText: string) => Promise<void>;
}) {
  const client = createGroqClient();

  if (!client) {
    return null;
  }

  try {
    const stream = await client.chat.completions.create({
      model: process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant",
      messages,
      temperature,
      stream: true,
    });

    let fullText = "";

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content;

      if (typeof token === "string" && token.length > 0) {
        fullText += token;
        await onToken(token, fullText);
      }
    }

    return fullText.trim();
  } catch {
    return null;
  }
}

export async function transcribeGroqAudio(input: AudioTranscriptionInput) {
  const client = createGroqClient();

  if (!client) {
    return null;
  }

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
