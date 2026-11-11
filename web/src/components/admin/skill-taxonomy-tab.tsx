import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TextInput, Select } from "@/components/ui/input";
import { SKILL_CATEGORY_OPTIONS } from "@/lib/admin-jobs";
import type { AdminNotification, JobSourceItem, SkillItem } from "@/types/admin";

interface SkillTaxonomyTabProps {
  skills: SkillItem[];
  sources: JobSourceItem[];
  notify: (notification: AdminNotification) => void;
  onChanged: () => void;
}

async function postSkill(body: Record<string, string>) {
  const res = await fetch("/api/admin/skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
}

export function SkillTaxonomyTab({ skills, sources, notify, onChanged }: SkillTaxonomyTabProps) {
  const [masterSkillName, setMasterSkillName] = useState("");
  const [masterSkillCategory, setMasterSkillCategory] = useState("Data & Analytics");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillAlias, setNewSkillAlias] = useState("");

  const submit = async (save: () => Promise<void>, successMessage: string, reset: () => void) => {
    try {
      await save();
      notify({ type: "success", message: successMessage });
      reset();
      onChanged();
    } catch (err: unknown) {
      notify({ type: "error", message: (err as Error).message });
    }
  };

  const handleCreateMasterSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterSkillName) return;
    return submit(
      () => postSkill({ skillName: masterSkillName, category: masterSkillCategory }),
      `Skill master '${masterSkillName}' berhasil ditambahkan ke taksonomi.`,
      () => setMasterSkillName("")
    );
  };

  const handleCreateAlias = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName || !newSkillAlias) return;
    return submit(
      () => postSkill({ skillName: newSkillName, alias: newSkillAlias }),
      `Alias '${newSkillAlias}' berhasil dipetakan ke skill master '${newSkillName}'.`,
      () => setNewSkillAlias("")
    );
  };

  return (
    <div className="space-y-stack-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-xl">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Skill Master Baru</CardTitle>
            <CardDescription>
              Tambahkan entitas skill terstandar ke dalam taksonomi pasar kerja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMasterSkill} className="space-y-stack-sm">
              <TextInput
                label="Nama Skill Master"
                placeholder="cth. dbt, Looker Studio"
                value={masterSkillName}
                onChange={(e) => setMasterSkillName(e.target.value)}
                required
              />
              <Select
                label="Kategori Kompetensi"
                value={masterSkillCategory}
                onChange={(e) => setMasterSkillCategory(e.target.value)}
                options={SKILL_CATEGORY_OPTIONS}
              />
              <Button variant="primary" size="sm" type="submit" className="w-full">
                Tambah Master Skill
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pemetaan Alias & Sinonim Skill</CardTitle>
            <CardDescription>
              Menstandarkan istilah sinonim (contoh: postgres → PostgreSQL) agar teragregasi di Market Skill Insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAlias} className="space-y-stack-sm">
              <TextInput
                label="Kata Kunci Alias (Sinonim)"
                placeholder="cth. ms sql, postgresql, dax"
                value={newSkillAlias}
                onChange={(e) => setNewSkillAlias(e.target.value)}
                required
              />
              <TextInput
                label="Target Skill Master"
                placeholder="cth. SQL, DAX"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                required
              />
              <Button variant="outline" size="sm" type="submit" className="w-full">
                Simpan Pemetaan Alias
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        <Card>
          <CardHeader>
            <CardTitle>Master Taksonomi Skill ({skills.length})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-stack-xs">
            {skills.map((s) => (
              <div key={s.id} className="p-stack-sm rounded-xl border border-sb-border bg-sb-mist-soft space-y-stack-2xs">
                <div className="flex items-center justify-between text-xs">
                  <strong className="text-sb-navy font-bold">{s.name}</strong>
                  <span className="text-xs font-mono px-stack-xs py-stack-3xs rounded bg-white border border-sb-border text-sb-text-2">
                    {s.category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-stack-2xs">
                  {s.skill_aliases && s.skill_aliases.length > 0 ? (
                    s.skill_aliases.map((a) => (
                      <span key={a.id} className="text-xs font-mono px-stack-2xs py-stack-3xs rounded bg-sb-mist-faint text-sb-navy border border-sb-border">
                        {a.alias}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-sb-text-2 italic">Belum ada alias terdaftar</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata Sumber Lowongan ({sources.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-stack-sm">
            {sources.map((src) => (
              <div key={src.id} className="p-stack-sm rounded-lg border border-sb-border bg-sb-mist-soft flex items-center justify-between gap-stack-xs text-xs">
                <div className="min-w-0 [overflow-wrap:anywhere]">
                  <strong className="font-mono text-sb-navy block">{src.name}</strong>
                  <span className="text-sb-text-2 font-mono text-[11px]">{src.base_url}</span>
                </div>
                <span className="shrink-0 px-stack-xs py-stack-3xs rounded-full text-xs font-semibold bg-sb-good/10 text-sb-good border border-sb-good/30">
                  Aktif
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
