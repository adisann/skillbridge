export interface JobSkillRow {
  is_mandatory: boolean;
  skills: { name: string } | null;
}

/** Pisahkan skill lowongan menjadi wajib (is_mandatory) dan tambahan. */
export function splitJobSkills(jobSkills: JobSkillRow[] | null | undefined): {
  required: string[];
  preferred: string[];
} {
  const required: string[] = [];
  const preferred: string[] = [];
  for (const js of jobSkills ?? []) {
    if (!js.skills?.name) continue;
    (js.is_mandatory ? required : preferred).push(js.skills.name);
  }
  return { required, preferred };
}
