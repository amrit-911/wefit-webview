"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Trash2, Pencil, X, Search, ChevronDown, Upload, Link, Library, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  getClientWorkoutPlan,
  saveClientWorkoutPlan,
  uploadExerciseVideo,
  type WorkoutDay,
  type WorkoutExercise,
  WORKOUT_CATEGORIES,
} from "@/lib/services/client-workout.service";
import { getExercises, type Exercise } from "@/lib/services/exercises.service";

const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

const DEFAULT_DAYS: WorkoutDay[] = DAY_NUMBERS.map((n) => ({
  dayNumber: n,
  label: `Day ${n}`,
  isRestDay: n === 4 || n === 7,
  exercises: [],
}));

const EMPTY_FORM: WorkoutExercise = {
  name: "",
  sets: 1,
  reps: "12",
  repsPerSet: ["12"],
  restTime: "90s",
  note: "",
  videoLink: "",
  category: undefined,
};

/** Derive a short pill label from a day — uses header field if set */
function pillLabel(day: WorkoutDay): string {
  if (day.header?.trim()) return day.header.trim().toUpperCase();
  if (day.isRestDay) return "OFF";
  const l = day.label.toUpperCase();
  if (l.includes("PUSH")) return "PUSH";
  if (l.includes("PULL")) return "PULL";
  if (l.includes("LEG")) return "LEG";
  if (l.includes("UPPER")) return "UPPER";
  if (l.includes("LOWER")) return "LOWER";
  if (l.includes("CORE") || l.includes("ABS")) return "CORE";
  if (l.includes("BACK")) return "BACK";
  if (l.includes("CHEST")) return "CHEST";
  if (l.includes("SHOULDER")) return "SHOULDER";
  if (l.includes("CARDIO")) return "CARDIO";
  return `D${day.dayNumber}`;
}

export default function ExerciseBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params?.id as string;
  const { user } = useAuth();

  const initialDay = Number(searchParams?.get("day") ?? 1) || 1;

  const [days, setDays] = useState<WorkoutDay[]>(DEFAULT_DAYS);
  const [activeDay, setActiveDay] = useState(initialDay);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<WorkoutExercise>(EMPTY_FORM);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Category dropdown
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Master exercise library for video search
  const [masterExercises, setMasterExercises] = useState<Exercise[]>([]);
  const [videoSearch, setVideoSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Video tab: "library" | "url" | "upload"
  const [videoTab, setVideoTab] = useState<"library" | "url" | "upload">("library");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getClientWorkoutPlan(clientId)
      .then((plan) => {
        if (plan?.days?.length) {
          const existing = plan.days;
          const merged = DEFAULT_DAYS.map((def) => existing.find((d) => d.dayNumber === def.dayNumber) ?? def);
          setDays(merged);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    getExercises().then(setMasterExercises).catch(console.error);
  }, [clientId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVideoSearch = (query: string) => {
    setVideoSearch(query);
    if (!query.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    const lower = query.toLowerCase();
    const results = masterExercises.filter((ex) => ex.name.toLowerCase().includes(lower) && ex.videoUrl).slice(0, 8);
    setSearchResults(results);
    setShowDropdown(results.length > 0);
  };

  const handleSelectExercise = (ex: Exercise) => {
    setForm((prev) => ({
      ...prev,
      name: prev.name.trim() ? prev.name : ex.name,
      videoLink: ex.videoUrl ?? prev.videoLink,
    }));
    setVideoSearch("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const currentDay = days.find((d) => d.dayNumber === activeDay);
  const currentExercises = currentDay?.exercises ?? [];

  const handleFormChange = (field: keyof WorkoutExercise, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /** Update the header (circle label) for the active day */
  const handleHeaderChange = (value: string) => {
    setDays((prev) =>
      prev.map((d) => d.dayNumber === activeDay ? { ...d, header: value } : d)
    );
  };

  const handleAddOrUpdate = () => {
    if (!form.name.trim()) return;
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayNumber !== activeDay) return d;
        if (editIndex !== null) {
          const updated = [...d.exercises];
          updated[editIndex] = { ...form };
          return { ...d, exercises: updated };
        }
        return { ...d, exercises: [...d.exercises, { ...form }] };
      })
    );
    setForm(EMPTY_FORM);
    setEditIndex(null);
  };

  const handleEdit = (index: number) => {
    const ex = currentExercises[index];
    const repsPerSet = ex.repsPerSet?.length
      ? ex.repsPerSet
      : Array.from({ length: Math.max(1, parseInt(String(ex.sets), 10) || 1) }, () => String(ex.reps));
    setForm({ ...ex, repsPerSet });
    setEditIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setForm(EMPTY_FORM);
    setEditIndex(null);
  };

  const handleRemove = (index: number) => {
    if (editIndex === index) handleCancelEdit();
    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDay
          ? { ...d, exercises: d.exercises.filter((_, i) => i !== index) }
          : d
      )
    );
  };

  const handleToggleRestDay = () => {
    const willBeRest = !currentDay?.isRestDay;
    if (willBeRest) handleCancelEdit();
    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDay
          ? { ...d, isRestDay: willBeRest, isRepeat: willBeRest ? false : d.isRepeat, exercises: willBeRest ? [] : d.exercises }
          : d
      )
    );
  };

  const handleToggleRepeat = () => {
    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === activeDay ? { ...d, isRepeat: !d.isRepeat } : d
      )
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveClientWorkoutPlan(clientId, user.uid, days);
      router.back();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#121212] font-sans flex flex-col">
      <div className="flex-1 px-5 pt-12 pb-10 overflow-y-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          back
        </button>

        <h1 className="text-[24px] font-extrabold text-white mb-1">Exercise Builder</h1>
        <p className="text-[12px] text-gray-400 mb-6">Create custom exercises</p>

        {/* Day selector label */}
        <p className="text-[11px] font-extrabold text-white tracking-widest uppercase mb-3">
          Add this week&apos;s workout
        </p>

        {/* Day pill selector */}
        {(() => {
          const sortedDays = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
          const repeatIdx = sortedDays.findIndex((d) => d.isRepeat && !d.isRestDay);
          return (
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pt-1 pb-1">
              {sortedDays.map((day, i) => {
                const isAfterRepeat = repeatIdx !== -1 && i > repeatIdx;
                return (
                  <button
                    key={day.dayNumber}
                    onClick={() => { if (!isAfterRepeat) { setActiveDay(day.dayNumber); handleCancelEdit(); } }}
                    disabled={isAfterRepeat}
                    className={`relative px-3 py-1.5 rounded-full text-[10px] font-extrabold tracking-wide shrink-0 transition-all ${isAfterRepeat
                        ? "bg-[#1c1c1e] text-gray-700 border border-white/5 opacity-40 cursor-not-allowed"
                        : activeDay === day.dayNumber
                          ? "bg-[#a3e635] text-black"
                          : day.isRestDay
                            ? "bg-[#2a2a2c] text-gray-600"
                            : "bg-[#1c1c1e] text-gray-500 hover:bg-[#2a2a2c] border border-white/5"
                      }`}
                  >
                    {pillLabel(day)}
                    {!isAfterRepeat && day.exercises.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-[14px] h-[14px] rounded-full bg-[#a3e635] text-black text-[7px] font-extrabold flex items-center justify-center">
                        {day.exercises.length}
                      </span>
                    )}
                    {day.isRepeat && !day.isRestDay && (
                      <span className="absolute -top-1 -left-1 w-[14px] h-[14px] rounded-full bg-blue-500 text-white text-[8px] flex items-center justify-center">
                        ↩
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Day Off toggle */}
        <div className="flex items-center justify-between bg-[#1c1c1e] rounded-xl px-4 py-3 mb-6 border border-white/5">
          <div>
            <p className="text-[13px] font-bold text-white">Day Off</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {currentDay?.isRestDay ? "🛌 This is a rest day" : `Mark Day ${activeDay} as a rest day`}
            </p>
          </div>
          <button
            onClick={handleToggleRestDay}
            className={`relative w-[46px] h-[26px] rounded-full transition-all duration-200 focus:outline-none ${currentDay?.isRestDay ? "bg-[#a3e635]" : "bg-[#3a3a3c]"
              }`}
          >
            <span
              className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow transition-all duration-200 ${currentDay?.isRestDay ? "left-[23px]" : "left-[3px]"
                }`}
            />
          </button>
        </div>

        {/* Repeat toggle — only for non-rest days */}
        {!currentDay?.isRestDay && (
          <div className="flex items-center justify-between bg-[#1c1c1e] rounded-xl px-4 py-3 mb-6 border border-white/5">
            <div>
              <p className="text-[13px] font-bold text-white">Repeat Cycle</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {currentDay?.isRepeat
                  ? "↩ Replaces with day 1"
                  : `After Day ${activeDay}, continue to next day`}
              </p>
            </div>
            <button
              onClick={handleToggleRepeat}
              className={`relative w-[46px] h-[26px] rounded-full transition-all duration-200 focus:outline-none ${currentDay?.isRepeat ? "bg-blue-500" : "bg-[#3a3a3c]"
                }`}
            >
              <span
                className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow transition-all duration-200 ${currentDay?.isRepeat ? "left-[23px]" : "left-[3px]"
                  }`}
              />
            </button>
          </div>
        )}

        {/* Form — only show when not a rest day */}
        {!currentDay?.isRestDay && (
          <>
            {/* Edit mode banner */}
            {editIndex !== null && (
              <div className="flex items-center justify-between bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-xl px-4 py-2.5 mb-4">
                <p className="text-[11px] font-bold text-[#a3e635]">✏️ Editing: {form.name || `Exercise ${editIndex + 1}`}</p>
                <button onClick={handleCancelEdit} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-4 mb-6">

              {/* HEADER (circle label) */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">HEADER</label>
                <input
                  type="text"
                  placeholder="e.g. PUSH, PULL, LEG, ABS"
                  value={currentDay?.header ?? ""}
                  onChange={(e) => handleHeaderChange(e.target.value)}
                  maxLength={20}
                  className="w-full h-12 bg-[#1c1c1e] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all uppercase"
                />
                <p className="text-[10px] text-gray-600">Short label shown in the day circle and pill (max 20 chars)</p>
              </div>

              {/* WORKOUT CATEGORY */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">WORKOUT CATEGORY</label>
                <div ref={categoryRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown((v) => !v)}
                    className="w-full h-12 bg-[#1c1c1e] rounded-xl px-4 text-[13px] text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
                  >
                    <span className={form.category ? "text-white font-semibold" : "text-gray-600"}>
                      {form.category || "Select category"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-1 bg-[#1c1c1e] border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-[240px] overflow-y-auto"
                      >
                        {WORKOUT_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              handleFormChange("category", cat);
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-[12px] font-semibold hover:bg-[#2a2a2c] transition-colors border-b border-white/5 last:border-0 ${form.category === cat ? "text-[#a3e635]" : "text-white"
                              }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* EXERCISE NAME */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">EXERCISE NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Bench Press"
                  value={form.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  className="w-full h-12 bg-[#1c1c1e] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
                />
              </div>

              {/* SETS & REPS — one row per set, auto-increments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">SETS &amp; REPS</label>
                  <span className="text-[10px] text-gray-600">{(form.repsPerSet ?? []).length} sets</span>
                </div>
                <div className="space-y-2">
                  {(form.repsPerSet ?? ["12"]).map((reps, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 font-bold w-12 shrink-0">Set {i + 1}</span>
                      <input
                        type="text"
                        value={reps}
                        placeholder="e.g. 12"
                        onChange={(e) => {
                          const updated = [...(form.repsPerSet ?? ["12"])];
                          updated[i] = e.target.value;
                          setForm((prev) => ({ ...prev, repsPerSet: updated, sets: updated.length, reps: updated[0] ?? "12" }));
                        }}
                        className="flex-1 h-10 bg-[#1c1c1e] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
                      />
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (form.repsPerSet ?? ["12"]).filter((_, j) => j !== i);
                            setForm((prev) => ({ ...prev, repsPerSet: updated, sets: updated.length }));
                          }}
                          className="w-9 h-9 rounded-xl bg-red-500/15 hover:bg-red-500/30 flex items-center justify-center shrink-0 transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const prev = form.repsPerSet ?? ["12"];
                    const lastReps = prev[prev.length - 1] ?? "12";
                    const updated = [...prev, lastReps];
                    setForm((f) => ({ ...f, repsPerSet: updated, sets: updated.length }));
                  }}
                  className="w-full h-10 border border-dashed border-[#a3e635]/30 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#a3e635] hover:bg-[#a3e635]/5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Set
                </button>
              </div>

              {/* REST TIME */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">REST TIME</label>
                <input
                  type="text"
                  value={form.restTime}
                  onChange={(e) => handleFormChange("restTime", e.target.value)}
                  placeholder="e.g. 90s"
                  className="w-full h-12 bg-[#1c1c1e] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
                />
              </div>

              {/* VIDEO (OPTIONAL) — 3-tab picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">VIDEO (OPTIONAL)</label>

                {/* Tab row */}
                <div className="flex gap-1 bg-[#2a2a2c] rounded-xl p-1">
                  {([
                    { id: "library" as const, icon: Library, label: "Library" },
                    { id: "url" as const, icon: Link, label: "YouTube" },
                    { id: "upload" as const, icon: Upload, label: "Upload" },
                  ]).map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setVideoTab(id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all ${videoTab === id
                          ? "bg-[#1c1c1e] text-[#a3e635] shadow"
                          : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab: Search from master exercise library */}
                {videoTab === "library" && (
                  <div ref={searchRef} className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search exercise library for video…"
                        value={videoSearch}
                        onChange={(e) => handleVideoSearch(e.target.value)}
                        onFocus={() => videoSearch.trim() && setShowDropdown(searchResults.length > 0)}
                        className="w-full h-11 bg-[#1c1c1e] rounded-xl pl-9 pr-4 text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/40 transition-all"
                      />
                    </div>
                    <AnimatePresence>
                      {showDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-50 w-full mt-1 bg-[#1c1c1e] border border-white/10 rounded-xl overflow-hidden shadow-xl"
                        >
                          {searchResults.map((ex) => (
                            <button
                              key={ex.id}
                              type="button"
                              onClick={() => handleSelectExercise(ex)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#2a2a2c] transition-colors text-left border-b border-white/5 last:border-0"
                            >
                              <div>
                                <p className="text-[12px] font-bold text-white">{ex.name}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[200px]">{ex.videoUrl}</p>
                              </div>
                              <span className="text-[9px] font-bold text-[#a3e635] shrink-0 ml-2">USE</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Tab: manual YouTube / URL */}
                {videoTab === "url" && (
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={form.videoLink ?? ""}
                    onChange={(e) => handleFormChange("videoLink", e.target.value)}
                    className="w-full h-12 bg-[#1c1c1e] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
                  />
                )}

                {/* Tab: upload own video */}
                {videoTab === "upload" && (
                  <div className="space-y-3">
                    {/* Drop zone */}
                    <label
                      className={`flex flex-col items-center justify-center gap-2 h-[100px] rounded-xl border-2 border-dashed cursor-pointer transition-all ${uploadFile
                          ? "border-[#a3e635]/60 bg-[#a3e635]/5"
                          : "border-white/15 bg-[#1c1c1e] hover:border-[#a3e635]/40"
                        }`}
                    >
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setUploadFile(f);
                          setUploadProgress(null);
                          // Clear previous uploaded link when a new file is chosen
                          if (!f) handleFormChange("videoLink", "");
                        }}
                      />
                      {uploadFile ? (
                        <>
                          <Upload className="w-5 h-5 text-[#a3e635]" />
                          <p className="text-[11px] font-bold text-[#a3e635] text-center px-2 truncate max-w-full">{uploadFile.name}</p>
                          <p className="text-[9px] text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(1)} MB — tap to change</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-500" />
                          <p className="text-[11px] text-gray-400 font-medium">Tap to select video</p>
                          <p className="text-[9px] text-gray-600">MP4, MOV, etc.</p>
                        </>
                      )}
                    </label>

                    {/* Progress bar */}
                    {uploadProgress !== null && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-[#2a2a2c] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[#a3e635] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 text-right">{uploadProgress}%</p>
                      </div>
                    )}

                    {/* Upload button */}
                    {uploadFile && (
                      <button
                        type="button"
                        disabled={uploading || uploadProgress === 100}
                        onClick={async () => {
                          if (!uploadFile) return;
                          setUploading(true);
                          setUploadProgress(0);
                          try {
                            const { url } = await uploadExerciseVideo(clientId, uploadFile, setUploadProgress);
                            handleFormChange("videoLink", url);
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setUploading(false);
                          }
                        }}
                        className={`w-full h-11 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all ${uploadProgress === 100
                            ? "bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30"
                            : "bg-[#a3e635] hover:bg-[#b5f745] text-black disabled:opacity-60"
                          }`}
                      >
                        {uploading ? (
                          <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Uploading...</>
                        ) : uploadProgress === 100 ? (
                          <><Check className="w-4 h-4" strokeWidth={3} /> Uploaded ✓</>
                        ) : (
                          <><Upload className="w-4 h-4" /> Upload Video</>
                        )}
                      </button>
                    )}

                    {/* Show saved URL if uploaded */}
                    {form.videoLink && uploadProgress === 100 && (
                      <p className="text-[10px] text-[#a3e635] truncate">✓ Video saved to exercise</p>
                    )}
                  </div>
                )}

                {/* Current video link indicator */}
                {form.videoLink && videoTab !== "upload" && (
                  <div className="flex items-center justify-between bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-[#a3e635] font-medium truncate flex-1">✓ {form.videoLink}</p>
                    <button
                      type="button"
                      onClick={() => { handleFormChange("videoLink", ""); setUploadFile(null); setUploadProgress(null); }}
                      className="ml-2 shrink-0 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* NOTE */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">NOTE (OPTIONAL)</label>
                <textarea
                  placeholder="Technique notes"
                  value={form.note}
                  onChange={(e) => handleFormChange("note", e.target.value)}
                  rows={2}
                  className="w-full bg-[#1c1c1e] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all resize-none"
                />
              </div>
            </div>

            {/* Add / Update button */}
            <button
              onClick={handleAddOrUpdate}
              disabled={!form.name.trim()}
              className="w-full h-12 bg-[#a3e635] hover:bg-[#b5f745] disabled:bg-[#2a2a2c] disabled:text-gray-500 text-black font-bold text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2 mb-8"
            >
              {editIndex !== null ? (
                <><Check className="w-4 h-4" strokeWidth={3} /> Update Exercise</>
              ) : (
                <><span className="text-[18px] font-light">+</span> Add Exercise To Day {activeDay}</>
              )}
            </button>
          </>
        )}

        {/* Exercise list for active day */}
        {currentExercises.length > 0 && (
          <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-3">
              DAY {activeDay} EXERCISE
            </p>
            <AnimatePresence>
              {currentExercises.map((ex, i) => (
                <motion.div
                  key={`${ex.name}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 ${editIndex === i ? "bg-[#a3e635]/5 -mx-1 px-1 rounded-lg" : ""
                    }`}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <span className="text-[12px] text-white font-medium">{ex.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-500">
                        {ex.repsPerSet
                          ? `${ex.repsPerSet.length} sets · ${ex.repsPerSet.join(" / ")} reps`
                          : `${ex.sets} × ${ex.reps}`}
                      </span>
                      {ex.restTime && <span className="text-[10px] text-gray-600">• {ex.restTime}</span>}
                      {ex.category && <span className="text-[9px] text-[#a3e635] font-bold uppercase">{ex.category}</span>}
                      {ex.videoLink && <span className="text-[9px] text-blue-400 font-bold">VIDEO</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(i)}
                      className="w-6 h-6 rounded-full bg-[#a3e635]/20 hover:bg-[#a3e635]/40 flex items-center justify-center transition-colors"
                    >
                      <Pencil className="w-2.5 h-2.5 text-[#a3e635]" />
                    </button>
                    <button
                      onClick={() => handleRemove(i)}
                      className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="px-5 pb-10 pt-4">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full h-14 bg-[#a3e635] hover:bg-[#b5f745] disabled:opacity-70 text-black font-bold text-[15px] rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Saving...</>
          ) : (
            <><Check className="w-4 h-4" strokeWidth={3} /> Save Exercises</>
          )}
        </button>
      </div>
    </div>
  );
}
