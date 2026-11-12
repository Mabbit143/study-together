import { describe, expect, it } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";
import { turnSchema, providerPackSchema } from "./turn-schema";
describe("structured output formats", () => {
 it("produces strict Responses API formats for turns and packs", () => {
  for (const schema of [turnSchema, providerPackSchema]) {
   const format = zodTextFormat(schema, "study_output");
   expect(format.type).toBe("json_schema");
   expect(format.strict).toBe(true);
   expect(format.schema).toMatchObject({ type: "object", additionalProperties: false });
   expect(JSON.stringify(format.schema)).not.toContain('"default"');
  }
 });
});
