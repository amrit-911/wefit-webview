"use client";

import { ArrowLeft, Footprints } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getWorkoutLogById, type WorkoutLog } from "@/lib/services/workout-log.service";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function TrainerClientWorkoutLogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const logId = params?.logId as string;

  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!logId) return;
    getWorkoutLogById(logId)
      .then(setLog)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [logId]);

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-12">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-3 h-3 mr-1" />
        back
      </button>

      {/* Header */}
      {log && (
        <div className="mb-6">
          <h1 className="text-[20px] font-extrabold text-white tracking-tight mb-1">
            {log.dayHeader
              ? `${log.dayHeader.toUpperCase()} — ${log.dayLabel.toUpperCase()}`
              : log.dayLabel.toUpperCase()}
          </h1>
          <p className="text-[12px] text-gray-400 font-medium">{formatDate(log.date)}</p>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1c1c1e] rounded-2xl h-[120px] animate-pulse" />
          ))}
        </div>
      )}

      {/* Not found */}
      {!loading && !log && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-[48px] mb-4">🏋️</div>
          <p className="text-[14px] font-bold text-white mb-1">Log not found</p>
        </div>
      )}

      {/* Content */}
      {!loading && log && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {/* Steps */}
          {log.steps != null && log.steps > 0 && (
            <div className="bg-[#1c1c1e] rounded-2xl px-4 py-4 border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#a3e635] flex items-center justify-center shrink-0">
                <Footprints className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Daily Steps</p>
                <p className="text-[18px] font-extrabold text-white">{log.steps.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Exercise cards */}
          {log.exercises.map((ex, exIdx) => (
            <div
              key={exIdx}
              className="bg-[#1c1c1e] rounded-2xl border border-white/5 overflow-hidden"
            >
              {/* Exercise header */}
              <div className="px-4 pt-4 pb-3 border-b border-white/5">
                <p className="text-[13px] font-extrabold text-white uppercase tracking-wide">
                  {ex.name}
                </p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                  {ex.setLogs.length} set{ex.setLogs.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Sets table */}
              <div className="px-4 pt-3 pb-4">
                <div className="flex items-center gap-2 mb-2 px-0.5">
                  <span className="text-[9px] text-gray-600 font-bold uppercase w-14 shrink-0" />
                  <span className="text-[9px] text-gray-600 font-bold uppercase flex-1 text-center">KG</span>
                  <span className="text-[9px] text-gray-600 font-bold uppercase flex-1 text-center">REPS</span>
                </div>

                {ex.setLogs.length === 0 ? (
                  <p className="text-[11px] text-gray-600 font-medium py-1">No sets logged</p>
                ) : (
                  <div className="space-y-2">
                    {ex.setLogs.map((s, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-medium w-14 shrink-0">
                          Set {si + 1}
                        </span>
                        <div className="flex-1 h-9 bg-[#2a2a2c] rounded-lg flex items-center justify-center">
                          <span className="text-[13px] font-bold text-white">
                            {s.kg || <span className="text-gray-600">—</span>}
                          </span>
                        </div>
                        <div className="flex-1 h-9 bg-[#2a2a2c] rounded-lg flex items-center justify-center">
                          <span className="text-[13px] font-bold text-white">
                            {s.reps || <span className="text-gray-600">—</span>}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
