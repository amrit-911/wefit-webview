"use client";

import { motion } from "framer-motion";
import { Dumbbell, CheckCircle, Calendar, Target, Check, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getMemberById, updateMember } from "@/lib/services/members.service";

interface Props {
  clientId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: any;
}

function Toggle({
  enabled,
  onToggle,
  saving,
}: {
  enabled: boolean;
  onToggle: () => void;
  saving: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={saving}
      className={`relative w-[46px] h-[26px] rounded-full transition-all duration-200 focus:outline-none disabled:opacity-50 ${
        enabled ? "bg-[#a3e635]" : "bg-[#3a3a3c]"
      }`}
      aria-label="Toggle"
    >
      <span
        className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow transition-all duration-200 ${
          enabled ? "left-[23px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

type CheckinPeriod = "3days" | "7days" | "14days" | "1month";

const PERIOD_OPTIONS: { label: string; value: CheckinPeriod }[] = [
  { label: "3 Days", value: "3days" },
  { label: "7 Days", value: "7days" },
  { label: "14 Days", value: "14days" },
  { label: "30 Days", value: "1month" },
];

export function WorkoutsTab({ clientId, router }: Props) {
  const [dailyCheckinEnabled, setDailyCheckinEnabled] = useState(false);
  const [weeklyCheckinEnabled, setWeeklyCheckinEnabled] = useState(false);
  const [stepsTarget, setStepsTarget] = useState("");
  const [stepsVisible, setStepsVisible] = useState(false);
  const [savingDaily, setSavingDaily] = useState(false);
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [savingSteps, setSavingSteps] = useState(false);
  const [savingStepsVisible, setSavingStepsVisible] = useState(false);
  const [stepsSaved, setStepsSaved] = useState(false);
  const [checkinPeriod, setCheckinPeriod] = useState<CheckinPeriod>("7days");
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMemberById(clientId)
      .then((m) => {
        if (!m) return;
        setDailyCheckinEnabled(m.dailyCheckinEnabled === true);
        setWeeklyCheckinEnabled(m.weeklyCheckinEnabled === true);
        setStepsVisible(m.stepsVisible === true);
        if (m.targetSteps != null) setStepsTarget(String(m.targetSteps));
        if (m.checkinPeriod) setCheckinPeriod(m.checkinPeriod);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleCheckinPeriodChange(period: CheckinPeriod) {
    setCheckinPeriod(period);
    setSavingPeriod(true);
    try {
      await updateMember(clientId, { checkinPeriod: period });
    } catch {
      // revert not needed since it's a select; just log
    } finally {
      setSavingPeriod(false);
    }
  }

  async function handleToggleDaily() {
    if (savingDaily) return;
    const newVal = !dailyCheckinEnabled;
    setSavingDaily(true);
    setDailyCheckinEnabled(newVal);
    try {
      await updateMember(clientId, { dailyCheckinEnabled: newVal });
    } catch {
      setDailyCheckinEnabled(!newVal);
    } finally {
      setSavingDaily(false);
    }
  }

  async function handleToggleWeekly() {
    if (savingWeekly) return;
    const newVal = !weeklyCheckinEnabled;
    setSavingWeekly(true);
    setWeeklyCheckinEnabled(newVal);
    try {
      await updateMember(clientId, { weeklyCheckinEnabled: newVal });
    } catch {
      setWeeklyCheckinEnabled(!newVal);
    } finally {
      setSavingWeekly(false);
    }
  }

  async function handleToggleStepsVisible() {
    if (savingStepsVisible) return;
    const newVal = !stepsVisible;
    setSavingStepsVisible(true);
    setStepsVisible(newVal);
    try {
      await updateMember(clientId, { stepsVisible: newVal });
    } catch {
      setStepsVisible(!newVal);
    } finally {
      setSavingStepsVisible(false);
    }
  }

  async function handleSaveSteps() {
    if (savingSteps) return;
    setSavingSteps(true);
    try {
      const parsed = stepsTarget ? parseInt(stepsTarget, 10) : 0;
      await updateMember(clientId, { targetSteps: parsed });
      setStepsSaved(true);
      setTimeout(() => setStepsSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSteps(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 mt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1c1c1e] rounded-2xl p-5 h-[76px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">

      {/* Daily + Weekly Checkin Toggles — side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Daily Checkin */}
        <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#a3e635]/10 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-[#a3e635]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">Daily Checkin</p>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5 leading-snug">
              {dailyCheckinEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <Toggle enabled={dailyCheckinEnabled} onToggle={handleToggleDaily} saving={savingDaily} />
        </div>

        {/* Weekly Checkin */}
        <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">Weekly Checkin</p>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5 leading-snug">
              {weeklyCheckinEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <Toggle enabled={weeklyCheckinEnabled} onToggle={handleToggleWeekly} saving={savingWeekly} />
        </div>
      </div>

      {/* Check-in Period Selector — only shown when weekly checkin is enabled */}
      {weeklyCheckinEnabled && <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-white">Check-in Period</p>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Select which period client can use</p>
          </div>
          {savingPeriod && (
            <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleCheckinPeriodChange(opt.value)}
              className={`py-2.5 rounded-xl text-[12px] font-bold transition-all border ${
                checkinPeriod === opt.value
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                  : "bg-[#121212] border-white/5 text-gray-400 hover:border-white/15"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>}

      {/* Daily Steps Target */}
      <div className="bg-[#1c1c1e] rounded-2xl p-5 border border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-white">Daily Steps</p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">Set steps target for user</p>
          </div>
          <Toggle enabled={stepsVisible} onToggle={handleToggleStepsVisible} saving={savingStepsVisible} />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={stepsTarget}
            onChange={(e) => { setStepsTarget(e.target.value); setStepsSaved(false); }}
            placeholder="e.g. 10000"
            disabled={!stepsVisible}
            className="flex-1 bg-[#121212] border border-[#2c2c2e] rounded-xl px-4 py-3 text-[14px] text-white font-medium placeholder:text-[#555] focus:outline-none focus:border-[#a3e635]/50 transition-all disabled:opacity-40"
          />
          <button
            onClick={handleSaveSteps}
            disabled={savingSteps || !stepsVisible}
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-50 ${
              stepsSaved
                ? "bg-[#a3e635]/15 border border-[#a3e635]/30"
                : "bg-[#a3e635] hover:bg-[#b5f745]"
            }`}
          >
            {savingSteps ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className={`w-4 h-4 ${stepsSaved ? "text-[#a3e635]" : "text-black"}`} />
            )}
          </button>
        </div>
      </div>

      {/* Manage Workout Card */}
      <button
        onClick={() => router.push(`/trainer/clients/${clientId}/exercise-builder`)}
        className="bg-[#1c1c1e] rounded-2xl p-5 border border-white/5 w-full text-left hover:bg-[#222] transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#a3e635]/10 flex items-center justify-center shrink-0">
              <Dumbbell className="w-5 h-5 text-[#a3e635]" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white">Manage Workout</p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Assign &amp; edit workout plan</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </div>
      </button>

    </motion.div>
  );
}
