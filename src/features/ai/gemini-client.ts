import { z } from "zod";
import { buildStudyPrompt } from "./build-study-prompt";
import { providerPackSchema, turnSchema, type StudyTurnRequest } from "./turn-schema";

type GeminiResponse = {
  candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  error?: { code?: number; message?: string; status?: string };
};

export async function generateJson(
  instructions: string,
  input: string,
  schema: z.ZodType,
  apiKey: string,
  maxOutputTokens: number,
): Promise<unknown> {
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents: [{ role: "user", parts: [{ text: input }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(schema),
          maxOutputTokens,
          temperature: 0.2,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    },
  );
  const body = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    console.error("[gemini] request failed", { status: response.status, code: body.error?.status, message: body.error?.message });
    throw Object.assign(new Error(`Gemini request failed with ${response.status}`), { status: response.status });
  }
  const text = body.candidates?.[0]?.content?.parts?.filter(part => part.thought !== true).map(part => part.text ?? "").join("").trim();
  if (!text) {
    console.error("[gemini] no structured output", { finishReason: body.candidates?.[0]?.finishReason });
    throw new Error("Gemini returned no structured output");
  }
  const starts = [...text.matchAll(/\{/g)].map(match => match.index);
  const ends = [...text.matchAll(/\}/g)].map(match => match.index + 1).reverse();
  for (const start of starts) {
    for (const end of ends) {
      if (end <= start) continue;
      try {
        const candidate = JSON.parse(text.slice(start, end));
        if (schema.safeParse(candidate).success) return candidate;
      } catch { /* Try the next brace-delimited candidate. */ }
    }
  }
  console.error("[gemini] returned no schema-valid JSON object", { length: text.length });
  throw new Error("Gemini returned invalid JSON");
}

export async function generate(request: StudyTurnRequest, kind: "turn" | "pack", apiKey: string): Promise<unknown> {
  const prompt = buildStudyPrompt(request, kind);
  return generateJson(
    prompt.instructions,
    prompt.input,
    kind === "turn" ? turnSchema : providerPackSchema,
    apiKey,
    kind === "turn" ? 4000 : 12000,
  );
}
