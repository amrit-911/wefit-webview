"use client";

import { ArrowLeft, ChevronRight, Dumbbell, Footprints } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getWorkoutLogs, type WorkoutLog } from "@/lib/services/workout-log.service";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d
    .toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

export default function TrainerClientWorkoutLogsPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    getWorkoutLogs(clientId)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

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
          <Dumbbell className="w-4 h-4 text-[#a3e635]" />
        </div>
        <h1 className="text-[22px] font-extrabold text-white tracking-tight">Workout Logs</h1>
      </div>
      <p className="text-[12px] text-gray-500 font-medium mb-7 ml-12">
        {loading ? "Loading…" : `${logs.length} log${logs.length !== 1 ? "s" : ""} recorded`}
      </p>

      {/* Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-[#1c1c1e] rounded-2xl h-[76px] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1c1c1e] flex items-center justify-center mb-5">
            <Dumbbell className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-[15px] font-extrabold text-white mb-1">No workout logs yet</p>
          <p className="text-[12px] text-gray-500">Client hasn&apos;t submitted any workout logs</p>
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
          {logs.map((log, idx) => (
            <button
              key={log.id ?? idx}
              onClick={() => router.push(`/trainer/clients/${clientId}/workout-logs/${log.id}`)}
              className="w-full bg-[#1c1c1e] rounded-2xl px-4 py-4 flex items-center justify-between border border-white/5 hover:border-[#a3e635]/30 hover:bg-[#222] transition-all group text-left"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#a3e635] flex items-center justify-center text-black font-extrabold text-[13px] shrink-0 shadow-[0_0_12px_rgba(163,230,53,0.2)]">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-extrabold text-white tracking-wide truncate">
                    {log.dayHeader
                      ? `${log.dayHeader.toUpperCase()} — ${log.dayLabel.toUpperCase()}`
                      : log.dayLabel.toUpperCase()}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] text-gray-400 font-medium">{formatDate(log.date)}</p>
                    <span className="text-gray-700 text-[9px]">•</span>
                    <p className="text-[11px] text-gray-500 font-medium">
                      {log.exercises.length} exercise{log.exercises.length !== 1 ? "s" : ""}
                    </p>
                   




                   
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#a3e635] transition-colors ml-3 shrink-0" />
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
