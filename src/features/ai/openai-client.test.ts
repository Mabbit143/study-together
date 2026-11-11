import { describe, expect, it } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";
import { packSchema } from "@/features/storage/local-store";
import { turnSchema } from "./turn-schema";
describe("structured output formats", () => {
 it("produces strict Responses API formats for turns and packs", () => {
  for (const schema of [turnSchema, packSchema]) {
   const format = zodTextFormat(schema, "study_output");
   expect(format.type).toBe("json_schema");
   expect(format.strict).toBe(true);
   expect(format.schema).toMatchObject({ type: "object", additionalProperties: false });
  }
 });
});
