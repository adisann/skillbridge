import { Button } from "@/components/ui/button";
import { TextInput, Select, Textarea } from "@/components/ui/input";
import { EDUCATION_OPTIONS, ROLE_OPTIONS, SENIORITY_OPTIONS } from "@/lib/admin-jobs";
import type { JobFormValues } from "@/types/admin";
import { ModalFooter, ModalHeader, ModalShell } from "./modal-shell";

interface JobFormModalProps {
  title: string;
  values: JobFormValues;
  onChange: (values: JobFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  /** Hanya form tambah yang menyimpan tautan sumber asli. */
  showSourceUrl?: boolean;
}

export function JobFormModal({
  title,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  submitLabel,
  submittingLabel,
  showSourceUrl = false,
}: JobFormModalProps) {
  const set = (field: keyof JobFormValues) => (e: { target: { value: string } }) =>
    onChange({ ...values, [field]: e.target.value });

  return (
    <ModalShell size="form">
      <ModalHeader onClose={onClose}>
        <h3 className="text-lg font-bold text-sb-navy">{title}</h3>
      </ModalHeader>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput
            label="Judul Pekerjaan *"
            placeholder="cth. Data Analyst Senior"
            value={values.title}
            onChange={set("title")}
            required
          />
          <TextInput
            label="Nama Perusahaan *"
            placeholder="cth. Bank Mandiri Digital"
            value={values.company}
            onChange={set("company")}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput label="Lokasi" value={values.location} onChange={set("location")} />
          <Select label="Role Target" value={values.role} onChange={set("role")} options={ROLE_OPTIONS} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Senioritas" value={values.seniority} onChange={set("seniority")} options={SENIORITY_OPTIONS} />
          <TextInput
            label="Min Pengalaman (Tahun)"
            type="number"
            value={values.experience}
            onChange={set("experience")}
          />
          <Select label="Pendidikan" value={values.education} onChange={set("education")} options={EDUCATION_OPTIONS} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput
            label="Skill Wajib (Pisahkan koma)"
            value={values.requiredSkills}
            onChange={set("requiredSkills")}
            placeholder="SQL, Python, Excel"
          />
          <TextInput
            label="Skill Tambahan (Pisahkan koma)"
            value={values.preferredSkills}
            onChange={set("preferredSkills")}
            placeholder="Tableau, Power BI"
          />
        </div>

        {showSourceUrl && (
          <div>
            <TextInput
              label="Tautan Sumber Asli (Source URL)"
              value={values.sourceUrl}
              onChange={set("sourceUrl")}
              placeholder="https://... (Kosongkan jika dari flyer fisik/poster)"
            />
            <p className="mt-1 text-[11px] text-sb-text-2">
              Biarkan kosong jika lowongan berasal dari poster / flyer cetak tanpa tautan web.
            </p>
          </div>
        )}

        <Textarea
          label="Deskripsi Lengkap Lowongan *"
          rows={4}
          value={values.description}
          onChange={set("description")}
          placeholder="Tuliskan tanggung jawab dan kualifikasi lowongan..."
          required
        />

        <ModalFooter>
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
