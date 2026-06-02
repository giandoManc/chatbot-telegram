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

export async function generateAiResponse(prompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return "Analisi AI non disponibile: manca OPENROUTER_API_KEY.";
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Telegram Nutrition Bot",
      },
      body: JSON.stringify({
        model: "openrouter/free",
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
      }),
    },
  );

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

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Telegram Nutrition Bot",
    },
    body: JSON.stringify({
      model: "openrouter/free",
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
