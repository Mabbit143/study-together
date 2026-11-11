import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const profileKey = "study-together.profile.v1";
const biologyExcerpt = "Cells use mitochondria to release usable energy from nutrients. Ribosomes build proteins from amino acids.";

function pack(id: string, title: string, excerpt: string) {
  const quote = excerpt.split(". ")[0];
  return {
    version: 1, id, title, excerpt,
    branches: [{
      id: `${id}-branch`, peerId: "rae", question: `What does the source say about ${title}?`, sourceQuote: quote,
      hints: [`Look closely at: ${quote}`], explanations: [`The supplied source states: ${quote}`],
      examples: [`A source-grounded example uses only: ${quote}`],
      practice: [{ id: `${id}-practice`, prompt: `Explain this in your own words: ${quote}`, answerCheck: `Include the source idea: ${quote}` }],
      followUpBranchIds: [],
    }],
    board: { notes: [`${title} note`], highlights: [quote], selectedTool: "sticky" },
    progress: { branchId: `${id}-branch`, completedPracticeIds: [] },
  };
}

function profile(packs: ReturnType<typeof pack>[], activePackId: string | null = packs[0]?.id ?? null) {
  return {
    version: 1,
    peers: {
      jules: { name: "Jules", voice: "alloy", personality: "encouraging", approach: "question-led" },
      rae: { name: "Rae", voice: "coral", personality: "straightforward", approach: "example-led" },
      milo: { name: "Milo", voice: "sage", personality: "playful", approach: "explain-then-practice" },
    },
    memory: { helpful: [], difficult: [] }, packs, activePackId, queuedQuestions: [],
  };
}

async function seed(page: Page, value: ReturnType<typeof profile>) {
  await page.addInitScript(([key, data]) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(data));
  }, [profileKey, value] as const);
}

test("imports real PDF and DOCX fixtures and requires excerpt confirmation", async ({ page }) => {
  for (const fixture of ["old-english.pdf", "old-english.docx"]) {
    await page.goto("/");
    await page.getByRole("button", { name: "Bring material" }).click();
    const file = page.getByLabel("Text, PDF, or DOCX file");
    await file.setInputFiles(path.resolve("src/features/materials/__fixtures__", fixture));
    await expect(page.getByRole("heading", { name: "Choose an excerpt" })).toBeVisible();
    const excerpt = page.getByLabel("Select the text you want to study");
    await excerpt.focus();
    await page.keyboard.press("ControlOrMeta+A");
    await expect(page.getByText(/characters selected/)).not.toHaveText("0 characters selected");
    await page.getByRole("button", { name: "Confirm excerpt" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "old-english" })).toBeVisible();
  }
});

test("keeps two subjects separate and resumes the explicitly selected pack", async ({ page }) => {
  const oldEnglish = pack("oe-pack", "Old English", "Sēo cwēn gesihð þone cyning. The confirmed line contains Unicode letters.");
  const biology = pack("bio-pack", "Cell biology", biologyExcerpt);
  await seed(page, profile([oldEnglish, biology], biology.id));
  await page.goto("/?room=old-english-demo");
  await expect(page.getByRole("heading", { name: "Cell biology study group" })).toBeVisible();
  await expect(page.getByText(biologyExcerpt, { exact: true })).toBeVisible();
  await expect(page.getByText("Sēo cwēn gesihð þone cyning", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Study partners" })).toBeVisible();
  for (const name of ["Jules", "Rae", "Milo"]) await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("Grounded source highlights").getByText("Cells use mitochondria", { exact: false })).toBeVisible();
  await expect(page.getByText("Cell biology note", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sticky note" })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Cell biology study group" })).toBeVisible();
});

test("customizes each peer, interrupts a response, and preserves learner memory", async ({ page }) => {
  await page.route("**/api/study-turn", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ speaker: "jules", response: "The source supports this explanation.", citedExcerpt: "Sēo cwēn", boardAction: null, memorySuggestion: null, followUp: null }) });
  });
  await page.goto("/?room=old-english-demo");
  const settings = page.getByRole("button", { name: "Peer settings" });
  await expect(settings).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    await settings.nth(index).focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("combobox", { name: "Voice" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Personality" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Study approach" })).toBeVisible();
    await page.getByRole("button", { name: "Close settings" }).click();
  }
  await page.getByLabel("Your question").fill("Explain the verb from the source.");
  await page.getByRole("button", { name: "Practice this later" }).click();
  await page.getByRole("button", { name: "Send to the group" }).click();
  await expect(page.getByRole("button", { name: "Interrupt response" })).toBeVisible();
  await page.getByLabel("Your question").fill("Use my newer question instead.");
  await page.getByRole("button", { name: "Interrupt response" }).click();
  await expect(page.getByLabel("Your question")).toHaveValue("Use my newer question instead.");
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), profileKey);
  expect(saved.memory.difficult).toHaveLength(1);
  await page.goto("/");
  await page.getByRole("button", { name: "Continue studying" }).click();
  await expect(page.getByText(/Practice “Explain the verb from the source\.” again/)).toBeVisible();
});

test("downloads a complete offline pack, works offline, and never auto-sends queued questions", async ({ page, context }) => {
  const biology = pack("bio-pack", "Cell biology", biologyExcerpt);
  await seed(page, profile([biology], biology.id));
  await page.goto("/?room=old-english-demo");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download offline study pack" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/cell-biology.*\.json/i);
  const filePath = await download.path();
  expect(filePath).toBeTruthy();
  const downloaded = JSON.parse(await (await import("node:fs/promises")).readFile(filePath!, "utf8"));
  expect(downloaded).toMatchObject({ version: 1, id: biology.id, title: biology.title, excerpt: biology.excerpt });
  expect(downloaded.branches[0].sourceQuote).toContain("mitochondria");
  await page.getByLabel("Import offline study pack").setInputFiles(filePath!);
  await expect(page.getByRole("heading", { name: "What does the source say about Cell biology?" })).toBeVisible();

  await page.getByRole("button", { name: "Simulate going offline" }).click();
  await page.getByLabel("Search confirmed excerpt").fill("Ribosomes");
  await page.getByRole("button", { name: /Highlight on whiteboard: Ribosomes/ }).click();
  await page.getByLabel("Add board note").fill("Compare mitochondria and ribosomes.");
  await page.getByRole("button", { name: "Save board note" }).click();
  await page.getByRole("button", { name: "Mark practice complete" }).click();
  await page.getByLabel("Your question").fill("What is not covered by this prepared branch?");
  await page.getByRole("button", { name: "Send to the group" }).click();
  await expect(page.getByText("What is not covered by this prepared branch?", { exact: true })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Cell biology study group" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Cell biology study group" })).toBeVisible();
  await expect(page.getByText("Compare mitochondria and ribosomes.", { exact: true })).toBeVisible();
  await expect(page.getByText("Ribosomes build proteins from amino acids", { exact: false }).last()).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText("Online", { exact: true })).toBeVisible();
  await expect(page.getByText("What is not covered by this prepared branch?", { exact: true })).toBeVisible();
  await page.route("**/api/study-turn", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ speaker: "rae", response: "The prepared source does not cover that question.", citedExcerpt: null, boardAction: null, memorySuggestion: null, followUp: null }) }));
  await page.getByRole("button", { name: "Send now" }).click();
  await expect(page.getByText("What is not covered by this prepared branch?", { exact: true })).toHaveCount(0);
});

test("provider outage preserves input and offers the deterministic grounded demo", async ({ page }) => {
  await page.route("**/api/study-turn", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Provider unavailable", demoAvailable: true }) }));
  await page.goto("/?room=old-english-demo");
  const question = "What does cwēn mean in the confirmed line?";
  await page.getByLabel("Your question").fill(question);
  await page.getByRole("button", { name: "Send to the group" }).click();
  await expect(page.getByLabel("Your question")).toHaveValue(question);
  await expect(page.getByText(/study service is unavailable/i)).toBeVisible();
  await page.getByRole("button", { name: "Use reliable demo" }).click();
  await expect(page.getByText(/Sēo cwēn/).last()).toBeVisible();
  await expect(page.getByText(/Demo response shown/i)).toBeVisible();
});

test("offline without a pack keeps deterministic source tools and queues nothing automatically", async ({ page }) => {
  await page.goto("/?room=old-english-demo");
  await page.getByRole("button", { name: "Simulate going offline" }).click();
  await expect(page.locator(".offline-label")).toContainText("Offline without a prepared pack");
  await page.getByLabel("Search confirmed excerpt").fill("cwēn");
  await expect(page.getByRole("button", { name: /Highlight on whiteboard:.*cwēn/i })).toBeVisible();
  await page.getByLabel("Add board note").fill("My local note");
  await page.getByRole("button", { name: "Save board note" }).click();
  await expect(page.getByText("My local note", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Prepare offline study pack" })).toBeDisabled();
});
