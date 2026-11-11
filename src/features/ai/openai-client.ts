import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { packSchema } from "@/features/storage/local-store";
import { buildStudyPrompt } from "./build-study-prompt";
import { turnSchema, type StudyTurnRequest } from "./turn-schema";
export async function generate(request: StudyTurnRequest, kind: "turn" | "pack", apiKey: string): Promise<unknown> {
 const client = new OpenAI({ apiKey, timeout: 20_000, maxRetries: 0 });
 const prompt = buildStudyPrompt(request, kind);
 const result = await client.responses.parse({ model: process.env.OPENAI_TEXT_MODEL || "gpt-6-luna", instructions: prompt.instructions, input: prompt.input, text: { format: zodTextFormat(kind === "turn" ? turnSchema : packSchema, kind === "turn" ? "study_turn" : "offline_pack") } });
 if (!result.output_parsed || result.status !== "completed") throw new Error("Invalid output");
 return result.output_parsed;
}
