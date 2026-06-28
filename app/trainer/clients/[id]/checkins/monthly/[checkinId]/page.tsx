"use client";

import { ArrowLeft, X, ZoomIn } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  getPeriodCheckinById,
  savePeriodCheckinFeedback,
  type PeriodCheckinData,
} from "@/lib/services/checkin.service";
import { notifyUserCheckinFeedback } from "@/lib/services/notifications.service";
import { useAuth } from "@/providers/auth-provider";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="bg-[#1c1c1e] rounded-xl px-4 py-3 border border-white/5">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-[13px] font-semibold text-white leading-relaxed">
        {value !== null && value !== undefined && value !== ""
          ? String(value)
          : <span className="text-gray-600">—</span>}
      </p>
    </div>
  );
}

function RatingDisplay({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="bg-[#1c1c1e] rounded-xl px-4 py-3 border border-white/5">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ${value === n
              ? "bg-[#a3e635] text-black"
              : "bg-[#2a2a2c] text-gray-500"
              }`}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrainerMonthlyCheckinDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;
  const checkinId = params?.checkinId as string;
  const { user, displayName } = useAuth();

  const [checkin, setCheckin] = useState<PeriodCheckinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Zoomable photo lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [pinchScale, setPinchScale] = useState(1);

  useEffect(() => {
    if (!checkinId) return;
    getPeriodCheckinById(checkinId)
      .then((c) => {
        setCheckin(c);
        setFeedbackText(c?.trainerFeedback ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [checkinId]);

  const PERIOD_LABELS: Record<string, string> = {
    "3days": "3 Days",
    "7days": "7 Days",
    "14days": "14 Days",
    "1month": "1 Month",
  };

  const displayDate = checkin
    ? new Date(checkin.date + "T12:00:00").toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
    : "Check-In Details";

  async function handleSendFeedback() {
    if (!checkin?.id || !feedbackText.trim() || !user) return;
    setSubmitting(true);
    try {
      // ✅ Uses period_checkins collection — not checkins
      await savePeriodCheckinFeedback(checkin.id, feedbackText.trim());
      await notifyUserCheckinFeedback(
        checkin.userId,
        displayName || user.displayName || "Your Trainer",
        user.uid,
        checkin.date,
        feedbackText.trim()
      );
      // Update local state so the sent text is shown immediately
      setCheckin((prev) => prev ? { ...prev, trainerFeedback: feedbackText.trim() } : prev);
      setFeedbackSent(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 16, stiffness: 200 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#a3e635] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(163,230,53,0.3)]">
            <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-[26px] font-extrabold text-white mb-2">Check-In Completed</h2>
          <p className="text-[14px] text-gray-500 font-medium mb-10">Great Consistency</p>
          <button
            onClick={() => router.push(`/trainer/clients/${clientId}`)}
            className="w-full max-w-xs bg-[#a3e635] hover:bg-[#b5f745] text-black font-bold text-[16px] rounded-2xl py-5 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(163,230,53,0.25)]"
          >
            Back To Client
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-36">
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

      <div className="mb-6">
        <h1 className="text-[18px] font-extrabold text-white tracking-tight mb-1">
          {displayDate}
        </h1>
        {checkin && (
          <span className="inline-block bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635] text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
            {PERIOD_LABELS[checkin.period] ?? checkin.period} Check-In
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-[#1c1c1e] rounded-xl h-[64px] animate-pulse" />)}
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
          {/* Date + Weight */}
          <Field label="Date" value={checkin.date} />
          <Field label="Weight" value={checkin.weight ? `${checkin.weight} KG` : null} />

          {/* ── Photos ── */}
          {checkin.photoUrls && checkin.photoUrls.length > 0 && (
            <div className="bg-[#1c1c1e] rounded-xl px-4 py-4 border border-white/5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                Photos ({checkin.photoUrls.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {checkin.photoUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLightboxUrl(url);
                      setPinchScale(1);
                    }}
                    className="relative w-[90px] h-[90px] rounded-xl overflow-hidden border border-white/10 hover:border-[#a3e635]/40 transition-colors group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Training & Nutrition */}
          <RatingDisplay label="Training Adherence" value={checkin.trainingAdherence} />
          <Field label="Training Adherence Note" value={checkin.trainingAdherenceNote} />
          <RatingDisplay label="Nutrition Adherence" value={checkin.nutritionAdherence} />
          <Field label="Nutrition Adherence Note" value={checkin.nutritionAdherenceNote} />

          {/* Open Questions */}
          <Field label="Recovery & Motivation" value={checkin.recoveryAndMotivation} />
          <Field label="Little Wins" value={checkin.littleWins} />
          <Field label="Goals for Next Week" value={checkin.goalsNextWeek} />
          <Field label="What More Can I Do?" value={checkin.whatCanIDo} />
          <Field label="Unsure About" value={checkin.unsureAbout} />
          <Field label="Anything Else" value={checkin.anythingElse} />

          {/* Scale Ratings */}
          <RatingDisplay label="Hunger" value={checkin.hunger} />
          <RatingDisplay label="Energy" value={checkin.energy} />
          <RatingDisplay label="Fatigue" value={checkin.fatigue} />
          <RatingDisplay label="Stress" value={checkin.stress} />
          <RatingDisplay label="Recovery" value={checkin.recovery} />
          <RatingDisplay label="Digestion" value={checkin.digestion} />
          <RatingDisplay label="Quality of Sleep" value={checkin.qualityOfSleep} />

          {/* ── Trainer Feedback ── */}
          <div className="bg-[#1c1c1e] rounded-xl px-4 py-4 border border-white/5 mt-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-[#a3e635] uppercase tracking-wider">
                Trainer Feedback
              </p>
              {/* Allow re-editing after sending */}
              {feedbackSent && (
                <button
                  onClick={() => setFeedbackSent(false)}
                  className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10"
                >
                  Edit
                </button>
              )}
            </div>

            {feedbackSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-xl px-3 py-3"
              >
                <div className="flex items-start gap-2 mb-2">
                  <svg className="w-4 h-4 text-[#a3e635] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[11px] font-bold text-[#a3e635]">Feedback sent!</p>
                </div>
                <p className="text-[12px] text-gray-200 leading-relaxed">{checkin.trainerFeedback}</p>
              </motion.div>
            ) : (
              <>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Write your feedback for this check-in…"
                  rows={3}
                  className="w-full bg-[#2a2a2c] border border-white/10 rounded-xl px-3 py-2.5 text-[12px] text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#a3e635]/50 mb-3"
                />
                <button
                  onClick={handleSendFeedback}
                  disabled={!feedbackText.trim() || submitting}
                  className="w-full h-11 bg-[#a3e635] disabled:opacity-40 rounded-xl flex items-center justify-center gap-2 transition-opacity font-extrabold text-black text-[13px]"
                >
                  {submitting ? "Sending…" : checkin.trainerFeedback ? "Update Feedback" : "Send Feedback"}
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Done Button */}
      {!loading && checkin && (
        <div className="px-5 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent pt-10 pointer-events-none">
          <button
            onClick={() => setShowSuccess(true)}
            className="w-full pointer-events-auto bg-[#a3e635] hover:bg-[#b5f745] text-black font-bold text-[15px] rounded-[14px] py-[20px] flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(163,230,53,0.25)]"
          >
            Done
          </button>
        </div>
      )}

      {/* ── Photo Lightbox (zoomable) ── */}
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
            {/* Close button */}
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-12 right-5 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Zoom controls */}
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
              className="max-w-full max-h-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt="Full size photo"
                className="max-w-screen max-h-screen object-contain"
                style={{ maxWidth: "100vw", maxHeight: "100vh" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
