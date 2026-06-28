"use client";

import { X, ImagePlus, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useRef, Suspense, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { submitPeriodCheckin, getPeriodCheckins, type PeriodType } from "@/lib/services/checkin.service";
import { createPeriodCheckinNotification } from "@/lib/services/notifications.service";
import { addGalleryPhotoRecord } from "@/lib/services/gallery.service";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// ─── Shared helpers ────────────────────────────────────────────────────────

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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2">
      {children}
    </p>
  );
}

const inputCls =
  "w-full bg-[#1e1e20] border border-[#2c2c2e] rounded-xl px-4 py-3 text-[13px] text-white font-medium placeholder:text-[#555] focus:outline-none focus:border-[#a3e635]/50 transition-all resize-none";

const PERIOD_LABELS: Record<PeriodType, string> = {
  "3days": "3 Days",
  "7days": "7 Days",
  "14days": "14 Days",
  "1month": "1 Month",
};

// ─── Main form (reads ?period= from URL) ──────────────────────────────────

function PeriodCheckinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const periodParam = (searchParams.get("period") ?? "7days") as PeriodType;
  const { user, trainerId, displayName } = useAuth();

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const monthLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }).toUpperCase();

  // ── Form state ────────────────────────────────────────────────────
  const [date, setDate] = useState(todayStr);
  const [weight, setWeight] = useState("");

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [trainingAdherence, setTrainingAdherence] = useState<number | null>(null);
  const [trainingAdherenceNote, setTrainingAdherenceNote] = useState("");
  const [nutritionAdherence, setNutritionAdherence] = useState<number | null>(null);
  const [nutritionAdherenceNote, setNutritionAdherenceNote] = useState("");

  const [recoveryAndMotivation, setRecoveryAndMotivation] = useState("");
  const [littleWins, setLittleWins] = useState("");
  const [goalsNextWeek, setGoalsNextWeek] = useState("");
  const [whatCanIDo, setWhatCanIDo] = useState("");
  const [unsureAbout, setUnsureAbout] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  const [hunger, setHunger] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [recovery, setRecovery] = useState<number | null>(null);
  const [digestion, setDigestion] = useState<number | null>(null);
  const [qualityOfSleep, setQualityOfSleep] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckinDate, setLastCheckinDate] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getPeriodCheckins(user.uid).then((cks) => {
      const latest = [...cks]
        .filter((c) => c.period === periodParam)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      if (latest?.date) setLastCheckinDate(latest.date);
    }).catch(() => {});
  }, [user, periodParam]);

  // Handle file selection — add to existing list + generate local previews
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    // Reset input value so selecting same file again triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadPhotos(): Promise<string[]> {
    if (!user || !storage || selectedFiles.length === 0) return [];
    setUploadingPhotos(true);
    const urls: string[] = [];
    for (const file of selectedFiles) {
      const path = `period_checkins/${user.uid}/${date}_${periodParam}_${Date.now()}_${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      urls.push(url);
      addGalleryPhotoRecord(user.uid, url, path, date).catch(() => {});
    }
    setUploadingPhotos(false);
    return urls;
  }

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const photoUrls = await uploadPhotos();
      await submitPeriodCheckin(user.uid, {
        trainerId: trainerId ?? undefined,
        date,
        period: periodParam,
        weight,
        photoUrls,
        trainingAdherence: trainingAdherence ?? undefined,
        trainingAdherenceNote,
        nutritionAdherence: nutritionAdherence ?? undefined,
        nutritionAdherenceNote,
        recoveryAndMotivation,
        littleWins,
        goalsNextWeek,
        whatCanIDo,
        unsureAbout,
        anythingElse,
        hunger: hunger ?? undefined,
        energy: energy ?? undefined,
        fatigue: fatigue ?? undefined,
        stress: stress ?? undefined,
        recovery: recovery ?? undefined,
        digestion: digestion ?? undefined,
        qualityOfSleep: qualityOfSleep ?? undefined,
      });
      if (trainerId) {
        createPeriodCheckinNotification(
          trainerId,
          user.uid,
          displayName || "Client",
          periodParam,
          weight || undefined
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
          {monthLabel}
        </h1>
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Period badge + last check-in */}
      <div className="px-6 pt-4 flex items-center gap-3 flex-wrap">
        <span className="bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635] text-[11px] font-bold tracking-wider px-3 py-1.5 rounded-full uppercase">
          {PERIOD_LABELS[periodParam]} Check-In
        </span>
        {lastCheckinDate && (
          <span className="text-[11px] font-medium text-gray-500">
            Last check-in:{" "}
            <span className="text-gray-300 font-bold">
              {new Date(lastCheckinDate + "T00:00:00").toLocaleDateString("en-US", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
          </span>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="px-6 flex flex-col gap-5 flex-1 pb-36 pt-5"
      >
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

        {/* WEIGHT */}
        <div>
          <Label>Weight</Label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter Weight"
            className={inputCls}
          />
        </div>

        {/* PHOTOS */}
        <div>
          <Label>Add Front, Side and Back Photos</Label>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Upload tap area */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-[#3a3a3c] hover:border-[#a3e635]/50 rounded-xl py-4 text-[13px] text-gray-400 hover:text-[#a3e635] transition-all bg-[#1e1e20]"
          >
            <ImagePlus className="w-5 h-5" />
            {selectedFiles.length === 0
              ? "Tap to upload photos"
              : `Add more photos (${selectedFiles.length} selected)`}
          </button>

          {/* Thumbnail previews */}
          {previewUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {previewUrls.map((url, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-[80px] h-[80px] object-cover rounded-xl border border-[#3a3a3c]"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TRAINING ADHERENCE */}
        <div>
          <Label>
            Rate Your Training Adherence on a Scale of 1:10, If Not 10/10. Why?
          </Label>
          <RatingRow value={trainingAdherence} onChange={setTrainingAdherence} />
          {trainingAdherence !== null && trainingAdherence < 10 && (
            <textarea
              value={trainingAdherenceNote}
              onChange={(e) => setTrainingAdherenceNote(e.target.value)}
              placeholder="Rate Training"
              rows={3}
              className={`${inputCls} mt-3`}
            />
          )}
        </div>

        {/* NUTRITION ADHERENCE */}
        <div>
          <Label>
            Rate Your Nutrition Adherence on a Scale of 1:10, If Not 10/10. Why?
          </Label>
          <RatingRow value={nutritionAdherence} onChange={setNutritionAdherence} />
          {nutritionAdherence !== null && nutritionAdherence < 10 && (
            <textarea
              value={nutritionAdherenceNote}
              onChange={(e) => setNutritionAdherenceNote(e.target.value)}
              placeholder="Rate Nutrition"
              rows={3}
              className={`${inputCls} mt-3`}
            />
          )}
        </div>

        {/* RECOVERY & MOTIVATION */}
        <div>
          <Label>
            How Was Your Recovery and Motivation to Train This Week?
          </Label>
          <textarea
            value={recoveryAndMotivation}
            onChange={(e) => setRecoveryAndMotivation(e.target.value)}
            placeholder="Enter Required Info"
            rows={3}
            className={inputCls}
          />
        </div>

        {/* LITTLE WINS */}
        <div>
          <Label>What Are Some Little Wins You Achieved This Week?</Label>
          <textarea
            value={littleWins}
            onChange={(e) => setLittleWins(e.target.value)}
            placeholder="Enter Required Info"
            rows={3}
            className={inputCls}
          />
        </div>

        {/* GOALS */}
        <div>
          <Label>Name Some Goal(s) From This Upcoming Week</Label>
          <textarea
            value={goalsNextWeek}
            onChange={(e) => setGoalsNextWeek(e.target.value)}
            placeholder="Enter Required Info"
            rows={3}
            className={inputCls}
          />
        </div>

        {/* WHAT CAN I DO */}
        <div>
          <Label>Is There Anything More I Can Do for You at This Stage?</Label>
          <textarea
            value={whatCanIDo}
            onChange={(e) => setWhatCanIDo(e.target.value)}
            placeholder="Enter Required Info"
            rows={3}
            className={inputCls}
          />
        </div>

        {/* UNSURE ABOUT */}
        <div>
          <Label>Is There Anything You Are Unsure of or Need Clarity On?</Label>
          <textarea
            value={unsureAbout}
            onChange={(e) => setUnsureAbout(e.target.value)}
            placeholder="Enter Required Info"
            rows={3}
            className={inputCls}
          />
        </div>

        {/* ANYTHING ELSE */}
        <div>
          <Label>
            Is There Anything Else About Your Week You Would Like to Mention?
          </Label>
          <textarea
            value={anythingElse}
            onChange={(e) => setAnythingElse(e.target.value)}
            placeholder="Enter Required Info"
            rows={3}
            className={inputCls}
          />
        </div>

        {/* ── Rating scales ── */}
        <div>
          <Label>Hunger</Label>
          <RatingRow value={hunger} onChange={setHunger} />
        </div>

        <div>
          <Label>Energy</Label>
          <RatingRow value={energy} onChange={setEnergy} />
        </div>

        <div>
          <Label>Fatigue</Label>
          <RatingRow value={fatigue} onChange={setFatigue} />
        </div>

        <div>
          <Label>Stress</Label>
          <RatingRow value={stress} onChange={setStress} />
        </div>

        <div>
          <Label>Recovery</Label>
          <RatingRow value={recovery} onChange={setRecovery} />
        </div>

        <div>
          <Label>Digestion</Label>
          <RatingRow value={digestion} onChange={setDigestion} />
        </div>

        <div>
          <Label>Quality of Sleep</Label>
          <RatingRow value={qualityOfSleep} onChange={setQualityOfSleep} />
        </div>
      </motion.div>

      {/* Floating Done button */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent pt-10 pointer-events-none">
        <button
          onClick={handleSubmit}
          disabled={submitting || uploadingPhotos}
          className="w-full pointer-events-auto bg-[#a3e635] hover:bg-[#b5f745] disabled:opacity-70 text-black font-bold text-[15px] rounded-[14px] py-[20px] flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(163,230,53,0.25)]"
        >
          {submitting || uploadingPhotos ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadingPhotos ? "Uploading photos…" : "Submitting…"}
            </>
          ) : (
            "Done"
          )}
        </button>
      </div>
    </div>
  );
}

export default function PeriodCheckinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
      <PeriodCheckinForm />
    </Suspense>
  );
}
