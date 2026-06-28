"use client";

import { ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { submitCheckin } from "@/lib/services/checkin.service";
import { createCheckinNotification } from "@/lib/services/notifications.service";
import { getMemberById } from "@/lib/services/members.service";
import { useEffect } from "react";

// Reusable 1–10 rating row
function RatingRow({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap mt-3">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-8 h-8 rounded-full text-[12px] font-bold border transition-all flex-shrink-0 ${
            value === n
              ? "bg-[#a3e635] border-[#a3e635] text-black"
              : "bg-transparent border-[#3a3a3c] text-gray-400 hover:border-gray-500"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// Field label component
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2">
      {children}
    </p>
  );
}

// Input styles
const inputCls =
  "w-full bg-[#1e1e20] border border-[#2c2c2e] rounded-xl px-4 py-3 text-[13px] text-white font-medium placeholder:text-[#555] focus:outline-none focus:border-[#a3e635]/50 transition-all resize-none";

export default function CheckinLogPage() {
  const router = useRouter();
  const { user, displayName, trainerId } = useAuth();

  // ── Form state ────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [trainingSession, setTrainingSession] = useState("");
  const [trainingRating, setTrainingRating] = useState<number | null>(null);
  const [trainingRatingNote, setTrainingRatingNote] = useState("");
  const [cardio, setCardio] = useState("");
  const [nutrition, setNutrition] = useState<number | null>(null);
  const [nutritionNote, setNutritionNote] = useState("");
  const [hunger, setHunger] = useState<number | null>(null);
  const [steps, setSteps] = useState("");
  const [stepsInputVisible, setStepsInputVisible] = useState(true);
  const [waterIntake, setWaterIntake] = useState("");
  const [sleep, setSleep] = useState("");
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getMemberById(user.uid).then((m) => {
      setStepsInputVisible(m?.stepsVisible === true);
    }).catch(() => {});
  }, [user]);

  // Today's display
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitCheckin(user.uid, {
        trainerId: trainerId ?? undefined,
        trainingSession,
        trainingRating: trainingRating ?? undefined,
        trainingRatingNote,
        cardio,
        nutrition: nutrition ?? undefined,
        nutritionNote,
        hunger: hunger ?? undefined,
        steps,
        waterIntake,
        sleep,
        energyLevel: energyLevel ?? undefined,
        motivation: motivation ?? undefined,
        note: note.trim(),
      });

      if (trainerId) {
        createCheckinNotification(
          trainerId,
          user.uid,
          displayName || "Client",
          0,
          "",
          energyLevel ?? 0
        ).catch(() => {});
      }

      router.push("/daily-checkin/success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit. Try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col font-sans bg-[#121212] overflow-x-hidden relative">
      {/* Header */}
      <div className="flex justify-between items-center pt-10 px-6 pb-6 border-b border-[#1c1c1e]">
        <h1 className="text-[16px] font-extrabold text-white tracking-wide">
          {today}
        </h1>
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="px-6 flex flex-col gap-5 flex-1 pb-36 pt-5"
      >
        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-[12px] text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* DATE */}
        <div>
          <Label>Date</Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* TRAINING SESSION */}
        <div>
          <Label>What Training Session Did You Do?</Label>
          <input
            type="text"
            value={trainingSession}
            onChange={(e) => setTrainingSession(e.target.value)}
            placeholder="Enter Session Details"
            className={inputCls}
          />
        </div>

        {/* TRAINING RATING */}
        <div>
          <Label>If Training Was Not 10/10 Tell Me Why?</Label>
          <RatingRow value={trainingRating} onChange={setTrainingRating} />
          {trainingRating !== null && trainingRating < 10 && (
            <input
              type="text"
              value={trainingRatingNote}
              onChange={(e) => setTrainingRatingNote(e.target.value)}
              placeholder="Rate Training"
              className={`${inputCls} mt-3`}
            />
          )}
        </div>

        {/* CARDIO */}
        <div>
          <Label>Cardio</Label>
          <input
            type="text"
            value={cardio}
            onChange={(e) => setCardio(e.target.value)}
            placeholder="Enter Cardio Details"
            className={inputCls}
          />
        </div>

        {/* NUTRITION */}
        <div>
          <Label>Nutrition</Label>
          <RatingRow value={nutrition} onChange={setNutrition} />
          {nutrition !== null && nutrition < 10 && (
            <input
              type="text"
              value={nutritionNote}
              onChange={(e) => setNutritionNote(e.target.value)}
              placeholder="If Nutrition Was Not 10/10 Tell Me Why?"
              className={`${inputCls} mt-3`}
            />
          )}
        </div>

        {/* HUNGER */}
        <div>
          <Label>Hunger</Label>
          <RatingRow value={hunger} onChange={setHunger} />
        </div>

        {/* STEPS */}
        {stepsInputVisible && (
          <div>
            <Label>Steps</Label>
            <input
              type="number"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="Enter Steps"
              className={inputCls}
            />
          </div>
        )}

        {/* WATER INTAKE */}
        <div>
          <Label>Water Intake</Label>
          <input
            type="text"
            value={waterIntake}
            onChange={(e) => setWaterIntake(e.target.value)}
            placeholder="Enter Water Intake"
            className={inputCls}
          />
        </div>

        {/* SLEEP */}
        <div>
          <Label>Sleep</Label>
          <input
            type="text"
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            placeholder="Enter Sleep Hours"
            className={inputCls}
          />
        </div>

        {/* ENERGY LEVELS */}
        <div>
          <Label>What Were Your Energy Levels Like Today?</Label>
          <RatingRow value={energyLevel} onChange={setEnergyLevel} />
        </div>

        {/* MOTIVATION */}
        <div>
          <Label>How Was Your Motivation Today?</Label>
          <RatingRow value={motivation} onChange={setMotivation} />
        </div>

        {/* ADDITIONAL NOTES */}
        <div>
          <Label>Additional Notes</Label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder=""
            rows={4}
            className={inputCls}
          />
        </div>
      </motion.div>

      {/* Floating Submit */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent pt-10 pointer-events-none">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full pointer-events-auto bg-[#a3e635] hover:bg-[#b5f745] disabled:opacity-70 text-black font-bold text-[15px] rounded-[14px] py-[20px] flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(163,230,53,0.25)]"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            "Done"
          )}
        </button>
      </div>
    </div>
  );
}
