import { test } from "node:test";
import { deepEqual, equal, rejects } from "node:assert/strict";
import { extractJobFromImage } from "../src/lib/ai/extractor.ts";
import { readJobStreetPosting } from "../src/lib/jobstreet-posting.ts";

process.env.AI_API_KEY = "fixture-key";
process.env.GROQ_API_KEY = "fixture-key";
delete process.env.LLAMA_CLOUD_API_KEY;

const url = "https://id.jobstreet.com/id/job/123";

test("JobStreet reads the visible posting without surrounding page content", () => {
  const posting = readJobStreetPosting(`
    <h1 data-automation="job-detail-title">Systems Engineer</h1>
    <span data-automation="advertiser-name">Example &amp; Co</span>
    <div data-automation="jobAdDetails"><div><p>Maintain systems.</p></div>
      <ul><li>Monitor network uptime.</li></ul>
    </div>
    <div>Other jobs and site navigation</div>`, url);
  equal(posting?.title, "Systems Engineer");
  equal(posting?.company, "Example & Co");
  equal(posting?.description, "Maintain systems.\n\n• Monitor network uptime.");
  equal(posting?.sourceUrl, url);
  equal(readJobStreetPosting('<h1 data-automation="job-detail-title">Systems Engineer</h1>', url), null);
});

test("An incomplete Gemini OCR response falls through to a grounded draft", async (t) => {
  t.mock.method(console, "warn", () => {});
  t.mock.method(console, "info", () => {});
  let usedGroq = false;
  t.mock.method(globalThis, "fetch", async (input: string) => {
    if (new URL(input).hostname === "generativelanguage.googleapis.com") {
      return Response.json({ candidates: [{ content: { parts: [{ text: "{}" }] } }] });
    }
    usedGroq = new URL(input).hostname === "api.groq.com";
    return Response.json({ choices: [{ message: { content: JSON.stringify({
      title: "Network Security Engineer",
      company: "Example & Co",
      description: "Monitor network incidents and maintain security tooling.",
      experienceYearsMin: 0,
    }) } }] });
  });
  const job = await extractJobFromImage("fixture", "image/jpeg");
  equal(job.title, "Network Security Engineer");
  equal(job.description, "Monitor network incidents and maintain security tooling.");
  equal(job.location, "");
  equal(job.canonicalTitle, "");
  equal(job.employmentType, "");
  equal(job.experienceYearsMin, 0);
  deepEqual(job.requiredSkills, []);
  equal(usedGroq, true);
});

test("Admin OCR rejects placeholder descriptions while Tracker can use a title-only result", async (t) => {
  t.mock.method(console, "warn", () => {});
  t.mock.method(console, "info", () => {});
  t.mock.method(globalThis, "fetch", async (input: string) => {
    const content = JSON.stringify({ title: "Network Security Engineer", description: "Deskripsi lowongan diekstrak melalui AI OCR." });
    if (new URL(input).hostname === "generativelanguage.googleapis.com") {
      return Response.json({ candidates: [{ content: { parts: [{ thought: true, text: "Ignore this thought." }, { text: content }] } }] });
    }
    return Response.json({ choices: [{ message: { content } }] });
  });
  await rejects(extractJobFromImage("fixture", "image/jpeg"), /belum berhasil dibaca/);
  const job = await extractJobFromImage("fixture", "image/jpeg", "fixture.jpg", { requireDescription: false });
  equal(job.title, "Network Security Engineer");
  equal(job.experienceYearsMin, null);
});
