import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Compass,
  Database,
  FileText,
  Home,
  Menu,
  X,
} from 'lucide-react';
import {
  CVProfile,
  INITIAL_JOBS,
  JobListing,
  JobTrackingEntry,
  LearningPlanItem,
  RoleCategory,
  SAMPLE_CV_PROFILES,
  calculateMarketSkillInsights,
} from './data/skillBridgeData';
import { LandingView } from './components/LandingView';
import { OnboardingCVView } from './components/OnboardingCVView';
import { JobExplorerView } from './components/JobExplorerView';
import { MarketInsightsView } from './components/MarketInsightsView';
import { MyProgressView } from './components/MyProgressView';
import { AdminImportView } from './components/AdminImportView';

type NavTab = 'landing' | 'cv' | 'jobs' | 'insights' | 'progress' | 'admin';

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'landing', label: 'Beranda', icon: Home },
  { id: 'cv', label: 'Analisis CV', icon: FileText },
  { id: 'jobs', label: 'Lowongan', icon: Briefcase },
  { id: 'insights', label: 'Insight Skill', icon: BarChart3 },
  { id: 'progress', label: 'Progres', icon: BookOpen },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cvProfiles, setCvProfiles] = useState<CVProfile[]>(SAMPLE_CV_PROFILES);
  const [activeCVId, setActiveCVId] = useState(SAMPLE_CV_PROFILES[0].id);
  const [jobs, setJobs] = useState<JobListing[]>(INITIAL_JOBS);
  const [selectedRole, setSelectedRole] = useState<RoleCategory>('Data Analyst');
  const [explorerRoleFilter, setExplorerRoleFilter] = useState<
    RoleCategory | 'Semua Role'
  >('Data Analyst');
  const [selectedWorkType, setSelectedWorkType] = useState('Semua Tipe');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    INITIAL_JOBS[0].id
  );
  const [savedJobIds, setSavedJobIds] = useState(['job-da-01', 'job-da-02']);
  const [jobTracking, setJobTracking] = useState<Record<string, JobTrackingEntry>>({
    'job-da-01': { stage: 'Akan Dilamar', priority: 5 },
    'job-da-02': { stage: 'Tersimpan', priority: 3 },
  });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [learningPlan, setLearningPlan] = useState<LearningPlanItem[]>([
    {
      id: 'plan-dataviz-data-analyst',
      skillId: 'dataviz',
      addedFromRole: 'Data Analyst',
      progress: 'Sedang Dipelajari',
      targetNote: 'Menyusun dashboard analisis penjualan di Tableau Public.',
      updatedAt: '2 November 2026',
    },
  ]);

  const activeCV = useMemo(
    () => cvProfiles.find((profile) => profile.id === activeCVId) || cvProfiles[0],
    [cvProfiles, activeCVId]
  );

  useEffect(() => {
    const handleFeedback = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      setFeedbackMessage(message);
      window.setTimeout(() => setFeedbackMessage(''), 2400);
    };
    window.addEventListener('skillbridge-feedback', handleFeedback);
    return () =>
      window.removeEventListener('skillbridge-feedback', handleFeedback);
  }, []);

  const marketInsights = useMemo(
    () =>
      calculateMarketSkillInsights(
        jobs.filter((job) => job.roleCategory === selectedRole),
        activeCV
      ),
    [jobs, selectedRole, activeCV]
  );

  const navigateTo = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateActiveCV = (updated: CVProfile) => {
    setCvProfiles((profiles) =>
      profiles.map((profile) => (profile.id === updated.id ? updated : profile))
    );
    if (updated.targetRole !== selectedRole) {
      setSelectedRole(updated.targetRole);
      setExplorerRoleFilter(updated.targetRole);
    }
  };

  const selectSampleCV = (cvId: string) => {
    setActiveCVId(cvId);
    const selected = cvProfiles.find((profile) => profile.id === cvId);
    if (selected) setSelectedRole(selected.targetRole);
  };

  const selectRole = (role: RoleCategory) => {
    setSelectedRole(role);
    setExplorerRoleFilter(role);
    const firstJob = jobs.find((job) => job.roleCategory === role);
    if (firstJob) setSelectedJobId(firstJob.id);
  };

  const toggleSavedJob = (jobId: string) => {
    setSavedJobIds((ids) =>
      ids.includes(jobId) ? ids.filter((id) => id !== jobId) : [...ids, jobId]
    );
    setJobTracking((current) =>
      current[jobId]
        ? current
        : { ...current, [jobId]: { stage: 'Tersimpan', priority: 3 } }
    );
  };

  const addToLearningPlan = (skillId: string, role: RoleCategory) => {
    if (
      learningPlan.some(
        (item) => item.skillId === skillId && item.addedFromRole === role
      )
    )
      return;
    setLearningPlan((items) => [
      ...items,
      {
        id: `plan-${skillId}-${role.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        skillId,
        addedFromRole: role,
        progress: 'Belum Mulai',
        targetNote: '',
        updatedAt: 'Baru ditambahkan',
      },
    ]);
  };

  const updateLearningProgress = (
    itemId: string,
    progress: LearningPlanItem['progress']
  ) => {
    setLearningPlan((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, progress, updatedAt: '2 November 2026' }
          : item
      )
    );
  };

  const updateLearningNote = (itemId: string, targetNote: string) => {
    setLearningPlan((items) =>
      items.map((item) => (item.id === itemId ? { ...item, targetNote } : item))
    );
  };

  return (
    <div className="app-shell min-h-screen flex flex-col text-slate-900">
      <header className="glass-header sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-[76px] max-w-[1380px] items-center justify-between gap-8 px-7 sm:px-12 lg:px-20 xl:px-24">
          <button
            type="button"
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <span className="gradient-button flex h-9 w-9 items-center justify-center rounded-xl text-white">
              <Compass className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">
              Skill<span className="text-[#3f5fbf]">Bridge</span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`relative inline-flex items-center gap-1.5 py-2 text-sm font-semibold transition-colors cursor-pointer after:absolute after:inset-x-0 after:-bottom-[19px] after:h-0.5 after:transition-colors ${
                    active
                      ? 'text-[#304a9f] after:bg-[#3f5fbf]'
                      : 'text-slate-600 after:bg-transparent hover:text-slate-950'
                  }`}
                >
                  {item.label}
                  {item.id === 'progress' && savedJobIds.length + learningPlan.length > 0 && (
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                        active ? 'bg-[#e8eef8] text-[#4444bb]' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {savedJobIds.length + learningPlan.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center">
            <button
              type="button"
              onClick={() => navigateTo('cv')}
              className="gradient-button rounded-full px-5 py-3 text-sm font-bold cursor-pointer"
            >
              Mulai analisis
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label="Buka menu"
            className="rounded-lg border border-slate-200 p-2 text-slate-800 lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white p-4 lg:hidden">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                      activeTab === item.id
                        ? 'bg-[#3f5fbf] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Database className="h-4 w-4" />
                Admin
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div key={activeTab} className="page-transition">
        {activeTab === 'landing' && (
          <LandingView
            activeCV={activeCV}
            selectedRole={selectedRole}
            onSelectRole={selectRole}
            selectedWorkType={selectedWorkType}
            onSelectWorkType={setSelectedWorkType}
            onSelectSampleCV={selectSampleCV}
            onNavigate={navigateTo}
            onOpenJobDetail={setSelectedJobId}
            jobs={jobs}
            marketInsights={marketInsights}
          />
        )}

        {activeTab === 'cv' && (
          <OnboardingCVView
            activeCV={activeCV}
            onUpdateCV={updateActiveCV}
            onSelectSampleCV={selectSampleCV}
            onNavigate={navigateTo}
          />
        )}

        {activeTab === 'jobs' && (
          <JobExplorerView
            jobs={jobs}
            activeCV={activeCV}
            onSelectSampleCV={selectSampleCV}
            onUpdateCV={updateActiveCV}
            selectedRole={explorerRoleFilter}
            onSelectRole={(role) => {
              setExplorerRoleFilter(role);
              if (role !== 'Semua Role') setSelectedRole(role);
            }}
            selectedWorkType={selectedWorkType}
            onSelectWorkType={setSelectedWorkType}
            selectedJobId={selectedJobId}
            onSelectJobId={setSelectedJobId}
            savedJobIds={savedJobIds}
            onToggleSaveJob={toggleSavedJob}
            learningPlan={learningPlan}
            onAddToLearningPlan={addToLearningPlan}
            onNavigate={navigateTo}
          />
        )}

        {activeTab === 'insights' && (
          <MarketInsightsView
            jobs={jobs}
            activeCV={activeCV}
            onUpdateCV={updateActiveCV}
            selectedRole={selectedRole}
            onSelectRole={(role) => {
              setSelectedRole(role);
              setExplorerRoleFilter(role);
            }}
            learningPlan={learningPlan}
            onAddToLearningPlan={addToLearningPlan}
            onNavigate={navigateTo}
          />
        )}

        {activeTab === 'progress' && (
          <MyProgressView
            activeCV={activeCV}
            onUpdateCV={updateActiveCV}
            jobs={jobs}
            savedJobIds={savedJobIds}
            jobTracking={jobTracking}
            onUpdateJobTracking={(jobId, entry) =>
              setJobTracking((current) => ({ ...current, [jobId]: entry }))
            }
            onToggleSaveJob={toggleSavedJob}
            onOpenJobDetail={setSelectedJobId}
            learningPlan={learningPlan}
            onUpdateLearningProgress={updateLearningProgress}
            onUpdateLearningNote={updateLearningNote}
            onAddToLearningPlan={addToLearningPlan}
            onRemoveFromLearningPlan={(itemId) =>
              setLearningPlan((items) => items.filter((item) => item.id !== itemId))
            }
            onNavigate={navigateTo}
          />
        )}

        {activeTab === 'admin' && (
          <AdminImportView
            jobs={jobs}
            onAddJob={(job) => setJobs((items) => [job, ...items])}
            onUpdateJob={(updated) =>
              setJobs((items) =>
                items.map((job) => (job.id === updated.id ? updated : job))
              )
            }
            onDuplicateJob={(jobId) => {
              const original = jobs.find((job) => job.id === jobId);
              if (!original) return;
              setJobs((items) => [
                {
                  ...original,
                  id: `${original.id}-copy-${Date.now()}`,
                  title: `${original.title} (Salinan)`,
                },
                ...items,
              ]);
            }}
            onDeleteJob={(jobId) =>
              setJobs((items) => items.filter((job) => job.id !== jobId))
            }
          />
        )}
        </div>
      </main>

      {feedbackMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#17172b] px-5 py-3 text-sm font-semibold text-white shadow-2xl"
        >
          {feedbackMessage}
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-4 px-7 py-8 sm:px-12 md:flex-row md:items-center md:justify-between lg:px-20 xl:px-24">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Compass className="h-4 w-4" />
            </span>
            <span className="font-extrabold text-slate-950">SkillBridge</span>
          </div>
          <p className="max-w-xl text-xs leading-5 text-slate-500">
            Skor kecocokan adalah estimasi berdasarkan informasi yang tertulis di CV, bukan
            jaminan hasil rekrutmen.
          </p>
          <button
            type="button"
            onClick={() => navigateTo('admin')}
            className="text-left text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            Admin
          </button>
        </div>
      </footer>
    </div>
  );
}
