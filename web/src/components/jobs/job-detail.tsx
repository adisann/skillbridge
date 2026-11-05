"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { JobChatAssistant } from "@/components/jobs/job-chat-assistant";
import { JobDetailHeader } from "@/components/jobs/job-detail-header";
import { GuestLoginPrompt, GuestRequirementsCard } from "@/components/jobs/job-detail-guest";
import { ScoreBreakdownCard } from "@/components/jobs/score-breakdown-card";
import { RequirementsAnalysisCard } from "@/components/jobs/requirements-analysis-card";
import { MatchFactors } from "@/components/jobs/match-factors";
import { useAuth } from "@/lib/supabase/auth-context";
import { useJobDetail } from "@/lib/hooks/use-job-detail";
import { formatJobDescription, resolveRequirementEvaluations } from "@/lib/job-detail";

interface JobDetailProps {
  jobId: string;
  mode?: "guest" | "user";
}

export function JobDetail({ jobId, mode = "user" }: JobDetailProps) {
  const isGuest = mode === "guest";
  const router = useRouter();
  const { user } = useAuth();
  const { job, isLoading, isSaved, errorMsg, toggleSave } = useJobDetail(jobId, isGuest);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const backUrl = isGuest ? "/lowongan" : "/jobs";

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-6 w-32 bg-sb-mist-soft animate-pulse rounded-md" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (errorMsg || !job) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          title={errorMsg || "Lowongan Tidak Ditemukan"}
          description="Lowongan mungkin telah kedaluwarsa atau URL yang dimasukkan salah."
          actionLabel="Kembali ke Daftar Lowongan"
          onAction={() => router.push(backUrl)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 space-y-8">
      <div>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sb-text-2 hover:text-sb-blue transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Lowongan</span>
        </Link>
      </div>

      <JobDetailHeader
        job={job}
        isGuest={isGuest}
        isSaved={isSaved}
        onToggleSave={toggleSave}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {isGuest ? (
        <>
          <GuestLoginPrompt jobId={job.id} />
          <GuestRequirementsCard job={job} />
        </>
      ) : (
        <>
          {job.scoreBreakdown && job.scoreBreakdown.length > 0 && <ScoreBreakdownCard breakdown={job.scoreBreakdown} />}
          <RequirementsAnalysisCard evaluations={resolveRequirementEvaluations(job)} />
          <MatchFactors supporting={job.factorsSupporting || []} limiting={job.factorsLimiting || []} />
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Deskripsi Pekerjaan Asli</CardTitle>
          <CardDescription>
            Kualifikasi dan tanggung jawab posisi yang dipublikasikan oleh pihak rekruter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-sb-text-2 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
            {formatJobDescription(job.description)}
          </div>
        </CardContent>
      </Card>

      {!isGuest && (
        <JobChatAssistant
          key={`${job.id}-${user?.id || "anon"}`}
          jobId={job.id}
          jobTitle={job.title}
          company={job.company}
          userId={user?.id}
          isOpen={isChatOpen}
          onOpenChange={setIsChatOpen}
        />
      )}
    </div>
  );
}
