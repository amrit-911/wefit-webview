"use client";

import { ArrowLeft, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { submitLibraryRequest } from "@/lib/services/library-requests.service";

// ─── Option lists ─────────────────────────────────────────────────────────────
const SUPP_CATEGORIES = [
  "Pre-Workout", "Post-Workout", "Protein", "Vitamins & Minerals",
  "Fat Burner", "BCAA / EAA", "Creatine", "Recovery", "Other",
];
const TIMING_OPTIONS = ["Morning", "Pre-Workout", "Post-Workout", "Evening", "Bedtime", "With Meals", "Any Time"];

// ─── Shared helpers ───────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-[#1e1e20] border border-[#2c2c2e] rounded-xl px-4 py-3 text-[13px] text-white font-medium placeholder:text-[#555] focus:outline-none focus:border-[#a3e635]/60 transition-all";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2">
      {children} {required && <span className="text-[#a3e635]">*</span>}
    </p>
  );
}


export default function TrainerLibraryAddPage() {
  const router = useRouter();
  const { user, displayName } = useAuth();

  const [tab, setTab] = useState<"supplement" | "nutrition">("supplement");

  // ── Shared state ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // ── Supplement state ──────────────────────────────────────────────────────
  const [category, setCategory] = useState("");
  const [usageTiming, setUsageTiming] = useState("");
  const [usageTimingNote, setUsageTimingNote] = useState("");
  const [brand, setBrand] = useState("");

  // ── Nutrition state ───────────────────────────────────────────────────────
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [prepInstructions, setPrepInstructions] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName(""); setDescription("");
    setCategory(""); setUsageTiming(""); setUsageTimingNote(""); setBrand("");
    setCalories(""); setProtein(""); setCarbs(""); setFats("");
    setPrepInstructions("");
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim()) { setError("Title / Name is required."); return; }
    if (tab === "supplement" && !category) { setError("Category is required."); return; }
    if (tab === "supplement" && !usageTiming) { setError("Usage Timing is required."); return; }
    if (tab === "nutrition") {
      if (!calories.trim()) { setError("Calories is required."); return; }
      if (!protein.trim()) { setError("Protein is required."); return; }
      if (!carbs.trim()) { setError("Carbs is required."); return; }
      if (!fats.trim()) { setError("Fats is required."); return; }
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitLibraryRequest(user.uid, displayName || "Trainer", {
        type: tab,
        name: name.trim(),
        description: description.trim(),
        ...(tab === "supplement" ? {
          category, usageTiming, usageTimingNote: usageTimingNote.trim(),
          brand: brand.trim(),
        } : {
          calories: calories.trim(), protein: protein.trim(),
          carbs: carbs.trim(), fats: fats.trim(),
          preparationInstructions: prepInstructions.trim(),
        }),
      });
      resetForm();
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col font-sans bg-[#121212] overflow-x-hidden">
      {/* Header */}
      <div className="pt-10 px-6 pb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-5 transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          back
        </button>
        <h1 className="text-[22px] font-extrabold text-white tracking-wide mb-1">
          Add Supplement / Nutrition
        </h1>
        <p className="text-[12px] text-gray-500 font-medium">
          Create a new item for your library. It will be reviewed before publishing.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="px-6 mb-5">
        <div className="flex bg-[#1c1c1e] rounded-xl p-1 gap-1">
          {(["supplement", "nutrition"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${tab === t
                  ? "bg-[#a3e635] text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
                }`}
            >
              {t === "supplement" ? "Supplement" : "Nutrition"}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="px-6 flex flex-col gap-5 pb-36"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-[12px] text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* TITLE / NAME */}
        <div>
          <Label required>Title / Name</Label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tab === "supplement" ? "e.g. Whey Protein Isolate" : "High Protein Egg Curry"}
            className={inputCls}
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <Label>Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief Description"
            rows={3}
            className={inputCls}
          />
        </div>

        {/* ══ SUPPLEMENT FIELDS ══════════════════════════════════════════════ */}
        {tab === "supplement" && (
          <>
            <div>
              <Label required>Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1e1e20] border border-[#2c2c2e] rounded-xl px-4 py-3 text-[13px] text-white font-medium focus:outline-none focus:border-[#a3e635]/60 transition-all appearance-none"
              >
                <option value="" className="bg-[#1e1e20]">Select category</option>
                {SUPP_CATEGORIES.map((o) => <option key={o} value={o} className="bg-[#1e1e20]">{o}</option>)}
              </select>
            </div>

            <div>
              <Label required>Usage Timing</Label>
              <select
                value={usageTiming}
                onChange={(e) => setUsageTiming(e.target.value)}
                className="w-full bg-[#1e1e20] border border-[#2c2c2e] rounded-xl px-4 py-3 text-[13px] text-white font-medium focus:outline-none focus:border-[#a3e635]/60 transition-all appearance-none"
              >
                <option value="" className="bg-[#1e1e20]">Select timing</option>
                {TIMING_OPTIONS.map((o) => <option key={o} value={o} className="bg-[#1e1e20]">{o}</option>)}
              </select>
              <textarea
                value={usageTimingNote}
                onChange={(e) => setUsageTimingNote(e.target.value)}
                placeholder="Note for usage timing"
                rows={2}
                className={`${inputCls} mt-2`}
              />
            </div>

            <div>
              <Label>Brand (Optional)</Label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Optimum Nutrition"
                className={inputCls}
              />
            </div>
          </>
        )}

        {/* ══ NUTRITION FIELDS ═══════════════════════════════════════════════ */}
        {tab === "nutrition" && (
          <>
            {/* Section label */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[13px]">🧡</span>
              <p className="text-[11px] font-extrabold text-white tracking-widest uppercase">
                Nutrition Details
              </p>
            </div>

            {/* CALORIES + PROTEIN */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Calories</Label>
                <input type="text" value={calories} onChange={(e) => setCalories(e.target.value)}
                  placeholder="kcal" className={inputCls} />
              </div>
              <div>
                <Label required>Protein</Label>
                <input type="text" value={protein} onChange={(e) => setProtein(e.target.value)}
                  placeholder="g" className={inputCls} />
              </div>
            </div>

            {/* CARBS + FATS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Carbs</Label>
                <input type="text" value={carbs} onChange={(e) => setCarbs(e.target.value)}
                  placeholder="g" className={inputCls} />
              </div>
              <div>
                <Label required>Fats</Label>
                <input type="text" value={fats} onChange={(e) => setFats(e.target.value)}
                  placeholder="g" className={inputCls} />
              </div>
            </div>

            {/* PREPARATION */}
            <div>
              <Label>Preparation Instructions (Optional)</Label>
              <textarea value={prepInstructions} onChange={(e) => setPrepInstructions(e.target.value)}
                placeholder="How to prepare...." rows={3} className={inputCls} />
            </div>
          </>
        )}
      </motion.div>

      {/* Floating Submit */}
      <div className="w-full px-6 pb-8 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent pt-10 pointer-events-none">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full pointer-events-auto bg-[#a3e635] hover:bg-[#b5f745] disabled:opacity-70 text-black font-bold text-[15px] rounded-[14px] py-[18px] flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(163,230,53,0.25)]"
        >
          {submitting ? (
            <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Submitting...</>
          ) : (
            <><Send className="w-4 h-4" />Submit For Approval</>
          )}
        </button>
      </div>
    </div>
  );
}
