"use client";

import { useState } from "react";
import { AlertBanner } from "@/components/ui/error";
import { SkeletonTable } from "@/components/ui/loading";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { JobCatalogTab } from "@/components/admin/job-catalog-tab";
import { SkillTaxonomyTab } from "@/components/admin/skill-taxonomy-tab";
import { WorkerRunsTab } from "@/components/admin/worker-runs-tab";
import { JobFormModal } from "@/components/admin/job-form-modal";
import { ImportUrlModal } from "@/components/admin/import-url-modal";
import { ImportOcrModal } from "@/components/admin/import-ocr-modal";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useAdminJobActions } from "@/lib/hooks/use-admin-job-actions";
import type { AdminTab } from "@/types/admin";

const NOTIFICATION_TITLES = { success: "Berhasil", error: "Gagal", info: "Informasi" } as const;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("jobs");
  const { jobs, runs, skills, sources, isLoading, notification, setNotification, refetch } = useAdminData();
  const actions = useAdminJobActions({ refetch, notify: setNotification });
  const { add, edit, url, ocr } = actions;

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AdminHeader
          isSubmitting={actions.isSubmitting}
          onImportUrl={() => url.setShow(true)}
          onImportOcr={() => ocr.setShow(true)}
          onAddManual={() => add.setShow(true)}
          onImportCsv={actions.importCsv}
        />

        {notification && (
          <AlertBanner
            type={notification.type}
            title={NOTIFICATION_TITLES[notification.type]}
            message={notification.message}
          />
        )}

        <AdminTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          counts={{ jobs: jobs.length, skills: skills.length, runs: runs.length }}
        />

        {isLoading ? (
          <div className="space-y-4 py-8">
            <SkeletonTable rows={5} />
          </div>
        ) : (
          <>
            {activeTab === "jobs" && (
              <JobCatalogTab
                jobs={jobs}
                onEdit={edit.open}
                onDuplicate={actions.duplicateJob}
                onDelete={actions.deleteJob}
              />
            )}
            {activeTab === "skills" && (
              <SkillTaxonomyTab skills={skills} sources={sources} notify={setNotification} onChanged={refetch} />
            )}
            {activeTab === "runs" && (
              <WorkerRunsTab runs={runs} isSubmitting={actions.isSubmitting} onTrigger={actions.triggerWorker} />
            )}
          </>
        )}

        {add.show && (
          <JobFormModal
            title="Tambah Lowongan Manual (Pipeline Processing)"
            values={add.form}
            onChange={add.setForm}
            onSubmit={add.submit}
            onClose={() => add.setShow(false)}
            isSubmitting={actions.isSubmitting}
            submitLabel="Simpan ke Katalog Lowongan"
            submittingLabel="Menyimpan & Memproses Pipeline..."
            showSourceUrl
          />
        )}

        {url.show && (
          <ImportUrlModal isExtracting={url.isExtracting} onSubmit={url.submit} onClose={() => url.setShow(false)} />
        )}

        {ocr.show && (
          <ImportOcrModal isExtracting={ocr.isExtracting} onSubmit={ocr.submit} onClose={() => ocr.setShow(false)} />
        )}

        {edit.show && (
          <JobFormModal
            title="Edit Lowongan Pekerjaan"
            values={edit.form}
            onChange={edit.setForm}
            onSubmit={edit.submit}
            onClose={() => edit.setShow(false)}
            isSubmitting={actions.isSubmitting}
            submitLabel="Simpan Perubahan Lowongan"
            submittingLabel="Menyimpan Perubahan..."
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
