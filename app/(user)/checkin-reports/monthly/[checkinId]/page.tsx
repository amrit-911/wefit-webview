"use client";

import { ArrowLeft, X, ZoomIn } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { getPeriodCheckinById, type PeriodCheckinData } from "@/lib/services/checkin.service";
import { BottomNav } from "@/components/layout/bottom-nav";

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

const PERIOD_LABELS: Record<string, string> = {
  "3days": "3 Days",
  "7days": "7 Days",
  "14days": "14 Days",
  "1month": "1 Month",
};

export default function ClientMonthlyCheckinDetailPage() {
  const router = useRouter();
  const params = useParams();
  const checkinId = params?.checkinId as string;

  const [checkin, setCheckin] = useState<PeriodCheckinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [pinchScale, setPinchScale] = useState(1);

  useEffect(() => {
    if (!checkinId) return;
    getPeriodCheckinById(checkinId)
      .then(setCheckin)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [checkinId]);

  const displayDate = checkin
    ? new Date(checkin.date + "T12:00:00").toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Check-In Details";

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-28">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-3 h-3 mr-1" />
        back
      </button>

      <div className="mb-6">
        <h1 className="text-[20px] font-extrabold text-white tracking-tight mb-1">{displayDate}</h1>
        {checkin && (
          <span className="inline-block bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635] text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
            {PERIOD_LABELS[checkin.period] ?? checkin.period} Check-In
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1c1c1e] rounded-xl h-[64px] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !checkin && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-[48px] mb-4">📊</div>
          <p className="text-[14px] font-bold text-white mb-1">Check-in not found</p>
        </div>
      )}

      {!loading && checkin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-3"
        >
          <Field label="Date" value={checkin.date} />
          <Field label="Weight" value={checkin.weight ? `${checkin.weight} KG` : null} />

          {/* Photos */}
          {checkin.photoUrls && checkin.photoUrls.length > 0 && (
            <div className="bg-[#1c1c1e] rounded-xl px-4 py-4 border border-white/5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                Photos ({checkin.photoUrls.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {checkin.photoUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => { setLightboxUrl(url); setPinchScale(1); }}
                    className="relative w-[90px] h-[90px] rounded-xl overflow-hidden border border-white/10 hover:border-[#a3e635]/40 transition-colors group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <RatingDisplay label="Training Adherence" value={checkin.trainingAdherence} />
          <Field label="Training Adherence Note" value={checkin.trainingAdherenceNote} />
          <RatingDisplay label="Nutrition Adherence" value={checkin.nutritionAdherence} />
          <Field label="Nutrition Adherence Note" value={checkin.nutritionAdherenceNote} />

          <Field label="Recovery & Motivation" value={checkin.recoveryAndMotivation} />
          <Field label="Little Wins" value={checkin.littleWins} />
          <Field label="Goals for Next Week" value={checkin.goalsNextWeek} />
          <Field label="What More Can I Do?" value={checkin.whatCanIDo} />
          <Field label="Unsure About" value={checkin.unsureAbout} />
          <Field label="Anything Else" value={checkin.anythingElse} />

          <RatingDisplay label="Hunger" value={checkin.hunger} />
          <RatingDisplay label="Energy" value={checkin.energy} />
          <RatingDisplay label="Fatigue" value={checkin.fatigue} />
          <RatingDisplay label="Stress" value={checkin.stress} />
          <RatingDisplay label="Recovery" value={checkin.recovery} />
          <RatingDisplay label="Digestion" value={checkin.digestion} />
          <RatingDisplay label="Quality of Sleep" value={checkin.qualityOfSleep} />

          {/* Trainer Feedback (read-only for client) */}
          {checkin.trainerFeedback && (
            <div className="bg-[#a3e635]/10 border border-[#a3e635]/25 rounded-xl px-4 py-4">
              <p className="text-[10px] font-bold text-[#a3e635] uppercase tracking-wider mb-2">
                Trainer Feedback
              </p>
              <p className="text-[13px] text-white leading-relaxed">{checkin.trainerFeedback}</p>
            </div>
          )}
        </motion.div>
      )}

      <BottomNav />

      {/* Photo Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-12 right-5 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setPinchScale((s) => Math.max(1, s - 0.5)); }}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-lg font-bold"
              >−</button>
              <span className="text-white text-[12px] font-bold">{Math.round(pinchScale * 100)}%</span>
              <button
                onClick={(e) => { e.stopPropagation(); setPinchScale((s) => Math.min(4, s + 0.5)); }}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-lg font-bold"
              >+</button>
            </div>

            <motion.div
              onClick={(e) => e.stopPropagation()}
              animate={{ scale: pinchScale }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt="Full size"
                className="object-contain"
                style={{ maxWidth: "100vw", maxHeight: "100vh" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
