"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Droplets } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import {
  getMealLogByDate,
  getWaterLogByDate,
  getClientNutritionPlan,
  type MealSection,
  type NutritionItem,
} from "@/lib/services/client-nutrition.service";

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type DayMode = "workout" | "off";

function itemKey(mealIdx: number, itemIdx: number) {
  return `${mealIdx}_${itemIdx}`;
}

export default function NutritionLogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;
  const date = params?.date as string;

  const [workoutMeals, setWorkoutMeals] = useState<MealSection[]>([]);
  const [offMeals, setOffMeals] = useState<MealSection[]>([]);
  const [workoutChecked, setWorkoutChecked] = useState<Set<string>>(new Set());
  const [offChecked, setOffChecked] = useState<Set<string>>(new Set());
  const [waterLiters, setWaterLiters] = useState(0);
  const [waterTarget, setWaterTarget] = useState(3);
  const [activeTab, setActiveTab] = useState<DayMode>("workout");
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!clientId || !date) { setLoading(false); return; }
    Promise.all([
      getMealLogByDate(clientId, date),
      getWaterLogByDate(clientId, date),
      getClientNutritionPlan(clientId),
    ]).then(([mealLog, liters, plan]) => {
      setWorkoutChecked(new Set(mealLog.workout));
      setOffChecked(new Set(mealLog.off));
      setComment(mealLog.comment ?? "");
      setWaterLiters(liters);
      if (plan) {
        setWorkoutMeals(plan.workoutDay?.meals ?? []);
        setOffMeals(plan.offDay?.meals ?? []);
        if (plan.waterTargetLiters) setWaterTarget(plan.waterTargetLiters);
      }
      // Auto-select the tab that has data
      if (mealLog.workout.length === 0 && mealLog.off.length > 0) {
        setActiveTab("off");
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId, date]);

  const allMeals = activeTab === "workout" ? workoutMeals : offMeals;
  const meals = allMeals.filter((m) => m.items.length > 0);
  const checked = activeTab === "workout" ? workoutChecked : offChecked;

  // Macro totals for consumed vs target
  function sumMacros(mealsArr: MealSection[], checkedSet: Set<string>) {
    let kcal = 0, protein = 0, carbs = 0, fats = 0;
    mealsArr.forEach((meal, mi) =>
      meal.items.forEach((item, ii) => {
        if (checkedSet.has(itemKey(mi, ii))) {
          kcal += item.kcal || 0;
          protein += item.protein || 0;
          carbs += item.carbs || 0;
          fats += item.fats || 0;
        }
      })
    );
    return { kcal, protein, carbs, fats };
  }

  function sumAll(mealsArr: MealSection[]) {
    let kcal = 0, protein = 0, carbs = 0, fats = 0;
    mealsArr.forEach((m) =>
      m.items.forEach((i) => {
        kcal += i.kcal || 0;
        protein += i.protein || 0;
        carbs += i.carbs || 0;
        fats += i.fats || 0;
      })
    );
    return { kcal, protein, carbs, fats };
  }

  const consumed = sumMacros(allMeals, checked);
  const target = sumAll(allMeals);
  const workoutCount = workoutChecked.size;
  const offCount = offChecked.size;

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          back
        </button>
      </div>

      <h1 className="text-[20px] font-extrabold text-white tracking-tight mb-0.5">
        Nutrition Detail
      </h1>
      <p className="text-[12px] text-gray-500 font-medium mb-6">
        {loading ? "Loading…" : formatDisplayDate(date)}
      </p>

      {/* Skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="bg-[#1c1c1e] rounded-2xl h-32 animate-pulse" />
          <div className="bg-[#1c1c1e] rounded-2xl h-10 animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1c1c1e] rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Macro summary */}
          <div className="bg-[#1c1c1e] rounded-2xl p-5 mb-4 border border-white/5">
            <p className="text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-4">
              {activeTab === "workout" ? "💪 Workout Day" : "🛌 Off Day"} — Macros
            </p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "KCAL", value: Math.round(consumed.kcal), total: Math.round(target.kcal), color: "#f97316" },
                { label: "PROTEIN", value: Math.round(consumed.protein), total: Math.round(target.protein), color: "#fbbf24", unit: "g" },
                { label: "CARBS", value: Math.round(consumed.carbs), total: Math.round(target.carbs), color: "#ef4444", unit: "g" },
                { label: "FATS", value: Math.round(consumed.fats), total: Math.round(target.fats), color: "#3b82f6", unit: "g" },
              ].map(({ label, value, total, color, unit = "" }) => {
                const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
                return (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className="relative w-14 h-14">
                      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                        <circle cx="28" cy="28" r="22" fill="none" stroke={`${color}22`} strokeWidth="5" />
                        <circle
                          cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="5"
                          strokeDasharray={138.2}
                          strokeDashoffset={138.2 - (pct / 100) * 138.2}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-extrabold text-white leading-none">{value}</span>
                        <span className="text-[7px] text-gray-500 leading-none mt-0.5">/{total}{unit}</span>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold text-gray-500 tracking-wider">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Water tracker */}
          <div className="bg-[#1c1c1e] rounded-2xl p-4 mb-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-[#3b82f6] fill-[#3b82f6]" />
                <span className="text-[12px] font-bold text-white">Water</span>
              </div>
              <span className="text-[12px] font-extrabold text-white">
                {waterLiters}L
                <span className="text-gray-500 font-medium"> / {waterTarget}L</span>
              </span>
            </div>
            <div className="h-2 w-full bg-[#2a2a2c] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3b82f6] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (waterLiters / waterTarget) * 100)}%` }}
              />
            </div>
          </div>

          {/* Client comment */}
          {comment && (
            <div className="bg-[#1c1c1e] rounded-2xl p-4 mb-4 border border-white/5">
              <p className="text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-2">
                💬 Client Comment
              </p>
              <p className="text-[12px] text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">
                {comment}
              </p>
            </div>
          )}

          {/* Day tabs */}
          <div className="flex gap-2 mb-4">
            {(["workout", "off"] as DayMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setActiveTab(m)}
                className={`flex-1 py-2.5 rounded-xl text-[11px] font-extrabold tracking-wide transition-colors relative ${
                  activeTab === m
                    ? "bg-[#a3e635] text-black"
                    : "bg-[#1c1c1e] text-gray-500 hover:bg-[#2a2a2c]"
                }`}
              >
                {m === "workout" ? "Workout Day" : "Off Day"}
                {/* badge */}
                {m === "workout" && workoutCount > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold ${
                    activeTab === "workout" ? "bg-black/20 text-black" : "bg-[#a3e635]/20 text-[#a3e635]"
                  }`}>{workoutCount}</span>
                )}
                {m === "off" && offCount > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold ${
                    activeTab === "off" ? "bg-black/20 text-black" : "bg-[#a3e635]/20 text-[#a3e635]"
                  }`}>{offCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Meal sections */}
          {meals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-[13px] font-bold text-white mb-1">
                No {activeTab === "workout" ? "Workout Day" : "Off Day"} data
              </p>
              <p className="text-[11px] text-gray-500">
                No meals were marked on this day
              </p>
            </div>
          )}

          {meals.length > 0 && (
            <div className="space-y-3">
              {meals.map((meal) => {
                const origIdx = allMeals.indexOf(meal);
                const mealChecked = meal.items.filter((_, ii) =>
                  checked.has(itemKey(origIdx, ii))
                ).length;
                const mealDone = mealChecked === meal.items.length;

                return (
                  <div
                    key={`${activeTab}-${origIdx}`}
                    className={`bg-[#1c1c1e] rounded-2xl border transition-all ${
                      mealDone ? "border-[#a3e635]/20" : "border-white/5"
                    }`}
                  >
                    {/* Meal header */}
                    <div className="flex justify-between items-center p-4 pb-3">
                      <div className="flex items-center gap-2">
                        {meal.emoji && (
                          <span className="text-[16px]">{meal.emoji}</span>
                        )}
                        <h3 className="text-[14px] font-extrabold text-white">{meal.meal}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500">
                          {mealChecked}/{meal.items.length} items
                        </span>
                        <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full ${
                          mealDone
                            ? "bg-[#a3e635]/20 text-[#a3e635]"
                            : mealChecked > 0
                            ? "bg-yellow-500/15 text-yellow-400"
                            : "bg-gray-500/15 text-gray-400"
                        }`}>
                          {mealDone ? "✓ Done" : mealChecked > 0 ? "Partial" : "Missed"}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-[#2c2c2e] mx-4" />

                    {/* Items */}
                    <div className="p-2">
                      {meal.items.map((item, itemIdx) => {
                        const isChecked = checked.has(itemKey(origIdx, itemIdx));
                        return (
                          <div
                            key={itemIdx}
                            className="flex items-start gap-3 p-3"
                          >
                            {/* Checkbox indicator (read-only) */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 mt-0.5 ${
                              isChecked
                                ? "bg-[#a3e635] border-[#a3e635]"
                                : "bg-transparent border-gray-700"
                            }`}>
                              {isChecked && (
                                <svg viewBox="0 0 12 10" className="w-2.5 h-2.5" fill="none">
                                  <path d="M1 5l3.5 3.5L11 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-[12px] font-bold mb-0.5 uppercase tracking-wide ${
                                isChecked ? "text-white" : "text-gray-500"
                              }`}>
                                {item.quantity ? `${item.quantity} – ${item.name}` : item.name}
                              </p>
                              <MacroChips item={item} />
                              {item.note && (
                                <p className="text-[10px] text-gray-600 italic mt-1 leading-snug">{item.note}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function MacroChips({ item }: { item: NutritionItem }) {
  const chips = [
    { label: `${item.kcal} kcal`, show: true },
    { label: `${item.protein}g Protein`, show: !!item.protein },
    { label: `${item.carbs}g Carbs`, show: !!item.carbs },
    { label: `${item.fats}g Fats`, show: !!item.fats },
  ].filter((c) => c.show);

  return (
    <div className="flex flex-wrap items-center gap-1 mt-0.5">
      {chips.map((chip, i) => (
        <span key={i} className="text-[9px] font-medium text-gray-500">
          {i > 0 && <span className="mr-1 text-gray-700">·</span>}
          {chip.label}
        </span>
      ))}
    </div>
  );
}
