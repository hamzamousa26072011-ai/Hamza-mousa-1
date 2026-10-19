import React, { useState, useMemo } from "react";
import { 
  Compass, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  AlertCircle,
  Check,
  RotateCcw,
  Globe,
  CheckCircle2
} from "lucide-react";
import { StudyApp } from "../types";

interface StudyAppsTabProps {
  apps?: StudyApp[];
  customApps?: StudyApp[];
  onAddApp: (newApp: Omit<StudyApp, "id">) => void;
  onEditApp?: (updatedApp: StudyApp) => void;
  onDeleteApp: (id: string) => void;
  themeMode?: "light" | "dark";
  currentUser?: any;
  appSavedNotice?: string | null;
  onResetDefaults?: () => void;
  onOpenLoginModal?: () => void;
}

interface CuratedApp extends Omit<StudyApp, "logoColor"> {
  category: "Notes & Revision" | "Flashcards" | "Past Papers" | "Planning" | "Reference" | "Custom";
  badge?: string;
  desc: string;
  logo?: string;
  logoColor?: string;
  isCustom?: boolean;
}

const CURATED_APPS: CuratedApp[] = [
  {
    id: "pmt",
    name: "Physics & Maths Tutor",
    desc: "Past papers by topic, revision notes, mark schemes, and flashcards for IGCSE and A-Level.",
    url: "https://www.physicsandmathstutor.com",
    logo: "https://www.google.com/s2/favicons?domain=physicsandmathstutor.com&sz=128",
    isCustom: false,
    category: "Past Papers",
    badge: "Past Papers"
  },
  {
    id: "savemyexams",
    name: "Save My Exams",
    desc: "Syllabus-specific revision notes, topic questions, and model answers for Cambridge & Edexcel.",
    url: "https://www.savemyexams.com",
    logo: "https://www.google.com/s2/favicons?domain=savemyexams.com&sz=128",
    isCustom: false,
    category: "Notes & Revision",
    badge: "Syllabus Notes"
  },
  {
    id: "papacambridge",
    name: "PapaCambridge",
    desc: "Complete archive of Cambridge IGCSE, O-Level, and AS/A-Level question papers and mark schemes.",
    url: "https://papacambridge.com",
    logo: "https://www.google.com/s2/favicons?domain=papacambridge.com&sz=128",
    isCustom: false,
    category: "Past Papers",
    badge: "Exam Archive"
  },
  {
    id: "znotes",
    name: "ZNotes",
    desc: "Concise, student-written revision summaries and topical notes for Cambridge IGCSE exams.",
    url: "https://znotes.org",
    logo: "https://www.google.com/s2/favicons?domain=znotes.org&sz=128",
    isCustom: false,
    category: "Notes & Revision",
    badge: "Concise Notes"
  },
  {
    id: "anki",
    name: "AnkiWeb",
    desc: "Spaced repetition flashcard system for long-term retention of formulas, definitions, and vocabulary.",
    url: "https://ankiweb.net",
    logo: "https://www.google.com/s2/favicons?domain=ankiweb.net&sz=128",
    isCustom: false,
    category: "Flashcards",
    badge: "Active Recall"
  },
  {
    id: "quizlet",
    name: "Quizlet",
    desc: "Study sets, interactive flashcards, and practice tests for languages and sciences.",
    url: "https://quizlet.com",
    logo: "https://www.google.com/s2/favicons?domain=quizlet.com&sz=128",
    isCustom: false,
    category: "Flashcards",
    badge: "Flashcards"
  },
  {
    id: "desmos",
    name: "Desmos Graphing Calculator",
    desc: "Interactive function plotting and coordinate geometry visualizer for Mathematics.",
    url: "https://www.desmos.com/calculator",
    logo: "https://www.google.com/s2/favicons?domain=desmos.com&sz=128",
    isCustom: false,
    category: "Reference",
    badge: "Mathematics"
  },
  {
    id: "notion",
    name: "Notion",
    desc: "Structured workspace for organizing syllabus checklists, lecture notes, and revision timetables.",
    url: "https://www.notion.so",
    logo: "https://www.google.com/s2/favicons?domain=notion.so&sz=128",
    isCustom: false,
    category: "Planning",
    badge: "Organization"
  }
];

const CATEGORIES = ["All", "Past Papers", "Notes & Revision", "Flashcards", "Reference", "Planning", "Custom"] as const;

export default function StudyAppsTab({
  apps = [],
  customApps = [],
  onAddApp,
  onDeleteApp,
  themeMode = "dark",
  appSavedNotice
}: StudyAppsTabProps) {
  const isLight = themeMode === "light";
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppUrl, setNewAppUrl] = useState("");
  const [newAppDesc, setNewAppDesc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteApp, setConfirmDeleteApp] = useState<CuratedApp | null>(null);

  const userSavedApps = apps.length > 0 ? apps : customApps;

  const allApps: CuratedApp[] = useMemo(() => {
    const customMapped: CuratedApp[] = userSavedApps.map((app) => {
      let domain = "";
      try {
        const u = new URL(/^https?:\/\//i.test(app.url) ? app.url : `https://${app.url}`);
        domain = u.hostname;
      } catch {}
      return {
        ...app,
        desc: (app as any).desc || `External bookmark (${domain || app.url})`,
        logo: (app as any).logo || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : ""),
        isCustom: true,
        category: "Custom" as const,
        badge: "Saved Bookmark"
      };
    });
    return [...customMapped, ...CURATED_APPS];
  }, [userSavedApps]);

  const filteredApps = useMemo(() => {
    return allApps.filter((app) => {
      const matchesCategory =
        selectedCategory === "All" ||
        app.category === selectedCategory ||
        (selectedCategory === "Custom" && app.isCustom);

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.desc.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [allApps, selectedCategory, searchQuery]);

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = newAppName.trim();
    let trimmedUrl = newAppUrl.trim();

    if (!trimmedName) {
      setFormError("Please enter a resource name.");
      return;
    }

    if (!trimmedUrl) {
      setFormError("Please enter a valid website URL.");
      return;
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (!parsed.hostname.includes(".")) {
        setFormError("Please enter a complete web address (e.g., https://savemyexams.com).");
        return;
      }
    } catch {
      setFormError("Please enter a valid web address (e.g., https://savemyexams.com).");
      return;
    }

    onAddApp({
      name: trimmedName,
      url: trimmedUrl,
      logoColor: "#5F55C8",
      ...(newAppDesc.trim() ? { desc: newAppDesc.trim() } : {})
    } as any);

    setNewAppName("");
    setNewAppUrl("");
    setNewAppDesc("");
    setIsAddModalOpen(false);
  };

  const getSafeHref = (rawUrl: string): string | null => {
    try {
      const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      const u = new URL(normalized);
      if (u.protocol === "http:" || u.protocol === "https:") {
        return u.toString();
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <header
        className={`rounded-2xl border p-6 ${
          isLight
            ? "bg-[#FFFFFF] border-[#E2E6EE] shadow-[0_1px_3px_rgba(24,32,43,0.04)]"
            : "bg-[#191E28] border-[#2B3344]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium mb-1">
              <Compass size={14} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
              <span className={isLight ? "text-[#596474]" : "text-[#B7C0CF]"}>
                Academic Directory
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
              Study Resources & Links
            </h1>
            <p className={`text-sm mt-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              Curated past paper archives, syllabus revision notes, and your personal study bookmarks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer shrink-0 ${
              isLight
                ? "bg-[#5F55C8] hover:bg-[#4E45B0] text-white shadow-xs"
                : "bg-[#5F55C8] hover:bg-[#7066D8] text-white"
            }`}
          >
            <Plus size={16} />
            <span>Add Custom Link</span>
          </button>
        </div>

        {appSavedNotice && (
          <div
            role="status"
            className={`mt-4 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              isLight
                ? "bg-[#E9F7EF] border-[#B7E4C7] text-[#1F7A4C]"
                : "bg-[#143024] border-[#1F7A4C]/40 text-[#4ADE80]"
            }`}
          >
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{appSavedNotice}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className={`mt-6 pt-5 border-t flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
          isLight ? "border-[#EDF0F5]" : "border-[#2B3344]"
        }`}>
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" role="tablist" aria-label="Resource categories">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              const count = cat === "All"
                ? allApps.length
                : cat === "Custom"
                ? userSavedApps.length
                : allApps.filter((a) => a.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? isLight
                        ? "bg-[#5F55C8] text-white shadow-2xs"
                        : "bg-[#A99BFF] text-[#10131A]"
                      : isLight
                      ? "bg-[#F6F7FA] text-[#596474] hover:text-[#18202B] hover:bg-[#ECEFF5]"
                      : "bg-[#222938] text-[#B7C0CF] hover:text-[#F1F3F8]"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                    active
                      ? isLight ? "bg-white/20 text-white" : "bg-black/15 text-[#10131A]"
                      : isLight ? "bg-[#E2E6EE] text-[#596474]" : "bg-[#191E28] text-[#8590A2]"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? "text-[#7A8699]" : "text-[#8590A2]"}`} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              aria-label="Search study resources"
              className={`w-full min-h-[40px] pl-9 pr-8 py-2 rounded-xl border text-sm transition focus:outline-none ${
                isLight
                  ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B] placeholder-[#7A8699] focus:bg-white focus:border-[#5F55C8]"
                  : "bg-[#10131A] border-[#2B3344] text-[#F1F3F8] placeholder-[#8590A2] focus:border-[#A99BFF]"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md cursor-pointer ${
                  isLight ? "text-[#596474] hover:bg-[#E2E6EE]" : "text-[#8590A2] hover:bg-[#222938]"
                }`}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Resource Cards Grid */}
      {filteredApps.length === 0 ? (
        <div
          className={`rounded-2xl border p-10 text-center ${
            isLight ? "bg-[#FFFFFF] border-[#E2E6EE]" : "bg-[#191E28] border-[#2B3344]"
          }`}
        >
          <Compass size={32} className={`mx-auto mb-3 ${isLight ? "text-[#7A8699]" : "text-[#8590A2]"}`} />
          <h2 className={`text-base font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
            No study resources match your filter
          </h2>
          <p className={`text-sm mt-1 max-w-md mx-auto ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
            {selectedCategory === "Custom"
              ? "You haven't added any custom links yet. Add your school portal, syllabus PDF, or favorite study site."
              : "Try clearing your search query or switching to All categories."}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {selectedCategory === "Custom" ? (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#5F55C8] hover:bg-[#4E45B0] text-white transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Custom Link</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                  isLight
                    ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B] hover:bg-[#ECEFF5]"
                    : "bg-[#222938] border-[#2B3344] text-[#F1F3F8] hover:bg-[#2B3344]"
                }`}
              >
                <RotateCcw size={14} />
                <span>Show All Resources</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => {
            const safeHref = getSafeHref(app.url);
            let hostname = "";
            try {
              if (safeHref) hostname = new URL(safeHref).hostname.replace(/^www\./, "");
            } catch {}

            return (
              <article
                key={app.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition ${
                  isLight
                    ? "bg-[#FFFFFF] border-[#E2E6EE] hover:border-[#5F55C8]/50 shadow-[0_1px_2px_rgba(24,32,43,0.03)]"
                    : "bg-[#191E28] border-[#2B3344] hover:border-[#A99BFF]/40"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden ${
                          isLight ? "bg-[#F6F7FA] border-[#E2E6EE]" : "bg-[#222938] border-[#2B3344]"
                        }`}
                      >
                        {(app as any).logo ? (
                          <img
                            src={(app as any).logo}
                            alt=""
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Globe size={18} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`text-base font-bold truncate ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                          {app.name}
                        </h3>
                        {hostname && (
                          <p className={`text-xs font-mono truncate ${isLight ? "text-[#7A8699]" : "text-[#8590A2]"}`}>
                            {hostname}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${
                          app.isCustom
                            ? isLight
                              ? "bg-[#EFEEFA] border-[#D6D2F6] text-[#5F55C8]"
                              : "bg-[#5F55C8]/15 border-[#A99BFF]/30 text-[#A99BFF]"
                            : isLight
                            ? "bg-[#F6F7FA] border-[#E2E6EE] text-[#596474]"
                            : "bg-[#222938] border-[#2B3344] text-[#B7C0CF]"
                        }`}
                      >
                        {app.badge || app.category}
                      </span>

                      {app.isCustom && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteApp(app)}
                          aria-label={`Remove ${app.name}`}
                          title={`Remove ${app.name}`}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isLight
                              ? "text-[#7A8699] hover:text-[#C93B3B] hover:bg-[#FDECEC]"
                              : "text-[#8590A2] hover:text-[#F87171] hover:bg-[#3A1D24]"
                          }`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className={`text-sm mt-3 leading-relaxed line-clamp-2 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                    {app.desc || "Personal study bookmark."}
                  </p>
                </div>

                <div className={`mt-5 pt-3.5 border-t flex items-center justify-between ${
                  isLight ? "border-[#EDF0F5]" : "border-[#2B3344]"
                }`}>
                  <span className={`text-xs ${isLight ? "text-[#7A8699]" : "text-[#8590A2]"}`}>
                    Opens in new tab
                  </span>

                  {safeHref ? (
                    <a
                      href={safeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                        isLight
                          ? "bg-[#F6F7FA] hover:bg-[#5F55C8] text-[#18202B] hover:text-white border border-[#D0D7E2] hover:border-[#5F55C8]"
                          : "bg-[#222938] hover:bg-[#5F55C8] text-[#F1F3F8] hover:text-white border border-[#2B3344]"
                      }`}
                    >
                      <span>Open Resource</span>
                      <ExternalLink size={13} />
                    </a>
                  ) : (
                    <span className={`text-xs font-medium ${isLight ? "text-[#C93B3B]" : "text-[#F87171]"}`}>
                      Invalid URL
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add Custom Link Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-resource-modal-title"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EE] text-[#18202B]"
                : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8]"
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-inherit">
              <h2 id="add-resource-modal-title" className="text-lg font-bold">
                Add Custom Study Link
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
                className={`p-1.5 rounded-lg cursor-pointer ${
                  isLight ? "text-[#596474] hover:bg-[#F0F2F7]" : "text-[#B7C0CF] hover:bg-[#222938]"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={validateAndSubmit} className="mt-4 space-y-4">
              {formError && (
                <div
                  role="alert"
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    isLight
                      ? "bg-[#FDECEC] border-[#F7C6C6] text-[#C93B3B]"
                      : "bg-[#3A1D24] border-[#C93B3B]/40 text-[#FCA5A5]"
                  }`}
                >
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label htmlFor="custom-app-name" className="block text-xs font-semibold mb-1.5">
                  Resource Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="custom-app-name"
                  type="text"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="e.g., Cambridge Chemistry Syllabus PDF"
                  required
                  className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                    isLight
                      ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B] focus:bg-white focus:border-[#5F55C8]"
                      : "bg-[#10131A] border-[#2B3344] text-[#F1F3F8] focus:border-[#A99BFF]"
                  }`}
                />
              </div>

              <div>
                <label htmlFor="custom-app-url" className="block text-xs font-semibold mb-1.5">
                  Website URL <span className="text-rose-500">*</span>
                </label>
                <input
                  id="custom-app-url"
                  type="text"
                  value={newAppUrl}
                  onChange={(e) => setNewAppUrl(e.target.value)}
                  placeholder="https://www.cambridgeinternational.org"
                  required
                  className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-sm font-mono focus:outline-none ${
                    isLight
                      ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B] focus:bg-white focus:border-[#5F55C8]"
                      : "bg-[#10131A] border-[#2B3344] text-[#F1F3F8] focus:border-[#A99BFF]"
                  }`}
                />
              </div>

              <div>
                <label htmlFor="custom-app-desc" className="block text-xs font-semibold mb-1.5">
                  Short Description <span className={`font-normal ${isLight ? "text-[#7A8699]" : "text-[#8590A2]"}`}>(optional)</span>
                </label>
                <input
                  id="custom-app-desc"
                  type="text"
                  value={newAppDesc}
                  onChange={(e) => setNewAppDesc(e.target.value)}
                  placeholder="e.g., Topic checklists and specimen papers"
                  className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                    isLight
                      ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B] focus:bg-white focus:border-[#5F55C8]"
                      : "bg-[#10131A] border-[#2B3344] text-[#F1F3F8] focus:border-[#A99BFF]"
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isLight
                      ? "bg-white border-[#D0D7E2] text-[#596474] hover:text-[#18202B]"
                      : "bg-[#222938] border-[#2B3344] text-[#B7C0CF] hover:text-[#F1F3F8]"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl text-xs font-semibold bg-[#5F55C8] hover:bg-[#4E45B0] text-white transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Save Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-resource-title"
          onClick={() => setConfirmDeleteApp(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-xl ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EE] text-[#18202B]"
                : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8]"
            }`}
          >
            <h3 id="delete-resource-title" className="text-base font-bold">
              Remove Custom Link?
            </h3>
            <p className={`text-sm mt-2 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              Are you sure you want to remove <strong>{confirmDeleteApp.name}</strong> from your study resources?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteApp(null)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isLight
                    ? "bg-white border-[#D0D7E2] text-[#596474]"
                    : "bg-[#222938] border-[#2B3344] text-[#B7C0CF]"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteApp(confirmDeleteApp.id);
                  setConfirmDeleteApp(null);
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#C93B3B] hover:bg-[#B02E2E] text-white cursor-pointer"
              >
                Remove Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
