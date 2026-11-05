import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { extractGpaFromText, parseGpaValue, compareGpa, gpaScore, formatGpa } from "../src/lib/gpa.ts";

describe("IPK", () => {
  test("ekstraksi dari berbagai format CV", () => {
    assert.equal(extractGpaFromText("Universitas Telkom, IPK: 3,75 / 4,00"), 3.75);
    assert.equal(extractGpaFromText("S1 Informatika | GPA 3.8"), 3.8);
    assert.equal(extractGpaFromText("Indeks Prestasi Kumulatif 3.50 dari 4.00"), 3.5);
    assert.equal(extractGpaFromText("Cumulative GPA: 3.62/4.00"), 3.62);
  });

  test("abaikan skala selain 4 dan teks tanpa IPK", () => {
    assert.equal(extractGpaFromText("GPA 85/100"), null);
    assert.equal(extractGpaFromText("IPK 4.5"), null);
    assert.equal(extractGpaFromText("Pengalaman 3 tahun sebagai analis"), null);
    assert.equal(extractGpaFromText("GPA tidak ditampilkan, lulus 2024"), null);
  });

  test("validasi input manual", () => {
    assert.equal(parseGpaValue("3,456"), 3.46);
    assert.equal(parseGpaValue("3,45"), 3.45);
    assert.equal(parseGpaValue(""), null);
    assert.equal(parseGpaValue("5"), null);
    assert.equal(parseGpaValue(0.5), null);
  });

  test("perbandingan dan skor", () => {
    assert.equal(compareGpa(3.5, 3.0), "meets");
    assert.equal(compareGpa(2.8, 3.0), "below");
    assert.equal(compareGpa(null, 3.0), "unknown");
    assert.equal(compareGpa(3.5, null), "unknown");
    assert.equal(gpaScore(3.5, 3.0), 1);
    assert.equal(gpaScore(1.5, 3.0), 0.5);
    assert.equal(gpaScore(1.0, 3.0), 0.4);
    assert.equal(formatGpa(3.5), "3,50");
  });
});
