import React, { useState, useMemo } from "react";
import { 
  Globe, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Edit3, 
  LayoutGrid, 
  List, 
  Tag, 
  Compass, 
  AlertTriangle,
  Check,
  FolderOpen
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

export default function StudyAppsTab({
  apps = [],
  customApps = [],
  onAddApp,
  onEditApp,
  onDeleteApp,
  themeMode = "dark",
  currentUser,
  appSavedNotice
}: StudyAppsTabProps) {
  const isLight = themeMode === "light";

  // Core dual-theme accent:
  // Dark mode  -> Purple palette (#8B5CF6 / #7C3AED / #C084FC)
  // Light mode -> Orange palette (#C25E42 / #B25136 / #FFF2ED / #F0D5CC)
  const primaryColor = isLight ? "#C25E42" : "#8B5CF6";
  const primaryHoverColor = isLight ? "#B25136" : "#7C3AED";

  // Only display tabs that the user has added!
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
  const [formColor, setFormColor] = useState(primaryColor);
  const [formError, setFormError] = useState<string | null>(null);

  // Color options for user customization
  const COLOR_PALETTE = useMemo(() => [
    { name: isLight ? "Orange" : "Purple", hex: isLight ? "#C25E42" : "#8B5CF6" },
    { name: "Amber", hex: "#F59E0B" },
    { name: "Emerald", hex: "#10B981" },
    { name: "Teal", hex: "#0D9488" },
    { name: "Rose", hex: "#F43F5E" },
    { name: "Slate", hex: "#64748B" }
  ], [isLight]);

  // Derived categories from the user's own added tabs
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    userApps.forEach((app) => {
      if (app.category && app.category.trim()) {
        set.add(app.category.trim());
      }
    });
    return ["All", ...Array.from(set)];
  }, [userApps]);

  // Filtered tabs based on user search & category
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

  const sanitizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const getDomain = (url: string) => {
    try {
      const sanitized = sanitizeUrl(url);
      const parsed = new URL(sanitized);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    }
  };

  const getFaviconUrl = (url: string) => {
    const domain = getDomain(url);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  };

  const openAddModal = () => {
    setEditingApp(null);
    setFormName("");
    setFormUrl("");
    setFormCategory("");
    setFormDescription("");
    setFormColor(primaryColor);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (app: StudyApp) => {
    setEditingApp(app);
    setFormName(app.name);
    setFormUrl(app.url);
    setFormCategory(app.category || "");
    setFormDescription(app.description || "");
    setFormColor(app.logoColor || primaryColor);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Please enter a name for your study tab.");
      return;
    }
    if (!formUrl.trim()) {
      setFormError("Please provide a website link or URL.");
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

  return (
    <div className={`space-y-6 pb-16 max-w-7xl mx-auto ${isLight ? "text-[#1A1614]" : "text-white"}`}>
      {/* Header & Status Bar */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
        isLight ? "bg-white/95 border-[#E8D7C9] shadow-xs" : "bg-[#101322]/95 border-white/10 shadow-xs"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                isLight 
                  ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" 
                  : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
              }`}
            >
              <Compass size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-sans tracking-tight">Study Apps</h1>
              <p className={`text-xs sm:text-sm font-sans mt-0.5 ${isLight ? "text-[#7A6E65]" : "text-slate-400"}`}>
                Quick-access revision portals and study websites added by you.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Total count badge */}
            <span className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              isLight ? "bg-[#FAF7F3] border-[#E8D7C9] text-[#7A6E65]" : "bg-[#161A2B] border-white/10 text-slate-300"
            }`}>
              {userApps.length} {userApps.length === 1 ? "Tab" : "Tabs"}
            </span>

            {/* + Add Study Tab Button */}
            <button
              type="button"
              onClick={openAddModal}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95 ${
                isLight
                  ? "bg-[#C25E42] hover:bg-[#B25136]"
                  : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
              }`}
            >
              <Plus size={15} />
              <span>Add Study Tab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notice Banner if any */}
      {appSavedNotice && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
            isLight
              ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#B25136]"
              : "bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-[#DDD6FE]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Check size={15} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
            <span>{appSavedNotice}</span>
          </div>
        </div>
      )}

      {/* Controls Bar (Filter, Search & View Toggle) - Only shown if user has added tabs */}
      {userApps.length > 0 && (
        <div
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
            isLight ? "bg-white/95 border-[#E8D7C9] shadow-xs" : "bg-[#101322]/95 border-white/10 shadow-xs"
          }`}
        >
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isLight ? "text-[#7A6E65]" : "text-slate-400"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your study tabs by name, URL, or subject..."
              className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl border outline-none transition font-sans ${
                isLight
                  ? "bg-[#FAF7F3] border-[#E8D7C9] text-[#1A1614] placeholder-[#9E988F] focus:border-[#C25E42] focus:bg-white"
                  : "bg-[#161A2B] border-white/10 text-white placeholder-slate-500 focus:border-[#8B5CF6]"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {/* Category filter pills if user has multiple categories */}
            {availableCategories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold shrink-0 transition cursor-pointer border ${
                      selectedCategory === cat
                        ? isLight
                          ? "bg-[#C25E42] text-white border-[#C25E42] shadow-xs"
                          : "bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-xs"
                        : isLight
                        ? "bg-[#FAF7F3] border-[#E8D7C9] text-[#7A6E65] hover:border-[#C25E42]/40"
                        : "bg-[#161A2B] border-white/10 text-slate-300 hover:border-[#8B5CF6]/40"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* View Mode Toggle */}
            <div
              className={`flex items-center p-0.5 rounded-xl border text-xs shrink-0 ${
                isLight ? "bg-[#FAF7F3] border-[#E8D7C9]" : "bg-[#161A2B] border-white/10"
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid View"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "grid"
                    ? isLight
                      ? "bg-white text-[#C25E42] shadow-xs font-bold"
                      : "bg-[#8B5CF6] text-white font-bold"
                    : isLight
                    ? "text-[#7A6E65] hover:text-[#1A1614]"
                    : "text-slate-400 hover:text-white"
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
                      ? "bg-white text-[#C25E42] shadow-xs font-bold"
                      : "bg-[#8B5CF6] text-white font-bold"
                    : isLight
                    ? "text-[#7A6E65] hover:text-[#1A1614]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Display: Empty State or Grid / List */}
      {userApps.length === 0 ? (
        /* Minimalist, Clean Empty State (Only user's added tabs allowed!) */
        <div
          className={`rounded-3xl border p-8 sm:p-14 text-center flex flex-col items-center justify-center space-y-4 ${
            isLight
              ? "bg-white/95 border-[#E8D7C9] shadow-xs"
              : "bg-[#101322]/95 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
          }`}
        >
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xs ${
              isLight
                ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]"
                : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
            }`}
          >
            <FolderOpen size={28} />
          </div>

          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-black font-sans tracking-tight">No Study Tabs Added Yet</h2>
            <p
              className={`text-xs sm:text-sm font-sans mt-1.5 leading-relaxed ${
                isLight ? "text-[#7A6E65]" : "text-slate-400"
              }`}
            >
              Keep all your revision resources in one place. Add links to your past paper vaults, online graphing calculators, notes repositories, or syllabus tools.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className={`mt-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95 ${
              isLight
                ? "bg-[#C25E42] hover:bg-[#B25136]"
                : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
            }`}
          >
            <Plus size={16} />
            <span>Add Your First Study Tab</span>
          </button>
        </div>
      ) : filteredApps.length === 0 ? (
        /* No Search Matches */
        <div
          className={`rounded-3xl border p-8 sm:p-10 text-center ${
            isLight ? "bg-white/95 border-[#E8D7C9]" : "bg-[#101322]/95 border-white/10"
          }`}
        >
          <Search size={24} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-bold font-sans">No tabs match &ldquo;{searchQuery}&rdquo;</p>
          <p className={`text-xs mt-1 font-sans ${isLight ? "text-[#7A6E65]" : "text-slate-400"}`}>
            Try searching for a different keyword or clear your filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className={`mt-3 text-xs font-bold underline cursor-pointer ${
              isLight ? "text-[#C25E42]" : "text-[#C084FC]"
            }`}
          >
            Clear search filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredApps.map((app) => {
            const domain = getDomain(app.url);
            const favicon = getFaviconUrl(app.url);
            const appAccent = app.logoColor || primaryColor;

            return (
              <div
                key={app.id}
                className={`group rounded-3xl border p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isLight
                    ? "bg-white/95 border-[#E8D7C9] hover:border-[#C25E42]/40"
                    : "bg-[#101322]/95 border-white/10 hover:border-[#8B5CF6]/50 shadow-xs"
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Name & Action Controls */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center p-2 shrink-0 overflow-hidden border shadow-2xs"
                        style={{
                          backgroundColor: isLight ? "#FAF7F3" : "#161A2B",
                          borderColor: isLight ? "#E8D7C9" : "rgba(255, 255, 255, 0.1)"
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
                              parent.innerHTML = `<span style="font-weight: bold; color: ${appAccent}; font-size: 14px;">${(app.name[0] || "A").toUpperCase()}</span>`;
                            }
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-bold font-sans truncate leading-tight group-hover:text-inherit">
                          {app.name}
                        </h3>
                        <p
                          className={`text-xs font-mono truncate mt-0.5 ${
                            isLight ? "text-[#7A6E65]" : "text-slate-400"
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
                        title="Edit study tab"
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isLight
                            ? "hover:bg-black/5 text-[#7A6E65] hover:text-[#1A1614]"
                            : "hover:bg-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePendingApp(app)}
                        title="Remove study tab"
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isLight
                            ? "hover:bg-rose-50 text-[#7A6E65] hover:text-rose-600"
                            : "hover:bg-rose-500/15 text-slate-400 hover:text-rose-400"
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
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isLight
                            ? "bg-[#FFF2ED] text-[#C25E42] border border-[#F0D5CC]"
                            : "bg-[#8B5CF6]/15 text-[#C084FC] border border-[#8B5CF6]/30"
                        }`}
                      >
                        <Tag size={10} />
                        <span>{app.category}</span>
                      </span>
                    </div>
                  )}

                  {/* Description / Note if provided */}
                  {app.description && (
                    <p
                      className={`text-xs mt-2.5 line-clamp-2 leading-relaxed font-sans ${
                        isLight ? "text-[#7A6E65]" : "text-slate-400"
                      }`}
                    >
                      {app.description}
                    </p>
                  )}
                </div>

                {/* Bottom Launch Button */}
                <div className="mt-5 pt-3.5 border-t border-inherit">
                  <a
                    href={sanitizeUrl(app.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                      isLight
                        ? "bg-[#FFF2ED] hover:bg-[#C25E42] text-[#C25E42] hover:text-white border border-[#F0D5CC] hover:border-[#C25E42]"
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
          className={`rounded-3xl border divide-y overflow-hidden ${
            isLight
              ? "bg-white/95 border-[#E8D7C9] divide-[#E8D7C9]"
              : "bg-[#101322]/95 border-white/10 divide-white/10"
          }`}
        >
          {filteredApps.map((app) => {
            const domain = getDomain(app.url);
            const favicon = getFaviconUrl(app.url);
            const appAccent = app.logoColor || primaryColor;

            return (
              <div
                key={app.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isLight ? "hover:bg-[#FAF7F3]" : "hover:bg-[#161A2B]"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center p-2 shrink-0 overflow-hidden border"
                    style={{
                      backgroundColor: isLight ? "#FAF7F3" : "#161A2B",
                      borderColor: isLight ? "#E8D7C9" : "rgba(255, 255, 255, 0.1)"
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
                          parent.innerHTML = `<span style="font-weight: bold; color: ${appAccent}; font-size: 13px;">${(app.name[0] || "A").toUpperCase()}</span>`;
                        }
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold font-sans truncate leading-tight">{app.name}</h3>
                      {app.category && (
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            isLight
                              ? "bg-[#FFF2ED] text-[#C25E42] border border-[#F0D5CC]"
                              : "bg-[#8B5CF6]/15 text-[#C084FC] border border-[#8B5CF6]/30"
                          }`}
                        >
                          {app.category}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs font-mono truncate mt-0.5 ${
                        isLight ? "text-[#7A6E65]" : "text-slate-400"
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
                        ? "hover:bg-black/5 text-[#7A6E65]"
                        : "hover:bg-white/10 text-slate-400"
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
                        ? "hover:bg-rose-50 text-[#7A6E65] hover:text-rose-600"
                        : "hover:bg-rose-500/15 text-slate-400 hover:text-rose-400"
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>

                  <a
                    href={sanitizeUrl(app.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      isLight
                        ? "bg-[#FFF2ED] hover:bg-[#C25E42] text-[#C25E42] hover:text-white border border-[#F0D5CC]"
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
            className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl relative ${
              isLight
                ? "bg-white border-[#E8D7C9] text-[#1A1614]"
                : "bg-[#101322] border-white/15 text-white"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-inherit">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    isLight ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
                  }`}
                >
                  {editingApp ? <Edit3 size={16} /> : <Plus size={16} />}
                </div>
                <div>
                  <h2 className="text-base font-black font-sans">
                    {editingApp ? "Edit Study Tab" : "Add Study Tab"}
                  </h2>
                  <p className={`text-xs font-sans ${isLight ? "text-[#7A6E65]" : "text-slate-400"}`}>
                    {editingApp
                      ? "Update your customized study shortcut details"
                      : "Add a revision website, past paper vault, or tool"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5">
                  Tab Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Physics & Maths Tutor, Desmos, Save My Exams"
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition font-sans ${
                    isLight
                      ? "bg-[#FAF7F3] border-[#E8D7C9] text-[#1A1614] focus:border-[#C25E42] focus:bg-white"
                      : "bg-[#161A2B] border-white/10 text-white focus:border-[#8B5CF6]"
                  }`}
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5">
                  Link / URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="e.g. papacambridge.com or https://..."
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-mono transition ${
                    isLight
                      ? "bg-[#FAF7F3] border-[#E8D7C9] text-[#1A1614] focus:border-[#C25E42] focus:bg-white"
                      : "bg-[#161A2B] border-white/10 text-white focus:border-[#8B5CF6]"
                  }`}
                />
              </div>

              {/* Category / Subject */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5">
                  Subject or Tag (Optional)
                </label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Past Papers, Mathematics, Physics, Notes"
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition font-sans ${
                    isLight
                      ? "bg-[#FAF7F3] border-[#E8D7C9] text-[#1A1614] focus:border-[#C25E42] focus:bg-white"
                      : "bg-[#161A2B] border-white/10 text-white focus:border-[#8B5CF6]"
                  }`}
                />
              </div>

              {/* Description / Note */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5">
                  Notes / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Chapter 4 mechanics practice papers & mark schemes"
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition resize-none font-sans ${
                    isLight
                      ? "bg-[#FAF7F3] border-[#E8D7C9] text-[#1A1614] focus:border-[#C25E42] focus:bg-white"
                      : "bg-[#161A2B] border-white/10 text-white focus:border-[#8B5CF6]"
                  }`}
                />
              </div>

              {/* Color Accent */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5">
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
                        borderColor: isLight ? "#E8D7C9" : "rgba(255,255,255,0.1)"
                      }}
                      title={color.name}
                    >
                      {formColor === color.hex && <Check size={13} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    isLight
                      ? "border-[#E8D7C9] hover:bg-[#FAF7F3] text-[#7A6E65]"
                      : "border-white/10 hover:bg-white/5 text-slate-300"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer active:scale-95 ${
                    isLight
                      ? "bg-[#C25E42] hover:bg-[#B25136]"
                      : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
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
            className={`w-full max-w-sm rounded-3xl border p-5 shadow-2xl ${
              isLight
                ? "bg-white border-[#E8D7C9] text-[#1A1614]"
                : "bg-[#101322] border-white/15 text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-sans">Remove Study Tab?</h3>
                <p className={`text-xs mt-0.5 font-sans ${isLight ? "text-[#7A6E65]" : "text-slate-400"}`}>
                  &ldquo;{deletePendingApp.name}&rdquo; will be deleted from your list.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletePendingApp(null)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  isLight
                    ? "border-[#E8D7C9] hover:bg-[#FAF7F3] text-[#7A6E65]"
                    : "border-white/10 hover:bg-white/5 text-slate-300"
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
