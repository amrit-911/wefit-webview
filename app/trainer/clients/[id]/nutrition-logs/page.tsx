"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, UtensilsCrossed } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import {
  getMealLogHistory,
  getClientNutritionPlan,
  type MealLogEntry,
  type MealSection,
} from "@/lib/services/client-nutrition.service";

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
}

function totalItems(meals: MealSection[]) {
  return meals.reduce((s, m) => s + m.items.length, 0);
}

export default function NutritionLogsListPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;

  const [logs, setLogs] = useState<MealLogEntry[]>([]);
  const [workoutTotal, setWorkoutTotal] = useState(0);
  const [offTotal, setOffTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    Promise.all([
      getMealLogHistory(clientId),
      getClientNutritionPlan(clientId),
    ]).then(([logHistory, plan]) => {
      setLogs(logHistory);
      if (plan) {
        setWorkoutTotal(totalItems(plan.workoutDay?.meals ?? []));
        setOffTotal(totalItems(plan.offDay?.meals ?? []));
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  function getBestPct(entry: MealLogEntry) {
    const wPct = workoutTotal > 0 ? Math.round((entry.workout.length / workoutTotal) * 100) : 0;
    const oPct = offTotal > 0 ? Math.round((entry.off.length / offTotal) * 100) : 0;
    return Math.max(wPct, oPct);
  }

  function getBadgeStyle(pct: number) {
    if (pct >= 80) return "bg-[#a3e635]/20 text-[#a3e635]";
    if (pct >= 50) return "bg-yellow-500/20 text-yellow-400";
    return "bg-gray-500/20 text-gray-400";
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-12">
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

      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-[#a3e635]/15 flex items-center justify-center shrink-0">
          <UtensilsCrossed className="w-4 h-4 text-[#a3e635]" />
        </div>
        <h1 className="text-[22px] font-extrabold text-white tracking-tight">
          Nutrition Log
        </h1>
      </div>
      <p className="text-[12px] text-gray-500 font-medium mb-7 ml-12">
        {loading
          ? "Loading…"
          : `${logs.length} log${logs.length !== 1 ? "s" : ""} submitted`}
      </p>

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-[#1c1c1e] rounded-2xl h-[84px] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1c1c1e] flex items-center justify-center mb-5">
            <UtensilsCrossed className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-[15px] font-extrabold text-white mb-1">No nutrition logs yet</p>
          <p className="text-[12px] text-gray-500">
            Client hasn&apos;t submitted any nutrition logs
          </p>
        </div>
      )}

      {/* List */}
      {!loading && logs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {logs.map((entry, idx) => {
            const wChecked = entry.workout.length;
            const oChecked = entry.off.length;
            const wPct = workoutTotal > 0 ? Math.round((wChecked / workoutTotal) * 100) : 0;
            const oPct = offTotal > 0 ? Math.round((oChecked / offTotal) * 100) : 0;
            const bestPct = getBestPct(entry);
            const hasWorkout = wChecked > 0;
            const hasOff = oChecked > 0;

            return (
              <button
                key={entry.date}
                onClick={() =>
                  router.push(`/trainer/clients/${clientId}/nutrition-logs/${entry.date}`)
                }
                className="w-full bg-[#1c1c1e] rounded-2xl px-4 py-4 flex items-center justify-between border border-white/5 hover:border-[#a3e635]/30 hover:bg-[#222] transition-all group text-left"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Index circle */}
                  <div className="w-10 h-10 rounded-full bg-[#a3e635] flex items-center justify-center text-black font-extrabold text-[13px] shrink-0 shadow-[0_0_12px_rgba(163,230,53,0.2)]">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="text-[13px] font-extrabold text-white tracking-wide truncate">
                        {formatDisplayDate(entry.date)}
                      </h4>
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${getBadgeStyle(bestPct)}`}>
                        {bestPct}% done
                      </span>
                    </div>

                    {/* Compact progress bars */}
                    <div className="space-y-1.5">
                      {hasWorkout && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-gray-500 w-16 shrink-0">💪 Workout</span>
                          <div className="flex-1 h-1 bg-[#2a2a2c] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#a3e635] rounded-full"
                              style={{ width: `${Math.min(100, wPct)}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-gray-400 w-14 text-right shrink-0">
                            {wChecked}{workoutTotal > 0 ? `/${workoutTotal}` : ""}
                          </span>
                        </div>
                      )}
                      {hasOff && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-gray-500 w-16 shrink-0">🛌 Off Day</span>
                          <div className="flex-1 h-1 bg-[#2a2a2c] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#3b82f6] rounded-full"
                              style={{ width: `${Math.min(100, oPct)}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-gray-400 w-14 text-right shrink-0">
                            {oChecked}{offTotal > 0 ? `/${offTotal}` : ""}
                          </span>
                        </div>
                      )}
                      {!hasWorkout && !hasOff && (
                        <p className="text-[10px] text-gray-600 font-medium">No meals marked</p>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#a3e635] transition-colors ml-3 shrink-0" />
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
