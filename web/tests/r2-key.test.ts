import test from "node:test";
import assert from "node:assert/strict";
import { ownedResumeKey, resumeKeyPrefix } from "../src/lib/r2.ts";

const UID = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

test("ownedResumeKey hanya menerima key di folder milik pengguna", () => {
  const own = `${resumeKeyPrefix(UID)}abc.pdf`;
  assert.equal(ownedResumeKey(UID, own), own);
  assert.equal(ownedResumeKey(UID, `r2://${own}`), own);
});

test("ownedResumeKey menolak key milik orang lain, traversal, dan input aneh", () => {
  assert.equal(ownedResumeKey(UID, `${resumeKeyPrefix(OTHER)}abc.pdf`), null);
  assert.equal(ownedResumeKey(UID, "resumes/legacy_1699999999_cv.pdf"), null);
  assert.equal(ownedResumeKey(UID, `${resumeKeyPrefix(UID)}../${OTHER}/abc.pdf`), null);
  assert.equal(ownedResumeKey(UID, `${resumeKeyPrefix(UID)}`), null);
  assert.equal(ownedResumeKey(UID, "https://evil.example/resumes/x.pdf"), null);
  assert.equal(ownedResumeKey(UID, undefined), null);
  assert.equal(ownedResumeKey(UID, 42), null);
});
