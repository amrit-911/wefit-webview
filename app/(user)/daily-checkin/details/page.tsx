"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getCheckins, type CheckinData } from "@/lib/services/checkin.service";

function RatingDisplay({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="bg-[#1c1c1e] rounded-xl px-4 py-3 border border-white/5">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      {value != null ? (
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ${
                value === n ? "bg-[#a3e635] text-black" : "bg-[#2a2a2c] text-gray-500"
              }`}
            >
              {n}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] font-semibold text-gray-600">—</p>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="bg-[#1c1c1e] rounded-xl px-4 py-3 border border-white/5">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-[13px] font-semibold text-white leading-relaxed">
        {value !== null && value !== undefined && value !== "" ? String(value) : <span className="text-gray-600">—</span>}
      </p>
    </div>
  );
}

function CheckinDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [checkin, setCheckin] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState(true);

  const dateParam = searchParams.get("date");

  useEffect(() => {
    if (!user) return;
    getCheckins(user.uid)
      .then((cks) => {
        const found = dateParam
          ? cks.find((c) => c.date === dateParam) ?? null
          : cks.sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
        setCheckin(found);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, dateParam]);

  const displayDate = checkin
    ? new Date(checkin.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : dateParam
    ? new Date(dateParam + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "Check-in Details";

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-[#121212] overflow-x-hidden relative pb-28">
      {/* Header */}
      <div className="flex items-center pt-10 px-5 pb-5 border-b border-[#1c1c1e] gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          back
        </button>
        <h1 className="text-[15px] font-extrabold text-white tracking-wide flex-1">
          {displayDate}
        </h1>
      </div>

      {loading && (
        <div className="px-5 pt-5 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1c1c1e] rounded-xl h-[64px] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !checkin && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="text-[44px] mb-3">📋</div>
          <p className="text-[14px] font-bold text-white mb-1">No check-in found</p>
          <p className="text-[11px] text-gray-500">No data recorded for this day</p>
        </div>
      )}

      {!loading && checkin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-5 flex flex-col gap-3 pt-5"
        >
          {/* Date */}
          <Field label="Date" value={checkin.date} />

          {/* Training */}
          <Field label="Training Session" value={checkin.trainingSession} />
          <RatingDisplay label="Training Rating" value={checkin.trainingRating} />
          <Field label="Training Rating Note" value={checkin.trainingRatingNote} />

          {/* Cardio */}
          <Field label="Cardio" value={checkin.cardio} />

          {/* Nutrition */}
          <RatingDisplay label="Nutrition" value={checkin.nutrition} />
          <Field label="Nutrition Note" value={checkin.nutritionNote} />

          {/* Hunger, Steps, Water, Sleep */}
          <RatingDisplay label="Hunger" value={checkin.hunger} />
          <Field label="Steps" value={checkin.steps} />
          <Field label="Water Intake" value={checkin.waterIntake} />
          <Field label="Sleep" value={checkin.sleep} />

          {/* Energy & Motivation */}
          <RatingDisplay label="Energy Level" value={checkin.energyLevel} />
          <RatingDisplay label="Motivation" value={checkin.motivation} />

          {/* Note */}
          <Field label="Note" value={checkin.note ?? checkin.notes} />

          {/* Weight (legacy) */}
          <Field label="Weight" value={checkin.weight ? `${checkin.weight} kg` : null} />

          {/* Trainer Feedback */}
          {checkin.trainerFeedback && (
            <div className="bg-[#a3e635]/10 border border-[#a3e635]/25 rounded-xl px-4 py-4 mt-1">
              <p className="text-[10px] font-bold text-[#a3e635] uppercase tracking-wider mb-2">
                Trainer Feedback
              </p>
              <p className="text-[13px] text-white leading-relaxed">{checkin.trainerFeedback}</p>
            </div>
          )}
        </motion.div>
      )}

      <BottomNav />
    </div>
  );
}

export default function CheckinDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
      <CheckinDetailsContent />
    </Suspense>
  );
}
