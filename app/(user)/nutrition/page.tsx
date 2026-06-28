"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Droplets, Pill, Lock } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useAuth } from "@/providers/auth-provider";
import {
  getClientNutritionPlan,
  getWaterLog,
  setWaterLog,
  getMealLog,
  setMealLog,
  type MealSection as MealSectionData,
  type NutritionItem,
  type AssignedSupplement,
} from "@/lib/services/client-nutrition.service";
import { notifyTrainerNutritionDone } from "@/lib/services/notifications.service";

type DayMode = "workout" | "off";

function itemKey(mealIdx: number, itemIdx: number) {
  return `${mealIdx}_${itemIdx}`;
}

function sumChecked(meals: MealSectionData[], checked: Set<string>) {
  let kcal = 0, protein = 0, carbs = 0, fats = 0;
  meals.forEach((meal, mi) =>
    meal.items.forEach((item, ii) => {
      if (checked.has(itemKey(mi, ii))) {
        kcal += item.kcal || 0;
        protein += item.protein || 0;
        carbs += item.carbs || 0;
        fats += item.fats || 0;
      }
    })
  );
  return { kcal, protein, carbs, fats };
}

function sumAll(meals: MealSectionData[]) {
  let kcal = 0, protein = 0, carbs = 0, fats = 0;
  meals.forEach((meal) =>
    meal.items.forEach((item) => {
      kcal += item.kcal || 0;
      protein += item.protein || 0;
      carbs += item.carbs || 0;
      fats += item.fats || 0;
    })
  );
  return { kcal, protein, carbs, fats };
}

export default function NutritionPage() {
  const { user, trainerId, displayName } = useAuth();
  const [workoutMeals, setWorkoutMeals] = useState<MealSectionData[]>([]);
  const [offMeals, setOffMeals] = useState<MealSectionData[]>([]);
  const [dayMode, setDayMode] = useState<DayMode>("workout");
  const [loading, setLoading] = useState(true);
  const [workoutChecked, setWorkoutChecked] = useState<Set<string>>(new Set());
  const [offChecked, setOffChecked] = useState<Set<string>>(new Set());
  // Water — liters consumed by client; target set by trainer
  const [waterLiters, setWaterLiters] = useState(0);
  const [waterTarget, setWaterTarget] = useState(3); // default 3L if not set
  const [waterLoading, setWaterLoading] = useState(true);
  // Supplements assigned by trainer
  const [supplements, setSupplements] = useState<AssignedSupplement[]>([]);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "error">("idle");
  const [completeStatus, setCompleteStatus] = useState<"idle" | "saving" | "error">("idle");
  const [dayCompleted, setDayCompleted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getClientNutritionPlan(user.uid),
      getMealLog(user.uid),
      getWaterLog(user.uid),
    ])
      .then(([plan, log, liters]) => {
        if (plan) {
          setWorkoutMeals(plan.workoutDay.meals);
          setOffMeals(plan.offDay.meals);
          if (plan.waterTargetLiters) setWaterTarget(plan.waterTargetLiters);
          if (plan.supplements?.length) setSupplements(plan.supplements);
        }
        setWorkoutChecked(new Set(log.workout));
        setOffChecked(new Set(log.off));
        setDayCompleted(log.completed ?? false);
        setComment(log.comment ?? "");
        setWaterLiters(liters);
        // Auto-select the day that already has data for today
        if (log.off.length > 0 && log.workout.length === 0) {
          setDayMode("off");
        }
      })
      .catch(console.error)
      .finally(() => { setLoading(false); setWaterLoading(false); });
  }, [user]);

  const handleToggleMeal = useCallback((mealIdx: number, itemCount: number) => {
    const mealKeys = Array.from({ length: itemCount }, (_, ii) => itemKey(mealIdx, ii));
    if (dayMode === "workout") {
      setWorkoutChecked((prev) => {
        const allChecked = mealKeys.every((k) => prev.has(k));
        const next = new Set(prev);
        mealKeys.forEach((k) => allChecked ? next.delete(k) : next.add(k));
        return next;
      });
    } else {
      setOffChecked((prev) => {
        const allChecked = mealKeys.every((k) => prev.has(k));
        const next = new Set(prev);
        mealKeys.forEach((k) => allChecked ? next.delete(k) : next.add(k));
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayMode]);

  const STEP = 0.5; // 0.5 L increments

  async function handleAddWater() {
    if (!user) return;
    const next = Math.min(parseFloat((waterLiters + STEP).toFixed(1)), waterTarget);
    setWaterLiters(next);
    await setWaterLog(user.uid, next).catch(console.error);
  }

  async function handleRemoveWater() {
    if (!user) return;
    const next = Math.max(parseFloat((waterLiters - STEP).toFixed(1)), 0);
    setWaterLiters(next);
    await setWaterLog(user.uid, next).catch(console.error);
  }

  const allMeals = dayMode === "workout" ? workoutMeals : offMeals;
  const meals = allMeals.filter((m) => m.items.length > 0);
  const checked = dayMode === "workout" ? workoutChecked : offChecked;
  const consumed = sumChecked(allMeals, checked);
  const target = sumAll(allMeals);

  /**
   * Which day type is locked out for today.
   * If workout has any checked items → off day is locked (and vice-versa).
   * If neither has items, nothing is locked and both tabs are selectable.
   */
  const hasWorkoutItems = workoutChecked.size > 0;
  const hasOffItems = offChecked.size > 0;
  // The day that should be BLOCKED (opposite of the one with data)
  const lockedMode: DayMode | null =
    hasWorkoutItems && !hasOffItems ? "off" :
    hasOffItems && !hasWorkoutItems ? "workout" :
    null; // both empty OR both have data (legacy) → no lock

  async function handleSave() {
    if (!user) return;
    setSubmitStatus("saving");
    try {
      await setMealLog(user.uid, {
        workout: Array.from(workoutChecked),
        off: Array.from(offChecked),
        comment,
      });
      setSubmitStatus("idle");
    } catch {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 2500);
    }
  }

  async function handleCompleteDay() {
    if (!user) return;
    setCompleteStatus("saving");
    try {
      await setMealLog(user.uid, {
        workout: Array.from(workoutChecked),
        off: Array.from(offChecked),
        completed: true,
        comment,
      });
      setDayCompleted(true);
      if (trainerId) {
        notifyTrainerNutritionDone(
          trainerId,
          user.uid,
          displayName || "Client",
          dayMode
        ).catch(() => {});
      }
      setCompleteStatus("idle");
      setShowSuccess(true);
    } catch {
      setCompleteStatus("error");
      setTimeout(() => setCompleteStatus("idle"), 2500);
    }
  }


  return (
    <div className="flex flex-col min-h-screen font-sans text-white bg-[#121212] pb-24">
      <div className="px-5 pt-10 mb-4">
        <h1 className="text-[20px] font-bold text-white mb-0.5">Nutrition</h1>
        <p className="text-[12px] font-medium text-gray-500">Daily Summary</p>
      </div>

      <div className="px-5">
        {/* Day tabs */}
        <div className="flex gap-2 mb-4">
          {(["workout", "off"] as DayMode[]).map((m) => {
            const isActive = dayMode === m;
            const isLocked = lockedMode === m;
            return (
              <button
                key={m}
                onClick={() => {
                  if (!isLocked) setDayMode(m);
                }}
                disabled={isLocked}
                title={isLocked ? `You already logged ${m === "workout" ? "Workout" : "Off"} Day today` : undefined}
                className={`flex-1 py-2.5 rounded-xl text-[11px] font-extrabold tracking-wide transition-colors flex items-center justify-center gap-1.5 ${
                  isActive
                    ? "bg-[#a3e635] text-black"
                    : isLocked
                    ? "bg-[#1c1c1e] text-gray-700 cursor-not-allowed opacity-60"
                    : "bg-[#1c1c1e] text-gray-500 hover:bg-[#2a2a2c]"
                }`}
              >
                {isLocked && <Lock className="w-3 h-3" />}
                {m === "workout" ? "Workout Day" : "Off Day"}
                {isLocked && <span className="text-[9px] font-bold opacity-70">• Logged</span>}
              </button>
            );
          })}
        </div>

        {/* Macro rings */}
        <motion.div
          key={dayMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1c1c1e] rounded-2xl p-6 mb-4 flex justify-between items-center"
        >
          <MacroRing value={consumed.kcal} total={target.kcal || 1} label="CALORIES" unit="kcal" color="#f97316" trackColor="#ea580c20" />
          <MacroRing value={consumed.protein} total={target.protein || 1} label="PROTEIN" unit="g" color="#fbbf24" trackColor="#d9770620" />
          <MacroRing value={consumed.carbs} total={target.carbs || 1} label="CARBS" unit="g" color="#ef4444" trackColor="#b91c1c20" />
          <MacroRing value={consumed.fats} total={target.fats || 1} label="FATS" unit="g" color="#3b82f6" trackColor="#1d4ed820" />
        </motion.div>

        {/* Water Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1c1c1e] rounded-2xl p-4 mb-4 flex flex-col gap-3"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-[13px] font-bold text-white flex items-center gap-1">
                Water Tracker <Droplets className="w-4 h-4 text-[#3b82f6] fill-[#3b82f6]" />
              </h2>
              <p className="text-[11px] font-medium text-gray-400 mt-1">
                {waterLoading
                  ? "..."
                  : `${waterLiters}L / ${waterTarget}L`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {waterLiters > 0 && (
                <button
                  onClick={handleRemoveWater}
                  className="w-7 h-7 rounded-full bg-[#2a2a2c] text-gray-400 text-[16px] font-bold flex items-center justify-center hover:bg-[#3a3a3c] transition-colors leading-none"
                >
                  -
                </button>
              )}
              <button
                onClick={handleAddWater}
                disabled={waterLiters >= waterTarget}
                className="text-[#a3e635] text-[12px] font-bold hover:text-[#bbf758] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + 0.5L
              </button>
            </div>
          </div>
          <div className="h-2 w-full bg-[#2a2a2c] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3b82f6] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${Math.min((waterLiters / waterTarget) * 100, 100)}%` }}
            />
          </div>
        </motion.div>

        {/* Supplements */}
        {supplements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#1c1c1e] rounded-2xl p-4 mb-6"
          >
            <h2 className="text-[13px] font-bold text-white flex items-center gap-1.5 mb-3">
              <Pill className="w-4 h-4 text-[#a3e635]" />
              My Supplements
            </h2>
            <div className="space-y-3">
              {supplements.map((s) => (
                <div
                  key={s.id}
                  className="border-b border-white/5 last:border-0 pb-3 last:pb-0"
                >
                  <p className="text-[12px] font-extrabold text-white">{s.name}</p>
                  {s.brand && (
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">{s.brand}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
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
                    <p className="text-[10px] text-gray-500 italic mt-1.5 leading-snug">{s.note}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#1c1c1e] rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && meals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-[40px] mb-3"></div>
            <p className="text-[14px] font-bold text-white mb-1">
              No {dayMode === "workout" ? "Workout Day" : "Off Day"} plan yet
            </p>
            <p className="text-[11px] text-gray-500">
              Your trainer has not assigned a plan for this day type yet
            </p>
          </div>
        )}

        {/* Meal sections */}
        {!loading && meals.length > 0 && (
          <div className="flex flex-col gap-4 pb-6">
            {meals.map((meal) => {
              const origIdx = allMeals.indexOf(meal);
              return (
                <MealSectionCard
                  key={`${dayMode}-${origIdx}`}
                  title={meal.meal}
                  icon={meal.emoji}
                  items={meal.items}
                  mealIdx={origIdx}
                  checked={checked}
                  onToggleMeal={handleToggleMeal}
                />
              );
            })}

            {/* Comment */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide px-1">
                Comment for your trainer
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={dayCompleted}
                placeholder="Add a note about today's nutrition (optional)"
                rows={3}
                className="w-full bg-[#1c1c1e] rounded-2xl p-4 text-[13px] text-white placeholder:text-gray-600 border border-white/5 focus:border-[#a3e635]/40 outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleSave}
                disabled={submitStatus === "saving" || dayCompleted}
                className={`flex-1 h-14 rounded-2xl font-extrabold text-[14px] tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  submitStatus === "error"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-[#2a2a2c] text-white hover:bg-[#3a3a3c] disabled:opacity-60 disabled:cursor-not-allowed"
                }`}
              >
                {submitStatus === "saving" && (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {submitStatus === "saving" ? "Saving…" : submitStatus === "error" ? "⚠ Retry" : "Save"}
              </button>
              <div className="flex-1 flex flex-col items-center gap-1">
                <button
                  onClick={handleCompleteDay}
                  disabled={completeStatus === "saving" || dayCompleted}
                  className={`w-full h-14 rounded-2xl font-extrabold text-[14px] tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    dayCompleted
                      ? "bg-[#a3e635]/30 text-[#a3e635] cursor-not-allowed"
                      : completeStatus === "error"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-[#a3e635] text-black hover:bg-[#b5f745] disabled:opacity-60 disabled:cursor-not-allowed"
                  }`}
                >
                  {completeStatus === "saving" && (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  )}
                  {dayCompleted ? "✓ Day Completed" : completeStatus === "saving" ? "Saving…" : completeStatus === "error" ? "⚠ Retry" : "Complete Day"}
                </button>
                {!dayCompleted && (
                  <p className="text-[9px] text-gray-600 font-medium text-center leading-tight">
                    Cannot be changed once submitted
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 16, stiffness: 200 }}
            className="bg-[#1c1c1e] rounded-3xl px-8 py-10 flex flex-col items-center text-center w-full max-w-sm border border-white/5"
          >
            <div className="w-20 h-20 rounded-full bg-[#a3e635] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(163,230,53,0.3)]">
              <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-[24px] font-extrabold text-white mb-2">Day Complete!</h2>
            <p className="text-[13px] text-gray-400 font-medium mb-8">Your nutrition log has been saved</p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full bg-[#a3e635] hover:bg-[#b5f745] text-black font-bold text-[15px] rounded-2xl py-4 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(163,230,53,0.25)]"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── MacroRing ─────────────────────────────────────────────────────────────
function MacroRing({ value, total, label, unit, color, trackColor }: {
  value: number; total: number; label: string; unit: string; color: string; trackColor: string;
}) {
  const size = 66;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = total > 0 ? Math.min(value, total) / total : 0;
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="absolute inset-1 bg-[#121212] rounded-full z-0 pointer-events-none" />
        <svg className="w-full h-full -rotate-90 z-10" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute z-20 flex flex-col items-center justify-center">
          <span className="text-[12px] font-bold text-white leading-none">{value.toFixed(1)}</span>
          <span className="text-[8px] font-bold text-gray-500 leading-none mt-0.5 border-t border-gray-600/30 pt-px">
            /{total.toFixed(1)}{unit}
          </span>
        </div>
      </div>
      <span className="text-[8px] font-bold text-gray-500 tracking-wider uppercase">{label}</span>
    </div>
  );
}

// ─── MealSectionCard ────────────────────────────────────────────────────────
function MealSectionCard({ title, icon, items, mealIdx, checked, onToggleMeal }: {
  title: string;
  icon: string;
  items: NutritionItem[];
  mealIdx: number;
  checked: Set<string>;
  onToggleMeal: (mealIdx: number, itemCount: number) => void;
}) {
  const mealKcal = items.reduce((s, i) => s + (i.kcal || 0), 0);
  const mealDone = items.length > 0 && items.every((_, ii) => checked.has(`${mealIdx}_${ii}`));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1c1c1e] rounded-2xl flex flex-col"
    >
      <div className="flex justify-between items-center p-4">
        <h2 className="text-[15px] font-bold text-white">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-gray-500">
            {mealKcal} kcal
          </span>
          <button
            onClick={() => onToggleMeal(mealIdx, items.length)}
            className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full transition-all active:scale-95 ${mealDone
                ? "bg-[#a3e635]/20 text-[#a3e635]"
                : "bg-[#a3e635] text-black"
              }`}
          >
            {mealDone ? "✓ Done" : "Mark Done"}
          </button>
        </div>
      </div>

      <div className="h-px bg-[#2c2c2e] w-full" />

      {items.length > 0 ? (
        <div className="flex flex-col p-2">
          {items.map((item, itemIdx) => {
            const isChecked = checked.has(`${mealIdx}_${itemIdx}`);
            return (
              <div
                key={itemIdx}
                className="flex justify-between items-start p-3"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-200 mt-0.5 ${isChecked ? "bg-[#a3e635] border-[#a3e635]" : "bg-transparent border-gray-700"
                    }`}>
                    {isChecked && (
                      <svg viewBox="0 0 12 10" className="w-2.5 h-2.5" fill="none">
                        <path d="M1 5l3.5 3.5L11 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-[12px] font-bold mb-0.5 uppercase tracking-wider transition-colors ${isChecked ? "text-white" : "text-gray-400"}`}>
                      {item.quantity ? `${item.quantity} - ${item.name}` : item.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                      <span>{item.kcal} kcal</span>
                      {item.protein ? <><span className="text-[6px]">.</span><span>{item.protein}g Protein</span></> : null}
                      {item.carbs ? <><span className="text-[6px]">.</span><span>{item.carbs}g Carbs</span></> : null}
                      {item.fats ? <><span className="text-[6px]">.</span><span>{item.fats}g Fats</span></> : null}
                    </div>
                    {item.note && (
                      <p className="text-[10px] text-gray-600 italic mt-1 leading-snug">{item.note}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 text-center">
          <p className="text-[11px] font-medium text-gray-400">No items added</p>
        </div>
      )}
    </motion.div>
  );
}
