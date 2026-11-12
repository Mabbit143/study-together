import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const profileKey = "study-together.profile.v1";
const biologyExcerpt = "Cells use mitochondria to release usable energy from nutrients. Ribosomes build proteins from amino acids.";

function pack(id: string, title: string, excerpt: string) {
  const parts = excerpt.split(". "); const quote = parts[0]; const secondQuote = parts[1] ? `${parts[1].replace(/\.$/, "")}.` : quote;
  return {
    version: 1, id, title, excerpt,
    branches: [{
      id: `${id}-branch`, peerId: "rae", question: `What does the source say about ${title}?`, sourceQuote: quote,
      hints: [`Look closely at: ${quote}`], explanations: [`The supplied source states: ${quote}`],
      examples: [`A source-grounded example uses only: ${quote}`],
      practice: [{ id: `${id}-practice`, prompt: `Explain this in your own words: ${quote}`, answerCheck: `Include the source idea: ${quote}` }],
      followUpBranchIds: [`${id}-branch-2`],
    }, { id: `${id}-branch-2`, peerId: "milo", question: `How does the second source idea connect to ${title}?`, sourceQuote: secondQuote, hints: [`Find: ${secondQuote}`], explanations: [`The second source statement is: ${secondQuote}`], examples: [`A second grounded example is: ${secondQuote}`], practice: [{ id: `${id}-practice-2`, prompt: `Explain this second idea: ${secondQuote}`, answerCheck: `Your answer should include: ${secondQuote}` }], followUpBranchIds: [] }],
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
    await expect(page.getByText("Sēo cwēn gesihþ þone cyning", { exact: true })).toBeVisible();
  }
});

test("brings biology through confirmation and returns subject-grounded guidance from the chosen peer", async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;
  await page.route("**/api/study-turn", async (route) => {
    requestBody = await route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ speaker: "rae", response: "The biology source says ribosomes build proteins from amino acids.", citedExcerpt: "Ribosomes build proteins from amino acids.", boardAction: { type: "highlight", text: "Ribosomes build proteins from amino acids." }, memorySuggestion: null, followUp: null }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Bring material" }).click();
  await page.getByLabel("Or paste text").fill(biologyExcerpt);
  await page.getByRole("button", { name: "Preview pasted text" }).click();
  const excerpt = page.getByLabel("Select the text you want to study");
  await excerpt.focus(); await page.keyboard.press("ControlOrMeta+A");
  await page.getByRole("button", { name: "Confirm excerpt" }).click();
  await expect(page.getByText(biologyExcerpt, { exact: true })).toBeVisible();
  await expect(page.getByText("Sēo cwēn gesihð þone cyning", { exact: true })).toHaveCount(0);
  await expect(page.getByText("The queen sees the king.", { exact: false })).toHaveCount(0); await expect(page.getByText("cwēn = queen", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Choose Rae for next turn" }).click();
  await page.getByLabel("Your question").fill("What do ribosomes do?");
  await page.getByRole("button", { name: "Send to the group" }).click();
  await expect(page.getByText("The biology source says ribosomes build proteins from amino acids.", { exact: true }).last()).toBeVisible();
  expect(requestBody).toMatchObject({ speaker: "rae", question: "What do ribosomes do?", material: { title: "Pasted text", excerpt: biologyExcerpt }, recentTurns: [], selectedMemories: [] });
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
  const requests: Array<Record<string, unknown>> = [];
  await page.route("**/api/study-turn", async (route) => {
    const body = await route.request().postDataJSON(); requests.push(body);
    if (body.question === "Use my newer question instead.") await new Promise((resolve) => setTimeout(resolve, 2_000));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ speaker: body.speaker, response: `${body.speaker} used the saved study style.`, citedExcerpt: "Sēo cwēn", boardAction: null, memorySuggestion: null, followUp: null }) });
  });
  await page.goto("/?room=old-english-demo");
  await page.getByLabel("Your question").fill("Explain the verb from the source.");
  await page.getByRole("button", { name: "Practice this later" }).click();
  const settings = page.getByRole("button", { name: "Peer settings" });
  await expect(settings).toHaveCount(3);
  const voices = ["coral", "sage", "alloy"];
  const personalities = ["straightforward", "playful", "encouraging"];
  const approaches = ["example-led", "explain-then-practice", "question-led"];
  for (let index = 0; index < 3; index += 1) {
    await settings.nth(index).focus(); await page.keyboard.press("Enter");
    await page.getByRole("combobox", { name: "Voice" }).selectOption(voices[index]);
    await page.getByRole("combobox", { name: "Personality" }).selectOption(personalities[index]);
    await page.getByRole("combobox", { name: "Study approach" }).selectOption(approaches[index]);
    await page.getByRole("button", { name: "Close settings" }).click();
  }
  await page.getByRole("button", { name: "Choose Jules for next turn" }).click(); await page.getByLabel("Your question").fill("Jules complete turn."); await page.getByRole("button", { name: "Send to the group" }).click(); await expect(page.getByText("jules used the saved study style.", { exact: true }).last()).toBeVisible();
  await settings.nth(1).click(); await page.getByRole("button", { name: "Replace peer" }).click(); await page.getByRole("button", { name: "Close settings" }).click();
  await page.getByRole("button", { name: /Choose Rae \(new\) for next turn/ }).click();
  await page.getByLabel("Your question").fill("Rae complete turn.");
  await page.getByRole("button", { name: "Send to the group" }).click();
  await expect(page.getByText("rae used the saved study style.", { exact: true }).last()).toBeVisible();
  expect(requests.find((item) => item.speaker === "rae")).toMatchObject({ speaker: "rae", peers: { rae: { name: "Rae (new)", voice: "coral", personality: "straightforward", approach: "example-led" } } });
  await page.getByRole("button", { name: "Choose Milo for next turn" }).click();
  await page.getByLabel("Your question").fill("Milo complete turn."); await page.getByRole("button", { name: "Send to the group" }).click(); await expect(page.getByText("milo used the saved study style.", { exact: true }).last()).toBeVisible();
  await page.getByLabel("Your question").fill("Use my newer question instead.");
  await page.getByRole("button", { name: "Send to the group" }).click();
  await expect(page.getByRole("button", { name: "Interrupt response" })).toBeVisible();
  await page.getByLabel("Your question").fill("Keep this newest wording.");
  await page.getByRole("button", { name: "Interrupt response" }).click();
  await expect(page.getByLabel("Your question")).toHaveValue("Keep this newest wording.");
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), profileKey);
  expect(saved.memory.difficult).toHaveLength(1);
  expect(saved.peers.rae.name).toBe("Rae (new)");
  expect(saved.peers.jules).toMatchObject({ voice: "coral", personality: "straightforward", approach: "example-led" });
  expect(saved.peers.rae).toMatchObject({ voice: "coral", personality: "straightforward", approach: "example-led" });
  expect(saved.peers.milo).toMatchObject({ voice: "alloy", personality: "encouraging", approach: "question-led" });
  await page.goto("/");
  await page.getByRole("button", { name: "Continue studying" }).click();
  await expect(page.getByText(/Practice “Explain the verb from the source\.” again/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rae (new)" })).toBeVisible();
});

test("downloads a complete offline pack, works offline, and never auto-sends queued questions", async ({ page, context }) => {
  const biology = pack("bio-pack", "Cell biology", biologyExcerpt);
  await page.route("**/api/offline-pack", async (route) => {
    const body = await route.request().postDataJSON();
    expect(body).toMatchObject({ material: { excerpt: biologyExcerpt }, speaker: "rae" });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(biology) });
  });
  await page.goto("/"); await page.getByRole("button", { name: "Bring material" }).click(); await page.getByLabel("Or paste text").fill(biologyExcerpt); await page.getByRole("button", { name: "Preview pasted text" }).click();
  const selection = page.getByLabel("Select the text you want to study"); await selection.focus(); await page.keyboard.press("ControlOrMeta+A"); await page.getByRole("button", { name: "Confirm excerpt" }).click();
  await page.getByRole("button", { name: "Choose Rae for next turn" }).click(); await page.getByRole("button", { name: "Prepare offline study pack" }).click();
  await expect(page.getByRole("heading", { name: "What does the source say about Cell biology?" })).toBeVisible();
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
  await page.evaluate(() => localStorage.clear()); await page.goto("/?room=old-english-demo");
  await page.getByLabel("Import offline study pack").setInputFiles(filePath!);
  await expect(page.getByRole("heading", { name: "What does the source say about Cell biology?" })).toBeVisible();

  await page.getByRole("button", { name: "Simulate going offline" }).click();
  await page.getByRole("button", { name: "Pointer" }).click(); await expect(page.getByText(/review and select board items/i)).toBeVisible();
  await page.getByRole("button", { name: "Pen" }).click(); await page.getByLabel("Pen mark").fill("Connect mitochondria to energy"); await page.getByRole("button", { name: "Add pen mark" }).click();
  await page.getByRole("button", { name: "Sticky note" }).click(); await expect(page.getByLabel("Add board note")).toBeFocused();
  await page.getByLabel("Search confirmed excerpt").fill("Ribosomes");
  await page.getByRole("button", { name: /Highlight on whiteboard: Ribosomes/ }).click();
  await page.getByLabel("Add board note").fill("Compare mitochondria and ribosomes.");
  await page.getByRole("button", { name: "Save board note" }).click();
  await page.getByRole("button", { name: "Mark practice complete" }).click();
  await page.getByRole("button", { name: "Continue prepared path" }).click();
  await expect(page.getByText(/second source idea/i)).toBeVisible();
  await page.getByLabel("Your answer").fill("Ribosomes build proteins."); await page.getByRole("button", { name: "Check answer" }).click(); await expect(page.getByText(/Your answer should include/i)).toBeVisible();
  await page.getByRole("button", { name: "Mark practice complete" }).click();
  await page.getByLabel("Your question").fill("Delete this queued question.");
  await page.getByRole("button", { name: "Send to the group" }).click();
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
  await expect(page.getByText(/Connect mitochondria to energy/)).toBeVisible();
  await expect(page.getByText("Ribosomes build proteins from amino acids", { exact: false }).last()).toBeVisible();
  await expect(page.getByText("Practice complete for this prepared branch.", { exact: true })).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText("Online", { exact: true })).toBeVisible();
  const deleteItem = page.getByRole("listitem").filter({ hasText: "Delete this queued question." });
  await deleteItem.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Delete this queued question.", { exact: true })).toHaveCount(0);
  await expect(page.getByText("What is not covered by this prepared branch?", { exact: true })).toBeVisible();
  await page.route("**/api/study-turn", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ speaker: "rae", response: "The prepared source does not cover that question.", citedExcerpt: null, boardAction: null, memorySuggestion: null, followUp: null }) }));
  await page.getByRole("button", { name: "Send now" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "What is not covered by this prepared branch?" })).toHaveCount(0);
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

test("offline without a pack survives a real service-worker reload and keeps deterministic tools", async ({ page, context }) => {
  await page.goto("/?room=old-english-demo");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload(); await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true); await page.reload();
  await expect(page.locator(".offline-label")).toContainText("Offline without a prepared pack");
  await page.getByLabel("Search confirmed excerpt").fill("cwēn");
  await expect(page.getByRole("button", { name: /Highlight on whiteboard:.*cwēn/i })).toBeVisible();
  await page.getByRole("button", { name: "Sticky note" }).click();
  await page.getByLabel("Add board note").fill("My local note");
  await page.getByRole("button", { name: "Save board note" }).click();
  await expect(page.getByText("My local note", { exact: true })).toBeVisible();
  await expect(page.getByText(/Flashcard:/)).toBeVisible(); await expect(page.getByText(/Self-explanation:/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Prepare offline study pack" })).toBeDisabled();
  await context.setOffline(false);
});
