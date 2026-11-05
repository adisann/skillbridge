import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { formatSalaryRange, monthlySalaryEstimate, hasSalary } from "../src/lib/salary.ts";

describe("gaji", () => {
  test("format rentang", () => {
    assert.equal(formatSalaryRange({ salaryMin: 2_400_000, salaryMax: 3_600_000, salaryPeriod: "month" }), "Rp 2,4 - 3,6 jt / bulan");
    assert.equal(formatSalaryRange({ salaryMin: 3_000_000, salaryMax: 5_000_000, salaryPeriod: "month" }), "Rp 3 - 5 jt / bulan");
    assert.equal(formatSalaryRange({ salaryMin: 150_000, salaryMax: 200_000, salaryPeriod: "day" }), "Rp 150 - 200 rb / hari");
    assert.equal(formatSalaryRange({ salaryMin: 5_000_000, salaryMax: 5_000_000, salaryPeriod: "month" }), "Rp 5 jt / bulan");
    assert.equal(formatSalaryRange({ salaryMax: 8_000_000 }), "Rp 8 jt / bulan");
  });

  test("tanpa data gaji", () => {
    assert.equal(formatSalaryRange({}), null);
    assert.equal(formatSalaryRange({ salaryMin: null, salaryMax: null }), null);
    assert.equal(hasSalary({ salaryMin: 0, salaryMax: null }), false);
  });

  test("estimasi bulanan lintas periode", () => {
    assert.equal(monthlySalaryEstimate({ salaryMin: 3_000_000, salaryMax: 5_000_000, salaryPeriod: "month" }), 4_000_000);
    assert.equal(monthlySalaryEstimate({ salaryMin: 100_000, salaryMax: 100_000, salaryPeriod: "day" }), 2_200_000);
    assert.equal(monthlySalaryEstimate({ salaryMin: 120_000_000, salaryMax: 120_000_000, salaryPeriod: "year" }), 10_000_000);
    assert.equal(monthlySalaryEstimate({}), null);
  });
});
