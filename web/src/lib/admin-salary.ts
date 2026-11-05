interface SalaryInput {
  salaryMin?: unknown;
  salaryMax?: unknown;
  salaryCurrency?: unknown;
  salaryPeriod?: unknown;
}

export function parseAdminSalary(input: SalaryInput) {
  // Permintaan lama tanpa field gaji tidak boleh menghapus gaji yang sudah ada.
  if (!["salaryMin", "salaryMax", "salaryCurrency", "salaryPeriod"].some((key) => key in input)) {
    return { data: {}, error: null };
  }

  const amounts = [input.salaryMin, input.salaryMax].map((value) =>
    value == null || value === "" ? null : value
  );
  if (amounts.some((value) => value !== null &&
    (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0))) {
    return { data: {}, error: "Gaji harus berupa nominal bulat nol atau lebih." };
  }

  const [min, max] = amounts as [number | null, number | null];
  if (min !== null && max !== null && min > max) {
    return { data: {}, error: "Gaji minimum tidak boleh melebihi gaji maksimum." };
  }
  const hasSalary = min !== null || max !== null;
  const currency = typeof input.salaryCurrency === "string" ? input.salaryCurrency.trim().toUpperCase() : "";
  const period = input.salaryPeriod;
  if (hasSalary && (!/^[A-Z]{3}$/.test(currency) ||
    typeof period !== "string" || !["hour", "day", "week", "month", "year"].includes(period))) {
    return { data: {}, error: "Isi kode mata uang 3 huruf dan periode gaji yang valid." };
  }

  return {
    data: {
      salary_min: min,
      salary_max: max,
      salary_currency: hasSalary ? currency : null,
      salary_period: hasSalary ? period : null,
    },
    error: null,
  };
}
