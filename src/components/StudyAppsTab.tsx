import React, { useState, useMemo } from "react";
import { 
  Globe, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Edit3, 
  Sparkles, 
  Cloud, 
  HardDrive, 
  Check, 
  LayoutGrid, 
  List, 
  Tag, 
  Compass, 
  AlertTriangle 
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

const COLOR_PALETTE = [
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Sky", hex: "#0EA5E9" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Rose", hex: "#F43F5E" }
];

const QUICK_SUGGESTIONS: Omit<StudyApp, "id">[] = [
  {
    name: "Physics & Maths Tutor",
    url: "https://www.physicsandmathstutor.com",
    category: "Past Papers",
    description: "Past papers, revision notes, and questions by topic for IGCSE & A-Levels",
    logoColor: "#8B5CF6"
  },
  {
    name: "Save My Exams",
    url: "https://www.savemyexams.com",
    category: "Notes & Revision",
    description: "Syllabus-aligned revision notes, model answers, and topic questions",
    logoColor: "#0EA5E9"
  },
  {
    name: "Quizlet",
    url: "https://quizlet.com",
    category: "Flashcards",
    description: "Digital flashcard sets and spaced testing for memory retention",
    logoColor: "#10B981"
  },
  {
    name: "Desmos Graphing",
    url: "https://www.desmos.com/calculator",
    category: "Tools & Math",
    description: "Interactive function plotting and graphing calculator for mathematics",
    logoColor: "#EA580C"
  },
  {
    name: "Notion",
    url: "https://www.notion.so",
    category: "Planning",
    description: "All-in-one workspace for lecture notes and study schedule management",
    logoColor: "#64748B"
  },
  {
    name: "PapaCambridge",
    url: "https://papacambridge.com",
    category: "Past Papers",
    description: "Complete past paper archive with mark schemes for Cambridge examinations",
    logoColor: "#F59E0B"
  }
];

export default function StudyAppsTab({
  apps = [],
  customApps = [],
  onAddApp,
  onEditApp,
  onDeleteApp,
  themeMode = "dark",
  currentUser,
  appSavedNotice,
  onOpenLoginModal
}: StudyAppsTabProps) {
  const isLight = themeMode === "light";

  // Active theme accents:
  // Dark mode -> Purple palette (#8B5CF6 / #7C3AED / #C084FC)
  // Light mode -> Orange palette (#EA580C / #C2410C / #F97316 / #FFF7ED)
  const primaryColor = isLight ? "#EA580C" : "#8B5CF6";
  const primaryHoverColor = isLight ? "#C2410C" : "#7C3AED";

  const userApps = apps.length > 0 ? apps : customApps;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<StudyApp | null>(null);
  const [deletePendingApp, setDeletePendingApp] = useState<StudyApp | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState(isLight ? "#EA580C" : "#8B5CF6");
  const [formError, setFormError] = useState<string | null>(null);

  // Available categories derived dynamically from user's apps
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    userApps.forEach((app) => {
      if (app.category && app.category.trim()) {
        set.add(app.category.trim());
      }
    });
    return ["All", ...Array.from(set)];
  }, [userApps]);

  // Filtered apps based on search & category
  const filteredApps = useMemo(() => {
    return userApps.filter((app) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.category && app.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All" ||
        (app.category && app.category.trim().toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [userApps, searchQuery, selectedCategory]);

  const sanitizeUrl = (input: string): string => {
    let trimmed = input.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  };

  const getDomain = (urlStr: string): string => {
    try {
      const u = new URL(sanitizeUrl(urlStr));
      return u.hostname.replace(/^www\./, "");
    } catch {
      return urlStr.replace(/^https?:\/\//i, "").replace(/^www\./, "");
    }
  };

  const getFaviconUrl = (urlStr: string): string => {
    const domain = getDomain(urlStr);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  };

  const openAddModal = () => {
    setEditingApp(null);
    setFormName("");
    setFormUrl("");
    setFormCategory("");
    setFormDescription("");
    setFormColor(isLight ? "#EA580C" : "#8B5CF6");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (app: StudyApp) => {
    setEditingApp(app);
    setFormName(app.name);
    setFormUrl(app.url);
    setFormCategory(app.category || "");
    setFormDescription(app.description || "");
    setFormColor(app.logoColor || (isLight ? "#EA580C" : "#8B5CF6"));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Please provide an app or website name.");
      return;
    }
    if (!formUrl.trim()) {
      setFormError("Please provide a website link/URL.");
      return;
    }

    const cleanUrl = sanitizeUrl(formUrl);

    if (editingApp && onEditApp) {
      onEditApp({
        ...editingApp,
        name: formName.trim(),
        url: cleanUrl,
        category: formCategory.trim() || undefined,
        description: formDescription.trim() || undefined,
        logoColor: formColor
      });
    } else {
      onAddApp({
        name: formName.trim(),
        url: cleanUrl,
        category: formCategory.trim() || "General",
        description: formDescription.trim() || undefined,
        logoColor: formColor
      });
    }

    setIsModalOpen(false);
  };

  const handleQuickAdd = (suggestion: Omit<StudyApp, "id">) => {
    onAddApp({
      ...suggestion,
      logoColor: suggestion.logoColor || (isLight ? "#EA580C" : "#8B5CF6")
    });
  };

  return (
    <div className={`space-y-6 pb-16 ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
      {/* Header & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-inherit">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isLight ? "bg-orange-100 text-[#EA580C]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
              }`}
            >
              <Compass size={18} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Study Apps</h1>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? "text-[#596474]" : "text-[#94A3B8]"}`}>
                Custom study tabs, portals, and revision resources added by you.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Storage Sync status */}
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
              isLight
                ? "bg-[#F6F7FA] border-[#E2E6EF] text-[#596474]"
                : "bg-[#222938] border-[#283040] text-[#B7C0CF]"
            }`}
          >
            {currentUser?.uid ? (
              <>
                <Cloud size={13} className="text-emerald-500" />
                <span>Synced to account</span>
              </>
            ) : (
              <>
                <HardDrive size={13} />
                <span>Saved on this device</span>
              </>
            )}
          </div>

          {/* Add Study App Button */}
          <button
            type="button"
            onClick={openAddModal}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 ${
              isLight
                ? "bg-[#EA580C] hover:bg-[#C2410C] shadow-orange-500/25"
                : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-purple-500/25"
            }`}
          >
            <Plus size={15} />
            <span>Add Study App</span>
          </button>
        </div>
      </div>

      {/* Notice Banner if any */}
      {appSavedNotice && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
            isLight
              ? "bg-orange-50 border-orange-200 text-[#C2410C]"
              : "bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-[#DDD6FE]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Check size={14} className={isLight ? "text-[#EA580C]" : "text-[#C084FC]"} />
            <span>{appSavedNotice}</span>
          </div>
        </div>
      )}

      {/* Filter, Search & View Controls Bar */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
          isLight ? "bg-[#FFFFFF] border-[#E2E6EF] shadow-xs" : "bg-[#191E28] border-[#283040]"
        }`}
      >
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isLight ? "text-[#82776E]" : "text-[#64748B]"
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your study tabs by name, URL, or tag..."
            className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl border outline-none transition ${
              isLight
                ? "bg-[#F5EFE9] border-[#E5DDD4] text-[#1A1614] focus:border-[#EA580C] focus:bg-white"
                : "bg-[#12161F] border-[#283040] text-[#F1F3F8] focus:border-[#8B5CF6]"
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-black/10 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* View Toggle & App Count */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <span
            className={`text-xs font-mono font-medium ${
              isLight ? "text-[#596474]" : "text-[#94A3B8]"
            }`}
          >
            {userApps.length} {userApps.length === 1 ? "Tab" : "Tabs"}
          </span>

          <div
            className={`flex items-center p-0.5 rounded-xl border text-xs ${
              isLight ? "bg-[#F5EFE9] border-[#E5DDD4]" : "bg-[#12161F] border-[#283040]"
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "grid"
                  ? isLight
                    ? "bg-white text-[#EA580C] shadow-xs font-bold"
                    : "bg-[#8B5CF6] text-white font-bold"
                  : isLight
                  ? "text-[#596474] hover:text-[#18202B]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="List View"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "list"
                  ? isLight
                    ? "bg-white text-[#EA580C] shadow-xs font-bold"
                    : "bg-[#8B5CF6] text-white font-bold"
                  : isLight
                  ? "text-[#596474] hover:text-[#18202B]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills (if user has tagged apps) */}
      {availableCategories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-medium shrink-0 transition cursor-pointer border ${
                selectedCategory === cat
                  ? isLight
                    ? "bg-[#EA580C] text-white border-[#EA580C] shadow-xs font-bold"
                    : "bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-xs font-bold"
                  : isLight
                  ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#596474] hover:border-[#EA580C]/40"
                  : "bg-[#191E28] border-[#283040] text-[#94A3B8] hover:border-[#8B5CF6]/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* App Display: Empty State or Grid / List */}
      {userApps.length === 0 ? (
        <div
          className={`rounded-2xl border p-8 sm:p-12 text-center flex flex-col items-center justify-center ${
            isLight
              ? "bg-[#FFFFFF] border-[#E2E6EF] shadow-sm"
              : "bg-[#191E28] border-[#283040]"
          }`}
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              isLight
                ? "bg-orange-100 text-[#EA580C] ring-8 ring-orange-50"
                : "bg-[#8B5CF6]/20 text-[#C084FC] ring-8 ring-[#8B5CF6]/10"
            }`}
          >
            <Globe size={26} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">No Study Apps Added Yet</h2>
          <p
            className={`text-xs sm:text-sm mt-1.5 max-w-md ${
              isLight ? "text-[#596474]" : "text-[#94A3B8]"
            }`}
          >
            Your Study Apps tab is completely personalized. Add your own quick-access shortcuts to past paper archives, flashcards, calculators, or syllabus notes.
          </p>

          <button
            type="button"
            onClick={openAddModal}
            className={`mt-5 px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 ${
              isLight
                ? "bg-[#EA580C] hover:bg-[#C2410C] shadow-orange-500/25"
                : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-purple-500/25"
            }`}
          >
            <Plus size={16} />
            <span>Add Your First Study Tab</span>
          </button>

          {/* Quick Suggestions Chips to add with 1 click */}
          <div className="mt-8 pt-6 border-t border-inherit w-full max-w-xl">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider block mb-3 ${
                isLight ? "text-[#82776E]" : "text-[#64748B]"
              }`}
            >
              Or add a popular study tab in 1 click:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {QUICK_SUGGESTIONS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleQuickAdd(item)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    isLight
                      ? "bg-[#F5EFE9] border-[#E5DDD4] text-[#1A1614] hover:border-[#EA580C] hover:bg-orange-50"
                      : "bg-[#12161F] border-[#283040] text-[#F1F3F8] hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/15"
                  }`}
                >
                  <Plus size={12} className={isLight ? "text-[#EA580C]" : "text-[#C084FC]"} />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : filteredApps.length === 0 ? (
        <div
          className={`rounded-2xl border p-8 text-center ${
            isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
          }`}
        >
          <Search size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold">No study apps match &ldquo;{searchQuery}&rdquo;</p>
          <p className={`text-xs mt-1 ${isLight ? "text-[#596474]" : "text-[#94A3B8]"}`}>
            Try searching for a different keyword or select &ldquo;All&rdquo; categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className={`mt-3 text-xs font-bold underline cursor-pointer ${
              isLight ? "text-[#EA580C]" : "text-[#C084FC]"
            }`}
          >
            Clear filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => {
            const domain = getDomain(app.url);
            const favicon = getFaviconUrl(app.url);
            const appAccent = app.logoColor || primaryColor;

            return (
              <div
                key={app.id}
                className={`group rounded-2xl border p-4.5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isLight
                    ? "bg-[#FFFFFF] border-[#E2E6EF] hover:border-[#EA580C]/40"
                    : "bg-[#191E28] border-[#283040] hover:border-[#8B5CF6]/50"
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Name & Action Controls */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center p-1.5 shrink-0 overflow-hidden border shadow-2xs"
                        style={{
                          backgroundColor: isLight ? "#F8FAFC" : "#12161F",
                          borderColor: isLight ? "#E2E8F0" : "#283040"
                        }}
                      >
                        <img
                          src={favicon}
                          alt={app.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to letter avatar if favicon fails to load
                            const target = e.currentTarget;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span style="font-weight: bold; color: ${appAccent}; font-size: 13px;">${(app.name[0] || "A").toUpperCase()}</span>`;
                            }
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate leading-tight group-hover:text-inherit">
                          {app.name}
                        </h3>
                        <p
                          className={`text-[11px] font-mono truncate mt-0.5 ${
                            isLight ? "text-[#82776E]" : "text-[#64748B]"
                          }`}
                        >
                          {domain}
                        </p>
                      </div>
                    </div>

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => openEditModal(app)}
                        title="Edit app details"
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isLight
                            ? "hover:bg-black/5 text-[#596474] hover:text-[#18202B]"
                            : "hover:bg-white/10 text-[#94A3B8] hover:text-white"
                        }`}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePendingApp(app)}
                        title="Remove app"
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isLight
                            ? "hover:bg-rose-50 text-[#82776E] hover:text-rose-600"
                            : "hover:bg-rose-500/15 text-[#94A3B8] hover:text-rose-400"
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Category Pill */}
                  {app.category && (
                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                          isLight
                            ? "bg-orange-50 text-[#C2410C] border border-orange-200/70"
                            : "bg-[#8B5CF6]/15 text-[#DDD6FE] border border-[#8B5CF6]/30"
                        }`}
                      >
                        <Tag size={10} />
                        <span>{app.category}</span>
                      </span>
                    </div>
                  )}

                  {/* Description if provided */}
                  {app.description && (
                    <p
                      className={`text-xs mt-2.5 line-clamp-2 leading-relaxed ${
                        isLight ? "text-[#596474]" : "text-[#94A3B8]"
                      }`}
                    >
                      {app.description}
                    </p>
                  )}
                </div>

                {/* Bottom Launch Button */}
                <div className="mt-4 pt-3 border-t border-inherit">
                  <a
                    href={sanitizeUrl(app.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                      isLight
                        ? "bg-orange-50 hover:bg-[#EA580C] text-[#EA580C] hover:text-white border border-orange-200 hover:border-[#EA580C]"
                        : "bg-[#8B5CF6]/15 hover:bg-[#8B5CF6] text-[#C084FC] hover:text-white border border-[#8B5CF6]/30 hover:border-[#8B5CF6]"
                    }`}
                  >
                    <span>Open Tab</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div
          className={`rounded-2xl border divide-y overflow-hidden ${
            isLight
              ? "bg-[#FFFFFF] border-[#E2E6EF] divide-[#E2E6EF]"
              : "bg-[#191E28] border-[#283040] divide-[#283040]"
          }`}
        >
          {filteredApps.map((app) => {
            const domain = getDomain(app.url);
            const favicon = getFaviconUrl(app.url);
            const appAccent = app.logoColor || primaryColor;

            return (
              <div
                key={app.id}
                className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isLight ? "hover:bg-[#F9FAFB]" : "hover:bg-[#1C2230]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center p-1.5 shrink-0 overflow-hidden border"
                    style={{
                      backgroundColor: isLight ? "#F8FAFC" : "#12161F",
                      borderColor: isLight ? "#E2E8F0" : "#283040"
                    }}
                  >
                    <img
                      src={favicon}
                      alt={app.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span style="font-weight: bold; color: ${appAccent}; font-size: 12px;">${(app.name[0] || "A").toUpperCase()}</span>`;
                        }
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate leading-tight">{app.name}</h3>
                      {app.category && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded uppercase ${
                            isLight
                              ? "bg-orange-50 text-[#C2410C] border border-orange-200"
                              : "bg-[#8B5CF6]/15 text-[#DDD6FE] border border-[#8B5CF6]/30"
                          }`}
                        >
                          {app.category}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs font-mono truncate ${
                        isLight ? "text-[#82776E]" : "text-[#64748B]"
                      }`}
                    >
                      {domain}
                      {app.description && (
                        <span className="font-sans font-normal ml-2 opacity-80">
                          — {app.description}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => openEditModal(app)}
                    title="Edit tab"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      isLight
                        ? "hover:bg-black/5 text-[#596474]"
                        : "hover:bg-white/10 text-[#94A3B8]"
                    }`}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletePendingApp(app)}
                    title="Remove tab"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      isLight
                        ? "hover:bg-rose-50 text-[#82776E] hover:text-rose-600"
                        : "hover:bg-rose-500/15 text-[#94A3B8] hover:text-rose-400"
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>

                  <a
                    href={sanitizeUrl(app.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isLight
                        ? "bg-orange-50 hover:bg-[#EA580C] text-[#EA580C] hover:text-white border border-orange-200"
                        : "bg-[#8B5CF6]/15 hover:bg-[#8B5CF6] text-[#C084FC] hover:text-white border border-[#8B5CF6]/30"
                    }`}
                  >
                    <span>Open</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT APP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#191E28] border-[#283040] text-[#F1F3F8]"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isLight ? "bg-orange-100 text-[#EA580C]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
                  }`}
                >
                  {editingApp ? <Edit3 size={16} /> : <Plus size={16} />}
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    {editingApp ? "Edit Study Tab" : "Add Study Tab"}
                  </h2>
                  <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#94A3B8]"}`}>
                    {editingApp
                      ? "Update your customized study portal shortcut"
                      : "Add a website or revision resource to your workspace"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  App or Website Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Physics & Maths Tutor, Quizlet, Khan Academy"
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition ${
                    isLight
                      ? "bg-[#F5EFE9] border-[#E5DDD4] text-[#1A1614] focus:border-[#EA580C] focus:bg-white"
                      : "bg-[#12161F] border-[#283040] text-[#F1F3F8] focus:border-[#8B5CF6]"
                  }`}
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Link / URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="e.g. physicsandmathstutor.com or https://..."
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-mono transition ${
                    isLight
                      ? "bg-[#F5EFE9] border-[#E5DDD4] text-[#1A1614] focus:border-[#EA580C] focus:bg-white"
                      : "bg-[#12161F] border-[#283040] text-[#F1F3F8] focus:border-[#8B5CF6]"
                  }`}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Category or Tag (Optional)
                </label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Past Papers, Notes, Flashcards, Tools, Math"
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition ${
                    isLight
                      ? "bg-[#F5EFE9] border-[#E5DDD4] text-[#1A1614] focus:border-[#EA580C] focus:bg-white"
                      : "bg-[#12161F] border-[#283040] text-[#F1F3F8] focus:border-[#8B5CF6]"
                  }`}
                />
                {/* Fast pick tags */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {["Past Papers", "Notes & Revision", "Flashcards", "Tools & Math", "Planning"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFormCategory(tag)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                        formCategory === tag
                          ? isLight
                            ? "bg-orange-100 text-[#C2410C] border-orange-300 font-semibold"
                            : "bg-[#8B5CF6]/20 text-[#DDD6FE] border-[#8B5CF6]/50 font-semibold"
                          : isLight
                          ? "bg-black/5 border-transparent text-[#596474] hover:bg-black/10"
                          : "bg-white/5 border-transparent text-[#94A3B8] hover:bg-white/10"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Description / Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What do you use this tab for? e.g. Chapter 4 mechanics practice papers"
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none transition resize-none ${
                    isLight
                      ? "bg-[#F5EFE9] border-[#E5DDD4] text-[#1A1614] focus:border-[#EA580C] focus:bg-white"
                      : "bg-[#12161F] border-[#283040] text-[#F1F3F8] focus:border-[#8B5CF6]"
                  }`}
                />
              </div>

              {/* Color Accent */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setFormColor(color.hex)}
                      className={`w-7 h-7 rounded-xl transition cursor-pointer flex items-center justify-center border ${
                        formColor === color.hex
                          ? "ring-2 ring-offset-2 ring-current scale-110"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: color.hex,
                        borderColor: isLight ? "#E2E8F0" : "#283040"
                      }}
                      title={color.name}
                    >
                      {formColor === color.hex && <Check size={13} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                    isLight
                      ? "border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569]"
                      : "border-[#334155] hover:bg-white/5 text-[#94A3B8]"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition cursor-pointer active:scale-95 ${
                    isLight
                      ? "bg-[#EA580C] hover:bg-[#C2410C] shadow-orange-500/25"
                      : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-purple-500/25"
                  }`}
                >
                  {editingApp ? "Save Changes" : "Add Tab"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletePendingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#191E28] border-[#283040] text-[#F1F3F8]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Remove Study Tab?</h3>
                <p className={`text-xs mt-0.5 ${isLight ? "text-[#596474]" : "text-[#94A3B8]"}`}>
                  &ldquo;{deletePendingApp.name}&rdquo; will be deleted from your list.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletePendingApp(null)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                  isLight
                    ? "border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569]"
                    : "border-[#334155] hover:bg-white/5 text-[#94A3B8]"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteApp(deletePendingApp.id);
                  setDeletePendingApp(null);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
