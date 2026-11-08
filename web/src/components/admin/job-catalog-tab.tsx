import { useState } from "react";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES, getCategoryFromTitle } from "@/lib/job-categories";
import type { AdminJob } from "@/types/admin";
interface JobCatalogTabProps {
  jobs: AdminJob[];
  onEdit: (job: AdminJob) => void;
  onDuplicate: (job: AdminJob) => void;
  onDelete: (job: AdminJob) => void;
}
export function JobCatalogTab({jobs,onEdit,onDuplicate,onDelete}: JobCatalogTabProps) {
  const [query,setQuery] = useState("");
  const [source,setSource] = useState("");
  const [category,setCategory] = useState("");
  const [status,setStatus] = useState("");
  const [page,setPage] = useState(1);
  const filtered = jobs.filter(j => `${j.title} ${j.company}`.toLowerCase().includes(query.trim().toLowerCase()) && (!source || j.sourceName === source) && (!category || getCategoryFromTitle(j.title,j.canonicalTitle).slug === category) && (!status || String(j.isActive) === status));
  const pages = Math.max(1,Math.ceil(filtered.length/20));
  const current = Math.min(page,pages);
  const reset = () => {setQuery("");setSource("");setCategory("");setStatus("");setPage(1);};
  const inputClass = "mt-1 w-full min-w-0 rounded-xl border border-sb-border bg-white p-2.5 text-sm";
  return <section aria-label="Katalog lowongan" className="space-y-4 min-w-0">
    <div className="rounded-2xl border border-sb-border bg-white p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <label className="text-xs font-semibold">Cari lowongan<input className={inputClass} placeholder="Judul atau perusahaan" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} /></label>
      <label className="text-xs font-semibold">Sumber<select className={inputClass} value={source} onChange={e=>{setSource(e.target.value);setPage(1);}}><option value="">Semua sumber</option>{[...new Set(jobs.map(j=>j.sourceName))].sort().map(s=><option key={s}>{s}</option>)}</select></label>
      <label className="text-xs font-semibold">Bidang<select className={inputClass} value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}><option value="">Semua bidang</option>{JOB_CATEGORIES.map(c=><option key={c.slug} value={c.slug}>{c.label}</option>)}</select></label>
      <label className="text-xs font-semibold">Status<select className={inputClass} value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">Semua status</option><option value="true">Aktif</option><option value="false">Nonaktif</option></select></label>
    </div>
    <div className="flex items-center justify-between gap-2"><p role="status" className="text-sm text-sb-text-2">{filtered.length} dari {jobs.length} lowongan</p><Button variant="ghost" size="sm" onClick={reset}>Reset filter</Button></div>
    <div className="rounded-2xl border border-sb-border overflow-hidden bg-white">
      <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] gap-4 px-4 py-3 bg-sb-mist-soft text-xs font-bold"><span>Lowongan / perusahaan</span><span>Sumber / status</span><span>Tindakan</span></div>
      {filtered.slice((current-1)*20,current*20).map(j=><article key={j.id} className="p-4 border-b border-sb-border last:border-0 grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] gap-3 md:items-center">
        <div className="min-w-0"><h2 className="font-bold text-sm text-sb-navy break-words">{j.title}</h2><p className="text-sm text-sb-text-2 break-words">{j.company}</p><p className="text-xs text-sb-text-2 mt-1 break-words">{j.location || "Lokasi belum diketahui"} · {j.canonicalTitle || "Role belum diketahui"}</p></div>
        <div className="text-xs space-y-1"><p className="font-semibold">{j.sourceName}</p><p>{j.isActive ? "Aktif" : "Nonaktif"}</p></div>
        <div className="flex flex-wrap gap-1"><Button variant="outline" size="sm" onClick={()=>onEdit(j)}>Edit</Button><Button variant="ghost" size="sm" onClick={()=>onDuplicate(j)}>Duplikasi</Button><Button variant="ghost" size="sm" className="text-rose-700" onClick={()=>onDelete(j)}>Hapus</Button></div>
      </article>)}
      {!filtered.length && <div className="p-8 text-center"><h2 className="font-bold">Lowongan tidak ditemukan</h2><p className="text-sm text-sb-text-2 mt-2">Coba kata pencarian lain atau reset filter.</p></div>}
    </div>
    <nav aria-label="Halaman katalog" className="flex flex-wrap items-center justify-between gap-2"><Button variant="outline" size="sm" disabled={current===1} onClick={()=>setPage(current-1)}>Sebelumnya</Button><span className="text-xs">Halaman {current} dari {pages}</span><Button variant="outline" size="sm" disabled={current===pages} onClick={()=>setPage(current+1)}>Berikutnya</Button></nav>
  </section>;
}
