import type { OpenRouterChatOptions } from "./types";

const chatCompletionsUrl = "https://openrouter.ai/api/v1/chat/completions";

export function hasOpenRouterApiKey() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function createOpenRouterAuthError() {
  return Promise.resolve(new Response(null, { status: 401 }));
}

export function openRouterChat({
  messages,
  temperature,
  responseFormat,
  stream,
}: OpenRouterChatOptions) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return createOpenRouterAuthError();
  }

  return fetch(chatCompletionsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Telegram Nutrition Bot",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      messages,
      temperature,
      ...(stream ? { stream } : {}),
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  });
}

export async function streamOpenRouterChat({
  messages,
  temperature,
  onToken,
}: OpenRouterChatOptions & {
  onToken: (token: string, fullText: string) => Promise<void>;
}) {
  const response = await openRouterChat({
    messages,
    temperature,
    stream: true,
  });

  if (!response.ok || !response.body) {
    return null;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine.startsWith("data: ")) {
        continue;
      }

      const payload = trimmedLine.slice(6);

      if (payload === "[DONE]") {
        return fullText.trim();
      }

      try {
        const data = JSON.parse(payload);
        const token = data.choices?.[0]?.delta?.content;

        if (typeof token === "string" && token.length > 0) {
          fullText += token;
          await onToken(token, fullText);
        }
      } catch {
        continue;
      }
    }
  }

  return fullText.trim();
}
