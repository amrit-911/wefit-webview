"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Droplets, Pill } from "lucide-react";
import {
  getClientNutritionPlan,
  type MealSection,
  type DayNutrition,
  type AssignedSupplement,
} from "@/lib/services/client-nutrition.service";

interface Props {
  clientId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: any;
}

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

function hasMeals(day: DayNutrition) {
  return day.meals.length > 0;
}

export function NutritionTab({ clientId, router }: Props) {
  const [workoutDay, setWorkoutDay] = useState<DayNutrition>({ meals: [] });
  const [offDay, setOffDay] = useState<DayNutrition>({ meals: [] });
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("workout");
  const [waterTargetLiters, setWaterTargetLiters] = useState<number | null>(null);
  const [supplements, setSupplements] = useState<AssignedSupplement[]>([]);

  useEffect(() => {
    if (!clientId) return;
    getClientNutritionPlan(clientId)
      .then((plan) => {
        if (plan) {
          setWorkoutDay(plan.workoutDay);
          setOffDay(plan.offDay);
          setWaterTargetLiters(plan.waterTargetLiters ?? null);
          setSupplements(plan.supplements ?? []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1c1c1e] rounded-xl p-4 h-[72px] animate-pulse" />
        ))}
      </div>
    );
  }

  const currentDay = mode === "workout" ? workoutDay : offDay;
  const totals = computeTotals(currentDay.meals);
  const hasPlan = hasMeals(currentDay);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
          Meal Plan
        </p>
        <button
          onClick={() =>
            router.push(`/trainer/clients/${clientId}/assign-nutrition?mode=${mode}`)
          }
          className="text-[11px] font-bold text-[#a3e635] hover:text-[#b5f745] transition-colors"
        >
          {hasPlan ? "Edit Plan" : "Assign Plan"}
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-5">
        {(["workout", "off"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-extrabold tracking-wide transition-colors ${
              mode === m
                ? "bg-[#a3e635] text-black"
                : "bg-[#1c1c1e] text-gray-500 hover:bg-[#2a2a2c]"
            }`}
          >
            {m === "workout" ? "Workout Day" : "Off Day"}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!hasPlan && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-[44px] mb-3"></div>
          <p className="text-[14px] font-bold text-white mb-1">
            No {mode === "workout" ? "Workout Day" : "Off Day"} plan yet
          </p>
          <p className="text-[12px] text-gray-500 mb-6">
            Assign a meal plan to get started
          </p>
          <button
            onClick={() =>
              router.push(`/trainer/clients/${clientId}/assign-nutrition?mode=${mode}`)
            }
            className="px-6 py-3 bg-[#a3e635] text-black font-bold text-[13px] rounded-xl hover:bg-[#b5f745] transition-colors"
          >
            Assign {mode === "workout" ? "Workout Day" : "Off Day"} Plan
          </button>
        </div>
      )}

      {/* Meal sections */}
      {hasPlan && (
        <div className="space-y-5">
          {currentDay.meals.map((section, i, arr) => (
            <motion.div
              key={`${section.meal}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[14px] font-extrabold text-white">{section.meal}</p>
                <span className="ml-auto text-[10px] text-gray-500 font-medium">
                  {section.items.length} item{section.items.length !== 1 ? "s" : ""}
                </span>
              </div>

              {section.items.length === 0 ? (
                <div className="bg-[#1c1c1e] rounded-xl px-4 py-3 border border-dashed border-white/10 flex items-center justify-center">
                  <span className="text-[11px] text-gray-600 font-medium">No items added</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {section.items.map((item, j) => (
                    <div
                      key={`${item.name}-${j}`}
                      className="bg-[#1c1c1e] rounded-xl p-4 border border-white/5"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
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
                        <span className="text-[10px] text-gray-400 font-medium">{item.kcal} kcal</span>
                        <span className="text-gray-600 text-[10px]">•</span>
                        <span className="text-[10px] text-gray-400 font-medium">{item.protein}g Protein</span>
                        <span className="text-gray-600 text-[10px]">•</span>
                        <span className="text-[10px] text-gray-400 font-medium">{item.carbs}g Carbs</span>
                        <span className="text-gray-600 text-[10px]">•</span>
                        <span className="text-[10px] text-gray-400 font-medium">{item.fats}g Fats</span>
                      </div>
                      {item.note && (
                        <p className="text-[10px] text-gray-500 italic mt-1.5 leading-snug">{item.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {i < arr.length - 1 && (
                <div className="mt-4 border-b border-white/5" />
              )}
            </motion.div>
          ))}

          {/* Daily Totals */}
          <div className="mt-2 mb-2">
            <p className="text-[10px] font-extrabold text-white tracking-widest uppercase mb-3">
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
                  className="bg-[#1c1c1e] rounded-xl p-3 flex flex-col items-center gap-0.5 border border-white/5"
                >
                  <span className="text-[16px] font-extrabold text-white leading-none">{value}</span>
                  <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Water target summary */}
          {waterTargetLiters && (
            <div className="bg-[#1c1c1e] rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5">
              <Droplets className="w-4 h-4 text-[#3b82f6] shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-white">Water Target</p>
                <p className="text-[10px] text-gray-500 font-medium">{waterTargetLiters} Liters / day</p>
              </div>
            </div>
          )}

          {/* Supplements summary */}
          {supplements.length > 0 && (
            <div className="bg-[#1c1c1e] rounded-xl px-4 py-3 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-4 h-4 text-[#a3e635] shrink-0" />
                <p className="text-[11px] font-bold text-white">
                  Supplements ({supplements.length})
                </p>
              </div>
              <div className="space-y-2">
                {supplements.map((s) => (
                  <div key={s.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#a3e635] mt-1.5 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold text-white">{s.name}</span>
                      {(s.dosage || s.frequency) && (
                        <span className="text-[10px] text-gray-500 ml-1.5">
                          {[s.dosage, s.frequency].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Plan button */}
          <div className="mt-4 mb-4">
            <button
              onClick={() =>
                router.push(`/trainer/clients/${clientId}/assign-nutrition?mode=${mode}`)
              }
              className="w-full h-12 bg-[#1c1c1e] hover:bg-[#2a2a2c] border border-[#a3e635]/30 rounded-xl text-[13px] font-bold text-[#a3e635] transition-colors flex items-center justify-center gap-2"
            >
              Edit {mode === "workout" ? "Workout Day" : "Off Day"} Plan
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
