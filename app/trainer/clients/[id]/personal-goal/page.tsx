"use client";

import { ArrowLeft, CalendarDays } from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  getPersonalGoal,
  savePersonalGoal,
  type PersonalGoal,
} from "@/lib/services/personal-goal.service";

const inputCls =
  "w-full bg-[#1e1e20] border border-[#2c2c2e] rounded-xl px-4 py-3 text-[13px] text-white font-medium placeholder:text-[#555] focus:outline-none focus:border-[#a3e635]/60 transition-all";

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2">{children}</p>
);

export default function PersonalGoalFormPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params?.id as string;
  const isEdit = searchParams?.get("edit") === "1";

  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [startWeight, setStartWeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    getPersonalGoal(clientId)
      .then((goal) => {
        if (goal) {
          setTitle(goal.title);
          setReason(goal.reason);
          setStartWeight(String(goal.startWeight));
          setCurrentWeight(String(goal.currentWeight));
          setTargetWeight(String(goal.targetWeight));
          setTargetDate(goal.targetDate);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId, isEdit]);

  const handleSave = async () => {
    if (!title.trim()) { setError("Goal title is required."); return; }
    if (!targetDate) { setError("Target date is required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const data: Omit<PersonalGoal, "createdAt" | "updatedAt"> = {
        title: title.trim(),
        reason: reason.trim(),
        startWeight: parseFloat(startWeight) || 0,
        currentWeight: parseFloat(currentWeight) || 0,
        targetWeight: parseFloat(targetWeight) || 0,
        targetDate,
      };
      await savePersonalGoal(clientId, data, !isEdit);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save goal.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#121212] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#121212] font-sans overflow-x-hidden">
      {/* Header */}
      <div className="pt-10 px-5 pb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-5 transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          back
        </button>
        <h1 className="text-[22px] font-extrabold text-white tracking-wide mb-1">
          {isEdit ? "Edit Client Goal" : "Create Client Goal"}
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="px-5 flex flex-col gap-5 pb-10"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-[12px] text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* GOAL TITLE */}
        <div>
          <Label>Goal Title</Label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Marriage"
            className={inputCls}
          />
        </div>

        {/* REASON */}
        <div>
          <Label>Reason / Motivation</Label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is the client doing this?"
            rows={4}
            className={inputCls}
          />
        </div>

        {/* WEIGHTS — 3 columns */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Start (KG)</Label>
            <input
              type="number"
              value={startWeight}
              onChange={(e) => setStartWeight(e.target.value)}
              placeholder=""
              className={inputCls}
            />
          </div>
          <div>
            <Label>Current (KG)</Label>
            <input
              type="number"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              placeholder=""
              className={inputCls}
            />
          </div>
          <div>
            <Label>Target (KG)</Label>
            <input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder=""
              className={inputCls}
            />
          </div>
        </div>

        {/* TARGET DATE */}
        <div>
          <Label>Target Date</Label>
          <div className="relative">
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={`${inputCls} pl-10 [color-scheme:dark]`}
            />
          </div>
        </div>
      </motion.div>

      {/* Floating Save */}
      <div className="px-5 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent pointer-events-none">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="w-full pointer-events-auto bg-[#a3e635] hover:bg-[#b5f745] disabled:opacity-70 text-black font-bold text-[15px] rounded-[14px] py-[18px] flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(163,230,53,0.25)]"
        >
          {submitting ? (
            <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Saving...</>
          ) : "Save Goal"}
        </button>
      </div>
    </div>
  );
}
