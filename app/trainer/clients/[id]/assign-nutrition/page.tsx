"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Check, Pencil, Trash2, Plus, Search, X, Droplets,
} from "lucide-react";
import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  getClientNutritionPlan,
  saveClientNutritionPlan,
  type MealSection,
  type DayNutrition,
  type AssignedSupplement,
  nextMealName,
} from "@/lib/services/client-nutrition.service";
import {
  getSupplements,
  type SupplementItem,
} from "@/lib/services/supplements.service";
import { getMemberById } from "@/lib/services/members.service";

type Mode = "workout" | "off";

function computeTotals(meals: MealSection[]) {
  const totals = meals.reduce(
    (acc, m) => {
      m.items.forEach((item) => {
        acc.kcal += item.kcal || 0;
        acc.protein += item.protein || 0;
        acc.carbs += item.carbs || 0;
        acc.fats += item.fats || 0;
      });
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fats: 0 }
  );
  return {
    kcal: Math.round(totals.kcal),
    protein: Number(totals.protein.toFixed(1)),
    carbs: Number(totals.carbs.toFixed(1)),
    fats: Number(totals.fats.toFixed(1))
  };
}

// ─── Supplement inline panel ───────────────────────────────────────────────
interface SupplementPanelProps {
  supp: SupplementItem;
  onAdd: (s: AssignedSupplement) => void;
  onClose: () => void;
}

function SupplementPanel({ supp, onAdd, onClose }: SupplementPanelProps) {
  const [dosage, setDosage] = useState(supp.dosage ?? "");
  const [frequency, setFrequency] = useState(supp.frequency ?? "");
  const [usageTiming, setUsageTiming] = useState(supp.usageTiming ?? "");
  const [note, setNote] = useState("");

  const cls =
    "w-full bg-[#1c1c1e] border border-white/8 rounded-xl px-3 py-2.5 text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/40 transition-all";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-[#1a1a1c] border border-[#a3e635]/20 rounded-2xl p-4 mt-3 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-extrabold text-white">{supp.name}</p>
          {supp.brand && (
            <p className="text-[10px] text-gray-500 font-medium">{supp.brand}</p>
          )}
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-extrabold text-gray-500 tracking-widest uppercase block mb-1">
            Dosage
          </label>
          <input
            type="text"
            placeholder={supp.dosage ?? "e.g. 5g"}
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className={cls}
          />
        </div>
        <div>
          <label className="text-[9px] font-extrabold text-gray-500 tracking-widest uppercase block mb-1">
            Frequency
          </label>
          <input
            type="text"
            placeholder={supp.frequency ?? "e.g. Once daily"}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className={cls}
          />
        </div>
      </div>

      <div>
        <label className="text-[9px] font-extrabold text-gray-500 tracking-widest uppercase block mb-1">
          Timing
        </label>
        <input
          type="text"
          placeholder={supp.usageTiming ?? "e.g. Pre-Workout"}
          value={usageTiming}
          onChange={(e) => setUsageTiming(e.target.value)}
          className={cls}
        />
      </div>

      <div>
        <label className="text-[9px] font-extrabold text-gray-500 tracking-widest uppercase block mb-1">
          Note (optional)
        </label>
        <textarea
          rows={2}
          placeholder="Custom note for this client…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={cls}
        />
      </div>

      <button
        onClick={() =>
          onAdd({
            id: supp.id,
            name: supp.name,
            brand: supp.brand,
            dosage: dosage || supp.dosage,
            frequency: frequency || supp.frequency,
            usageTiming: usageTiming || supp.usageTiming,
            note: note || undefined,
          })
        }
        className="w-full py-3 bg-[#a3e635] text-black font-extrabold text-[12px] rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#b5f745] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={3} />
        Add Supplement
      </button>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
function AssignNutritionContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params?.id as string;
  const { user } = useAuth();

  const initialMode = (searchParams.get("mode") as Mode) ?? "workout";

  const [mode, setMode] = useState<Mode>(initialMode);
  const defaultMeals = [
    ...Array.from({ length: 7 }).map((_, i) => ({ meal: `Meal ${i + 1}`, items: [], emoji: "" })),
    { meal: "Pre-Workout", items: [], emoji: "" },
    { meal: "Post Workout", items: [], emoji: "" },
  ];
  const [workoutDay, setWorkoutDay] = useState<DayNutrition>({ meals: defaultMeals });
  const [offDay, setOffDay] = useState<DayNutrition>({ meals: defaultMeals });
  const [clientName, setClientName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Water target
  const [waterTargetLiters, setWaterTargetLiters] = useState<string>("");

  // Supplements
  const [allSupplements, setAllSupplements] = useState<SupplementItem[]>([]);
  const [suppSearch, setSuppSearch] = useState("");
  const [showSuppDropdown, setShowSuppDropdown] = useState(false);
  const [selectedSupp, setSelectedSupp] = useState<SupplementItem | null>(null);
  const [assignedSupplements, setAssignedSupplements] = useState<AssignedSupplement[]>([]);
  const suppSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientId) return;
    Promise.all([
      getClientNutritionPlan(clientId),
      getMemberById(clientId),
      getSupplements(),
    ])
      .then(([plan, member, supps]) => {
        if (plan) {
          const ensureDefaultMeals = (day: DayNutrition) => {
            const stored = day.meals;
            const result = defaultMeals.map((def) => {
              const existing = stored.find((m) => m.meal === def.meal);
              return existing ?? def;
            });
            // Preserve any extra meals not in the default list
            const extraMeals = stored.filter((m) => !defaultMeals.some((d) => d.meal === m.meal));
            return { ...day, meals: [...result, ...extraMeals] };
          };
          setWorkoutDay(ensureDefaultMeals(plan.workoutDay));
          setOffDay(ensureDefaultMeals(plan.offDay));
          if (plan.waterTargetLiters) {
            setWaterTargetLiters(String(plan.waterTargetLiters));
          }
          if (plan.supplements?.length) {
            setAssignedSupplements(plan.supplements);
          }
        }
        if (member) setClientName(member.name);
        setAllSupplements(supps);
      })
      .catch(console.error)
      .finally(() => setLoadingPlan(false));
  }, [clientId]);

  // Close supplement dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (suppSearchRef.current && !suppSearchRef.current.contains(e.target as Node)) {
        setShowSuppDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const currentDay = mode === "workout" ? workoutDay : offDay;
  const setCurrentDay = mode === "workout" ? setWorkoutDay : setOffDay;

  // ── Meal management ──────────────────────────────────────────────────────
  const handleRemoveItem = (mealIndex: number, itemIndex: number) => {
    setCurrentDay((prev) => ({
      meals: prev.meals.map((m, i) =>
        i === mealIndex
          ? { ...m, items: m.items.filter((_, j) => j !== itemIndex) }
          : m
      ),
    }));
  };

  // ── Supplement management ─────────────────────────────────────────────────
  const filteredSupplements = allSupplements.filter(
    (s) =>
      s.name.toLowerCase().includes(suppSearch.toLowerCase()) &&
      !assignedSupplements.some((a) => a.id === s.id)
  );

  const handleAddSupplement = (s: AssignedSupplement) => {
    setAssignedSupplements((prev) => [...prev, s]);
    setSelectedSupp(null);
    setSuppSearch("");
  };

  const handleRemoveSupplement = (id: string) => {
    setAssignedSupplements((prev) => prev.filter((s) => s.id !== id));
  };

  const totals = computeTotals(currentDay.meals);

  const handleSave = async (shouldNavigateBack = true) => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const waterVal = waterTargetLiters ? Number(waterTargetLiters) : undefined;
      await saveClientNutritionPlan(
        clientId,
        user.uid,
        workoutDay,
        offDay,
        waterVal,
        assignedSupplements
      );
      if (shouldNavigateBack) {
        router.back();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFoodClick = async (mealName: string) => {
    await handleSave(false);
    router.push(`/trainer/clients/${clientId}/add-food?meal=${encodeURIComponent(mealName)}&mode=${mode}`);
  };

  const handleEditFoodClick = async (mealName: string, mealIndex: number, itemIndex: number) => {
    await handleSave(false);
    router.push(`/trainer/clients/${clientId}/add-food?meal=${encodeURIComponent(mealName)}&mode=${mode}&editMeal=${mealIndex}&editItem=${itemIndex}`);
  };

  if (loadingPlan) {
    return (
      <div className="min-h-dvh bg-[#121212] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#121212] font-sans pb-32">
      <div className="px-5 pt-12">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          back
        </button>

        <h1 className="text-[24px] font-extrabold text-white mb-1">Nutrition Plan</h1>
        <p className="text-[12px] text-gray-400 mb-5">
          {clientName ? `For ${clientName}` : "Loading..."}
        </p>

        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-[12px] text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-2 mb-6">
          {(["workout", "off"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-3 rounded-xl text-[11px] font-extrabold tracking-wide transition-colors ${mode === m
                  ? "bg-[#a3e635] text-black"
                  : "bg-[#1c1c1e] text-gray-500 hover:bg-[#2a2a2c]"
                }`}
            >
              {m === "workout" ? "Workout Day" : "Off Day"}
            </button>
          ))}
        </div>

        {/* Meal sections */}
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {currentDay.meals.map((section, mealIndex) => (
              <motion.div
                key={`${mode}-meal-${mealIndex}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.2, delay: mealIndex * 0.03 }}
              >
                {/* Meal header */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <p className="text-[16px] font-extrabold text-white truncate">
                      {section.meal}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {/* Add food */}
                    <button
                      onClick={() => handleAddFoodClick(section.meal)}
                      className="text-[11px] font-bold text-[#a3e635] hover:text-[#b5f745] transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Food items */}
                <AnimatePresence>
                  {section.items.map((item, itemIndex) => (
                    <motion.div
                      key={`${item.name}-${itemIndex}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                      className="bg-[#1c1c1e] rounded-xl p-4 mb-2 border border-white/5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <p className="text-[12px] font-extrabold text-white">
                              {item.name}
                            </p>
                            {item.quantity && (
                              <span className="text-[10px] font-bold text-[#a3e635] bg-[#a3e635]/10 px-1.5 py-0.5 rounded-md">
                                {item.quantity}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-500 font-medium">
                              {item.kcal} kcal
                            </span>
                            <span className="text-gray-700 text-[10px]">•</span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {item.protein}g Protein
                            </span>
                            <span className="text-gray-700 text-[10px]">•</span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {item.carbs}g Carbs
                            </span>
                            <span className="text-gray-700 text-[10px]">•</span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {item.fats}g Fats
                            </span>
                          </div>
                          {item.note && (
                            <p className="text-[10px] text-gray-500 italic mt-1 leading-snug">
                              {item.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleEditFoodClick(section.meal, mealIndex, itemIndex)}
                            className="w-7 h-7 rounded-lg bg-[#a3e635]/10 hover:bg-[#a3e635]/25 flex items-center justify-center transition-colors"
                          >
                            <Pencil className="w-3 h-3 text-[#a3e635]" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(mealIndex, itemIndex)}
                            className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                          >
                            <span className="text-red-400 text-[16px] font-bold leading-none">
                              ×
                            </span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {mealIndex < currentDay.meals.length - 1 && (
                  <div className="border-b border-white/5 mt-2 mb-1" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Daily Totals */}
        {currentDay.meals.some(m => m.items.length > 0) && (
          <div className="mt-6 mb-6">
            <p className="text-[11px] font-extrabold text-white tracking-widest uppercase mb-3">
              Daily Totals
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Kcal", value: totals.kcal.toString() },
                { label: "Protein", value: `${totals.protein}g` },
                { label: "Carbs", value: `${totals.carbs}g` },
                { label: "Fats", value: `${totals.fats}g` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-[#1c1c1e] rounded-2xl p-4 flex flex-col items-center gap-1 border border-white/5"
                >
                  <span className="text-[18px] font-extrabold text-white leading-none">
                    {value}
                  </span>
                  <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide mt-1">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Water Intake ──────────────────────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-[11px] font-extrabold text-white tracking-widest uppercase mb-3">
            Add Water Intake
          </p>
          <div className="bg-[#1c1c1e] rounded-2xl p-4 flex items-center gap-3 border border-white/5">
            <Droplets className="w-5 h-5 text-[#3b82f6] shrink-0" />
            <input
              type="number"
              min={0}
              step={0.5}
              placeholder="e.g. 3"
              value={waterTargetLiters}
              onChange={(e) => setWaterTargetLiters(e.target.value)}
              className="flex-1 bg-transparent text-[14px] font-bold text-white placeholder:text-gray-600 focus:outline-none"
            />
            <span className="text-[12px] text-gray-500 font-medium shrink-0">Liters / day</span>
          </div>
        </div>

        {/* ── Add Supplement ──────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-[11px] font-extrabold text-white tracking-widest uppercase mb-3">
            Add Supplement
          </p>

          {/* Search box */}
          <div ref={suppSearchRef} className="relative mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Supplement from Library"
                value={suppSearch}
                onChange={(e) => {
                  setSuppSearch(e.target.value);
                  setShowSuppDropdown(true);
                  setSelectedSupp(null);
                }}
                onFocus={() => setShowSuppDropdown(true)}
                className="w-full h-12 bg-[#1c1c1e] rounded-xl pl-10 pr-10 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/40 border border-white/5 transition-all"
              />
              {suppSearch && (
                <button
                  onClick={() => {
                    setSuppSearch("");
                    setSelectedSupp(null);
                    setShowSuppDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {showSuppDropdown && suppSearch && filteredSupplements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#1c1c1e] border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-[220px] overflow-y-auto"
                >
                  {filteredSupplements.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSupp(s);
                        setSuppSearch(s.name);
                        setShowSuppDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#2a2a2c] transition-colors border-b border-white/5 last:border-0"
                    >
                      <p className="text-[12px] font-bold text-white">{s.name}</p>
                      {(s.brand || s.category) && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {[s.brand, s.category].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
              {showSuppDropdown && suppSearch && filteredSupplements.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#1c1c1e] border border-white/10 rounded-xl px-4 py-4 text-center shadow-xl"
                >
                  <p className="text-[12px] text-gray-500">No supplements found</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Inline supplement detail panel */}
          <AnimatePresence>
            {selectedSupp && (
              <SupplementPanel
                key={selectedSupp.id}
                supp={selectedSupp}
                onAdd={handleAddSupplement}
                onClose={() => { setSelectedSupp(null); setSuppSearch(""); }}
              />
            )}
          </AnimatePresence>

          {/* Assigned supplements list */}
          {assignedSupplements.length > 0 && (
            <div className="space-y-2 mt-3">
              {assignedSupplements.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="bg-[#1c1c1e] border border-white/5 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-extrabold text-white">{s.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {s.dosage && (
                        <span className="text-[9px] font-bold text-[#a3e635] bg-[#a3e635]/10 px-2 py-0.5 rounded-full">
                          {s.dosage}
                        </span>
                      )}
                      {s.frequency && (
                        <span className="text-[9px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                          {s.frequency}
                        </span>
                      )}
                      {s.usageTiming && (
                        <span className="text-[9px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                          {s.usageTiming}
                        </span>
                      )}
                    </div>
                    {s.note && (
                      <p className="text-[10px] text-gray-500 italic mt-1">{s.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveSupplement(s.id)}
                    className="w-7 h-7 rounded-lg bg-red-500/15 hover:bg-red-500/30 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed save button */}
      <div className="w-full max-w-md mx-auto p-4 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent pt-8 pointer-events-none">
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="w-full h-14 pointer-events-auto bg-[#a3e635] hover:bg-[#b5f745] disabled:opacity-70 text-black font-bold text-[15px] rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,230,53,0.2)]"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" strokeWidth={3} />
              Save &amp; Assign Nutrition
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AssignNutritionPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#121212]" />}>
      <AssignNutritionContent />
    </Suspense>
  );
}
