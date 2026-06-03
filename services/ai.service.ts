const systemPrompt = [
  "Sei un coach nutrizionale per un bot Telegram.",
  "Rispondi sempre in italiano.",
  "Cerca di essere conciso, chiaro e pratico.",
  "Usa emoji quando appropriato per rendere la risposta più amichevole e coinvolgente.",
  "In base al goal e ai dati dell'utente, dai consigli pratici e utili per migliorare la dieta e raggiungere i propri obiettivi.",
  "Non fare diagnosi mediche e non dare prescrizioni cliniche.",
  "Dai un commento breve, pratico e utile sui pasti della giornata.",
  "Se i dati sono pochi, dillo chiaramente.",
].join(" ");

const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const mealNutritionResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "meal_nutrition",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "name",
              "calories",
              "protein_g",
              "carbohydrates_total_g",
              "fat_total_g",
            ],
            properties: {
              name: { type: "string" },
              calories: { type: "number" },
              protein_g: { type: "number" },
              carbohydrates_total_g: { type: "number" },
              fat_total_g: { type: "number" },
            },
          },
        },
      },
    },
  },
};

export async function generateAiResponse(prompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return "Analisi AI non disponibile: manca OPENROUTER_API_KEY.";
  }

  const response = await openRouterChat({
    messages: [
      {
        role: "system",
        content: systemPrompt,
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
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return "Analisi AI non disponibile: manca OPENROUTER_API_KEY.";
  }

  const response = await fetch(openRouterUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Telegram Nutrition Bot",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
      temperature: 0.4,
    }),
  });

  if (!response.ok || !response.body) {
    return "Non riesco a generare l'analisi AI al momento. Riprova più tardi.";
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

  return fullText.trim() || "Non ho ricevuto un'analisi valida dal modello.";
}

export async function generateMealJson(prompt: string) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "Sei un estrattore nutrizionale per un bot Telegram.",
        "Stima calorie e macronutrienti da descrizioni di pasti in italiano.",
        "Devi restituire sempre e solo JSON valido, senza markdown, testo extra o commenti.",
        "La struttura deve essere sempre identica:",
        "{\"items\":[{\"name\":\"string\",\"calories\":number,\"protein_g\":number,\"carbohydrates_total_g\":number,\"fat_total_g\":number}]}",
        "Non aggiungere campi diversi da quelli indicati.",
        "Usa numeri, non stringhe, per calorie e macronutrienti.",
        "Se ci sono più alimenti, crea un item per ogni alimento.",
        "Se la descrizione è vaga, fai una stima prudente.",
      ].join(" "),
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  let response = await openRouterChat({
    messages,
    temperature: 0.1,
    responseFormat: mealNutritionResponseFormat,
  });

  if (!response.ok && response.status === 400) {
    response = await openRouterChat({
      messages,
      temperature: 0.1,
    });
  }

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return null;
  }

  return extractJson(content);
}

export async function transcribeAudio(input: {
  data: string;
  format: string;
  language?: string;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_audio: {
        data: input.data,
        format: input.format,
      },
      model: process.env.OPENROUTER_TRANSCRIPTION_MODEL || "openai/whisper-large-v3",
      language: input.language || "it",
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  return typeof data.text === "string" ? data.text.trim() : null;
}

function openRouterChat({
  messages,
  temperature,
  responseFormat,
}: {
  messages: ChatMessage[];
  temperature: number;
  responseFormat?: unknown;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return Promise.resolve(new Response(null, { status: 401 }));
  }

  return fetch(openRouterUrl, {
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
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  });
}

function extractJson(content: string) {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}
