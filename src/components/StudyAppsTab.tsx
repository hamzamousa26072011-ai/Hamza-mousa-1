import React, { useState } from "react";
import { 
  Compass, 
  ExternalLink, 
  Check, 
  FolderCheck, 
  Layers, 
  Sparkles, 
  Plus, 
  Trash2, 
  Globe, 
  Bookmark, 
  X, 
  HelpCircle, 
  RotateCcw,
  Pencil,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StudyApp } from "../types";

interface StudyAppsTabProps {
  apps: StudyApp[];
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
  apps, 
  onAddApp, 
  onEditApp,
  onDeleteApp,
  themeMode = "light",
  currentUser,
  appSavedNotice,
  onResetDefaults,
  onOpenLoginModal
}: StudyAppsTabProps) {
  const isLight = themeMode === "light";
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [logoColor, setLogoColor] = useState("#C96F55");

  // Portal editing state
  const [editingApp, setEditingApp] = useState<StudyApp | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editLogoColor, setEditLogoColor] = useState("#C96F55");

  // Preset Colors
  const accentColors = [
    { name: "Terracotta", value: "#C96F55" },
    { name: "Sage Slate", value: "#66856D" },
    { name: "Muted Ocean", value: "#587B8C" },
    { name: "Indigo Hub", value: "#4F46E5" },
    { name: "Crimson Spark", value: "#EF4444" },
    { name: "Sun Amber", value: "#F59E0B" }
  ];

  // Quick platform suggestion seeds
  const suggestions = [
    { name: "Khan Academy", url: "https://www.khanacademy.org", color: "#587B8C" },
    { name: "Desmos Graphing", url: "https://www.desmos.com/calculator", color: "#C96F55" },
    { name: "Quizlet Flashcards", url: "https://quizlet.com", color: "#A855F7" },
    { name: "Physics & Maths Tutor", url: "https://www.physicsandmathstutor.com", color: "#66856D" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }

    onAddApp({
      name: name.trim(),
      url: cleanUrl,
      logoColor
    });

    setName("");
    setUrl("");
    setShowAddForm(false);
  };

  const handleStartEdit = (app: StudyApp) => {
    setEditingApp(app);
    setEditName(app.name);
    setEditUrl(app.url);
    setEditLogoColor(app.logoColor || "#C96F55");
    setShowAddForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !editName.trim() || !editUrl.trim()) return;

    let cleanUrl = editUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }

    if (onEditApp) {
      onEditApp({
        ...editingApp,
        name: editName.trim(),
        url: cleanUrl,
        logoColor: editLogoColor
      });
    }

    setEditingApp(null);
  };

  const applySuggestion = (sug: typeof suggestions[0]) => {
    setName(sug.name);
    setUrl(sug.url);
    setLogoColor(sug.color);
  };

  return (
    <div className="space-y-6 select-none md:space-y-8">
      
      {/* Launchpad Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${
        isLight ? "border-[#E3E0D8]" : "border-white/5"
      } pb-5 shrink-0`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-mono ${
              isLight ? "text-[#C96F55]" : "text-indigo-400"
            } font-bold uppercase tracking-widest`}>
              My Apps &amp; Study Portals
            </span>

            {/* Live Account Cloud Status Indicator */}
            {currentUser?.uid ? (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                isLight 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                  : "bg-emerald-950/50 text-emerald-400 border border-emerald-800/40"
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Saved to {currentUser.displayName || currentUser.email || "Account"}</span>
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono ${
                isLight 
                  ? "bg-amber-50 text-amber-700 border border-amber-200" 
                  : "bg-amber-950/40 text-amber-300 border border-amber-800/30"
              }`}>
                <span>Guest mode • Saved on this device</span>
                {onOpenLoginModal && (
                  <button 
                    onClick={onOpenLoginModal} 
                    className="underline font-bold hover:opacity-80 cursor-pointer ml-1"
                  >
                    Sign in to sync
                  </button>
                )}
              </span>
            )}
          </div>

          <h1 className={`text-2xl md:text-3xl font-black ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>
            Accelerated Academic Applications
          </h1>
          <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} max-w-xl`}>
            {currentUser?.uid 
              ? "Your connected websites and revision tools are saved directly to your account. They will always be here whenever you sign in." 
              : "Quick-launch revision portals, classroom assignments, and graphing tools. Sign in to keep them saved to your account forever."}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onResetDefaults && apps.length > 1 && (
            <button
              onClick={onResetDefaults}
              className={`py-2 px-3 ${
                isLight 
                  ? "bg-[#F7F6F2] hover:bg-[#EFECE6] border-[#E3E0D8] text-[#77736B]" 
                  : "bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-white"
              } border rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer`}
              title="Reset apps to standard defaults"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`py-2.5 px-5 ${
              isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-indigo-600 hover:bg-indigo-500"
            } text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shadow-2xs`}
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            <span>{showAddForm ? "Cancel Form" : "Add Website"}</span>
          </button>
        </div>
      </div>

      {/* Floating Instant Account Save Notice */}
      <AnimatePresence>
        {appSavedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-mono font-medium shadow-sm ${
              isLight 
                ? "bg-emerald-50/90 border-emerald-200 text-emerald-800" 
                : "bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
            }`}
          >
            <Check size={15} className="text-emerald-500 shrink-0" />
            <div className="flex-1">
              <span>{appSavedNotice}</span>
              {currentUser?.uid && (
                <span className="ml-2 opacity-80 text-[10px]">
                  (Cloud synced to your account)
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Animated Form Entry Card */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className={`p-6 ${
              isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] shadow-2xs" : "bg-[#0E1322] border-white/10 text-white shadow-2xl"
            } border rounded-2xl relative space-y-5`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-inherit">
              <h3 className={`text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-100"} font-mono tracking-wider uppercase flex items-center gap-2`}>
                <Globe size={15} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                <span>Link Custom Studying Platform</span>
              </h3>
              <span className={`text-[9px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-500"}`}>
                Auto HTTPS protocol formatting enabled
              </span>
            </div>

            {/* Suggestions Quick Buttons */}
            <div className="space-y-2">
              <span className={`text-[9px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} font-bold uppercase tracking-wider block`}>
                ⚡ Quick Suggestions seeds:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug) => (
                  <button
                    key={sug.name}
                    type="button"
                    onClick={() => applySuggestion(sug)}
                    className={`px-2.5 py-1 ${
                      isLight 
                        ? "bg-[#F7F6F2] hover:bg-[#FFF1EC] border-[#E3E0D8] text-[#1D1D1B]" 
                        : "bg-white/5 hover:bg-indigo-600/10 border-white/5 text-slate-300 hover:text-indigo-400"
                    } border rounded-lg text-[10px] font-mono font-medium transition cursor-pointer`}
                  >
                    + {sug.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Field 1: Name */}
              <div>
                <label className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} uppercase tracking-widest block font-bold`}>
                  Platform / Website Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Physics and Maths Tutor"
                  className={`w-full mt-1.5 px-4 py-2 ${
                    isLight ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#1D1D1B] focus:border-[#C96F55]" : "bg-[#12192B] border-white/10 text-white focus:border-indigo-500"
                  } border rounded-xl text-xs placeholder:text-[#9B9890] focus:outline-none transition shadow-inner`}
                  required
                />
              </div>

              {/* Field 2: URL */}
              <div>
                <label className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} uppercase tracking-widest block font-bold`}>
                  Direct Entry URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. www.physicsandmathstutor.com"
                  className={`w-full mt-1.5 px-4 py-2 ${
                    isLight ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#1D1D1B] focus:border-[#C96F55]" : "bg-[#12192B] border-white/10 text-white focus:border-indigo-500"
                  } border rounded-xl text-xs placeholder:text-[#9B9890] focus:outline-none transition shadow-inner`}
                  required
                />
              </div>

              {/* Display Accent Colors design selection */}
              <div className="md:col-span-2">
                <label className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} uppercase tracking-widest block font-bold mb-2`}>
                  Display Accent Color
                </label>
                <div className={`flex flex-wrap gap-3 p-3 ${isLight ? "bg-[#F7F6F2] border-[#E3E0D8]" : "bg-[#111626]/60 border-white/5"} border rounded-xl`}>
                  {accentColors.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setLogoColor(col.value)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold flex items-center gap-2 transition cursor-pointer border ${
                        logoColor === col.value 
                          ? isLight ? "bg-[#FFFFFF] border-[#C96F55] text-[#1D1D1B] shadow-2xs" : "bg-white/10 border-indigo-500/50 text-white" 
                          : isLight ? "bg-[#F0EEE8] border-[#E3E0D8] text-[#77736B]" : "bg-black/20 border-white/5 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.value }} />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit handler */}
              <div className="md:col-span-2 flex justify-end gap-3.5 pt-2">
                <button
                  type="submit"
                  className={`py-2.5 px-6 ${
                    isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-indigo-600 hover:bg-indigo-500"
                  } text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shadow-2xs`}
                >
                  <Sparkles size={14} />
                  <span>Connect Website</span>
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Animated Edit Portal Modal */}
      <AnimatePresence>
        {editingApp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={`p-6 ${
              isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] shadow-lg" : "bg-[#0E1322] border-white/10 text-white shadow-2xl"
            } border rounded-2xl relative space-y-5`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-inherit">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: editLogoColor }}
                />
                <h3 className={`text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-100"} font-mono tracking-wider uppercase flex items-center gap-2`}>
                  <Pencil size={15} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                  <span>Edit Studying Portal</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingApp(null)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isLight ? "hover:bg-[#F0EEE8] text-[#77736B]" : "hover:bg-white/10 text-slate-400"
                }`}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} uppercase tracking-widest block font-bold`}>
                  Portal Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Khan Academy"
                  className={`mt-1.5 w-full py-2 px-3 text-xs font-mono rounded-xl border outline-none transition ${
                    isLight 
                      ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#1D1D1B] focus:border-[#C96F55]" 
                      : "bg-[#111626] border-white/10 text-white focus:border-indigo-500"
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} uppercase tracking-widest block font-bold`}>
                  Portal URL / Website Link
                </label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="e.g. khanacademy.org"
                  className={`mt-1.5 w-full py-2 px-3 text-xs font-mono rounded-xl border outline-none transition ${
                    isLight 
                      ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#1D1D1B] focus:border-[#C96F55]" 
                      : "bg-[#111626] border-white/10 text-white focus:border-indigo-500"
                  }`}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} uppercase tracking-widest block font-bold mb-2`}>
                  Theme Accent Color
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {accentColors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setEditLogoColor(c.value)}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono font-medium flex items-center gap-2 cursor-pointer transition ${
                        editLogoColor === c.value
                          ? isLight ? "border-[#1D1D1B] bg-[#FFF1EC] font-bold" : "border-white bg-white/10 font-bold"
                          : isLight ? "border-[#E3E0D8] bg-[#F7F6F2]" : "border-white/5 bg-[#111626]"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.value }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex justify-between items-center pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => {
                    if (editingApp) {
                      onDeleteApp(editingApp.id);
                      setEditingApp(null);
                    }
                  }}
                  className={`py-2 px-3.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    isLight 
                      ? "text-red-600 hover:bg-red-50 border border-red-200" 
                      : "text-red-400 hover:bg-red-950/30 border border-red-800/40"
                  }`}
                >
                  <Trash2 size={13} />
                  <span>Remove Portal</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingApp(null)}
                    className={`py-2 px-4 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                      isLight 
                        ? "bg-[#F7F6F2] hover:bg-[#EFECE6] text-[#77736B] border border-[#E3E0D8]" 
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`py-2 px-5 ${
                      isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-indigo-600 hover:bg-indigo-500"
                    } text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shadow-2xs`}
                  >
                    <Save size={13} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bento Layout deck of portal cards */}
      {apps.length === 0 ? (
        <div className={`p-12 text-center ${
          isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#0E1322] border-white/10 text-white"
        } border border-dashed rounded-3xl space-y-3`}>
          <Globe className={`mx-auto ${isLight ? "text-[#77736B]" : "text-slate-600"} animate-pulse`} size={32} />
          <h3 className={`text-md font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-300"}`}>No Web Portals Connected</h3>
          <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-500"} max-w-sm mx-auto`}>
            Get started by adding custom revision links like Khan Academy, Desmos, or Google Classroom.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className={`mt-3 py-2 px-4 ${
              isLight ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]" : "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
            } border text-xs font-mono font-bold uppercase rounded-lg transition cursor-pointer`}
          >
            Create first link
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <div 
              key={app.id} 
              className={`p-6 ${
                isLight 
                  ? "bg-[#FFFFFF] border border-[#E3E0D8] shadow-2xs hover:border-[#C96F55]/40" 
                  : "bg-[#0E1322]/80 border border-white/10 hover:border-[#1E233E]/90 shadow-lg"
              } rounded-3xl flex flex-col justify-between relative group transition-all duration-300 min-h-[150px] hover:-translate-y-0.5`}
            >
              <div>
                {/* Header Row */}
                <div className="flex justify-between items-center mb-1">
                  
                  {/* Left vertical color pill */}
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: app.logoColor }}
                    />
                    <span className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-500"} font-bold uppercase tracking-wider`}>
                      Studying Portal
                    </span>
                  </div>

                  {/* Top Indicators Row: Edit & Remove actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(app)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isLight 
                          ? "text-[#77736B] hover:text-[#C96F55] hover:bg-[#FFF1EC]" 
                          : "text-slate-400 hover:text-indigo-400 hover:bg-white/10"
                      }`}
                      title="Edit portal"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => onDeleteApp(app.id)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isLight 
                          ? "text-[#77736B] hover:text-[#B85C5C] hover:bg-red-50" 
                          : "text-slate-400 hover:text-red-400 hover:bg-red-950/40"
                      }`}
                      title="Remove portal"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Application Name */}
                <h3 className={`text-sm font-black ${isLight ? "text-[#1D1D1B]" : "text-slate-200 group-hover:text-white"} mt-3 truncate duration-250`}>
                  {app.name}
                </h3>
              </div>

              {/* Launches Portal */}
              <div className={`mt-4 pt-4 border-t ${isLight ? "border-[#E3E0D8]" : "border-white/5"} flex gap-2 w-full`}>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-mono font-bold tracking-widest uppercase border ${
                    isLight 
                      ? "bg-[#F7F6F2] hover:bg-[#C96F55] hover:text-white hover:border-[#C96F55] text-[#1D1D1B] border-[#E3E0D8]" 
                      : "bg-[#12192B] hover:bg-indigo-600 hover:border-indigo-500 hover:text-white text-slate-300 border-white/5"
                  } transition duration-250 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-2xs`}
                >
                  <span>Connect Portal</span>
                  <ExternalLink size={11} />
                </a>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Footer info box */}
      <div className={`p-6 ${
        isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#77736B]" : "bg-[#111626]/40 border-white/5 text-slate-500"
      } border border-dashed rounded-3xl text-center select-none max-w-lg mx-auto`}>
        <Sparkles className={`mx-auto ${isLight ? "text-[#C96F55]" : "text-indigo-400/40"} mb-2`} size={18} />
        <p className="text-[10px] font-mono uppercase tracking-widest">
          Syllabus calibration locks active • Grade boundaries up-to-date
        </p>
      </div>

    </div>
  );
}
