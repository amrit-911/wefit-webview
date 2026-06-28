"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getCheckins, type CheckinData } from "@/lib/services/checkin.service";

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();
}

export default function TrainerDailyCheckinListPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;

  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    getCheckins(clientId)
      .then(setCheckins)
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

      <h1 className="text-[22px] font-extrabold text-white tracking-tight mb-1">
        Daily Check-Ins
      </h1>
      <p className="text-[12px] text-gray-500 font-medium mb-6">
        {loading ? "Loading…" : `${checkins.length} check-in${checkins.length !== 1 ? "s" : ""} recorded`}
      </p>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1c1c1e] rounded-2xl h-[72px] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && checkins.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-[48px] mb-4">📋</div>
          <p className="text-[14px] font-bold text-white mb-1">No daily check-ins yet</p>
          <p className="text-[12px] text-gray-500">Client hasn't submitted any check-ins</p>
        </div>
      )}

      {!loading && checkins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {checkins.map((checkin, idx) => (
            <button
              key={checkin.id ?? idx}
              onClick={() =>
                router.push(
                  `/trainer/clients/${clientId}/checkins/daily/${checkin.id}`
                )
              }
              className="w-full bg-[#1c1c1e] rounded-2xl px-4 py-4 flex items-center justify-between border border-white/5 hover:border-[#a3e635]/30 hover:bg-[#232323] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#a3e635] flex items-center justify-center text-black font-extrabold text-[15px] shrink-0 shadow-[0_0_12px_rgba(163,230,53,0.2)]">
                  {idx + 1}
                </div>
                <div className="text-left">
                  <h4 className="text-[13px] font-extrabold text-white tracking-wide">
                    {formatDisplayDate(checkin.date)}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {checkin.weight ? `${checkin.weight}KG` : "—"}
                    <span className="mx-1.5 text-gray-600">•</span>
                    Energy {checkin.energyLevel ?? checkin.energy ?? "—"}/10
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#a3e635] transition-colors" />
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
