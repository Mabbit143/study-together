import { expect, it } from "vitest";
import { packSchema } from "@/features/storage/local-store";
import { starterTopicPacks } from "./starter-topic-packs";

it("provides exactly three distinct source-grounded starter packs", () => {
  expect(starterTopicPacks).toHaveLength(3);
  expect(new Set(starterTopicPacks.map((pack) => pack.id)).size).toBe(3);
  starterTopicPacks.forEach((pack) => expect(packSchema.safeParse(pack).success).toBe(true));
});
