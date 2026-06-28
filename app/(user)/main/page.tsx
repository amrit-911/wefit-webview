"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, Play, ChevronDown, MessageCircle, CreditCard } from "lucide-react";
import Image from "next/image";
import { BottomNav } from "@/components/layout/bottom-nav";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useRef, useState } from "react";
import { GoalCountdown } from "@/components/ui/goal-countdown";
import { getClientNutritionPlan, getMealLog, getWaterLog, type MealSection } from "@/lib/services/client-nutrition.service";
import { getClientWorkoutPlan, type WorkoutDay } from "@/lib/services/client-workout.service";
import { getLastWorkoutLog, type WorkoutLog } from "@/lib/services/workout-log.service";
import { getTodayCheckin, getPeriodCheckins, type PeriodCheckinData } from "@/lib/services/checkin.service";
import { getUnreadCount } from "@/lib/services/notifications.service";
import { getClientUnreadCount } from "@/lib/services/chat.service";
import { getPersonalGoal, computeCountdown, type PersonalGoal } from "@/lib/services/personal-goal.service";
import { getBannerSettings } from "@/lib/services/banner.service";
import { getTickerSettings } from "@/lib/services/ticker.service";
import { TickerTape } from "@/components/ui/ticker-tape";
import { getMemberById } from "@/lib/services/members.service";
import { daysUntilExpiry, WEFIT_PLANS } from "@/lib/services/subscriptions.service";
import { useRouter } from "next/navigation";
import type { PeriodType } from "@/lib/services/checkin.service";

function CircularRing({ percent, size = 80, strokeWidth = 8, trackColor, progressColor, children }: any) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={trackColor} strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={progressColor} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
  { label: "3 Days", value: "3days" },
  { label: "7 Days", value: "7days" },
  { label: "14 Days", value: "14days" },
  { label: "1 Month", value: "1month" },
];

function getPeriodDays(period: string): number {
  switch (period) {
    case "3days": return 3;
    case "7days": return 7;
    case "14days": return 14;
    case "1month": return 30;
    default: return 7;
  }
}

function getLocalDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function computePeriodCooldown(cks: PeriodCheckinData[], period: string): number {
  const periodDays = getPeriodDays(period);
  // Use ANY period's latest check-in — not filtered by current period.
  // This ensures changing period recalculates cooldown from last submission.
  const latest = cks.sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) return 0;
  const lastDate = new Date(latest.date + "T00:00:00"); // local midnight
  const today = new Date(getLocalDateString() + "T00:00:00"); // local midnight
  const diffDays = Math.round((today.getTime() - lastDate.getTime()) / 86400000);
  return Math.max(0, periodDays - diffDays);
}

function getWorkoutName(day: WorkoutDay): string {
  if (day.isRestDay) return "DAY OFF";
  if (day.header?.trim()) return day.header.trim().toUpperCase();
  return day.label.toUpperCase();
}

export default function MainPage() {
  const { displayName, avatarUrl, user } = useAuth();
  const router = useRouter();
  const [meals, setMeals] = useState<MealSection[]>([]);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [checkinDone, setCheckinDone] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChat, setUnreadChat] = useState(0);
  const [personalGoal, setPersonalGoal] = useState<PersonalGoal | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [latestPeriodWeight, setLatestPeriodWeight] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentWorkoutDay, setCurrentWorkoutDay] = useState<number>(1);
  // Derived from the actual workout plan after load
  const [isWorkoutDay, setIsWorkoutDay] = useState(false);
  const [memberPlan, setMemberPlan] = useState<string>("");
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [dailyCheckinEnabled, setDailyCheckinEnabled] = useState(false);
  const [weeklyCheckinEnabled, setWeeklyCheckinEnabled] = useState(false);
  const [checkinPeriod, setCheckinPeriod] = useState<string>("7days");
  const [lastWorkoutLog, setLastWorkoutLog] = useState<WorkoutLog | null>(null);
  const [ticker, setTicker] = useState<{ clientEnabled: boolean; clientContent: string } | null>(null);
  const [periodCheckinCooldownDays, setPeriodCheckinCooldownDays] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    getUnreadCount(user.uid).then(setUnreadCount).catch(() => { });
    getClientUnreadCount(user.uid).then(setUnreadChat).catch(() => { });
    getPersonalGoal(user.uid).then(setPersonalGoal).catch(() => { });
    getLastWorkoutLog(user.uid).then(setLastWorkoutLog).catch(() => { });
    getBannerSettings().then((s) => { if (s.clientImageUrl) setBannerUrl(s.clientImageUrl); }).catch(() => { });
    getTickerSettings().then((s) => setTicker({ clientEnabled: s.clientEnabled, clientContent: s.clientContent })).catch(() => { });
    Promise.all([getMemberById(user.uid), getPeriodCheckins(user.uid)]).then(([m, cks]) => {
      const latestWithWeight = cks
        .filter((c) => c.weight != null && c.weight !== "" && !isNaN(parseFloat(c.weight!)))
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      if (latestWithWeight?.weight) setLatestPeriodWeight(parseFloat(latestWithWeight.weight!));
      if (!m) return;
      if (m.plan) setMemberPlan(m.plan);
      if (m.membershipEnd) setDaysRemaining(daysUntilExpiry(m.membershipEnd));
      setDailyCheckinEnabled(m.dailyCheckinEnabled === true);
      setWeeklyCheckinEnabled(m.weeklyCheckinEnabled === true);
      if (m.currentWorkoutDay != null) setCurrentWorkoutDay(m.currentWorkoutDay);
      const period = m.checkinPeriod || "7days";
      setCheckinPeriod(period);
      setPeriodCheckinCooldownDays(computePeriodCooldown(cks, period));
    }).catch(() => { });
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handler = () => { if (document.visibilityState === "visible") setRefreshKey((k) => k + 1); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getClientNutritionPlan(user.uid),
      getClientWorkoutPlan(user.uid),
      getTodayCheckin(user.uid),
      getMealLog(user.uid),
      getWaterLog(user.uid),
      getMemberById(user.uid),
      getPeriodCheckins(user.uid),
    ]).then(([nutrition, workout, todayCheckin, mealLog, glasses, member, periodCks]) => {
      const days = workout?.days ?? [];
      const cwDay = member?.currentWorkoutDay ?? 1;
      const todayPlanDay = days.find((d) => d.dayNumber === cwDay) ?? days[0] ?? null;
      // If no workout plan, pick whichever day has items; fallback to workoutDay
      let todayIsWorkoutDay = todayPlanDay ? !todayPlanDay.isRestDay : true;
      if (!todayPlanDay && nutrition) {
        const wdHasItems = (nutrition.workoutDay?.meals ?? []).some((m) => m.items.length > 0);
        const odHasItems = (nutrition.offDay?.meals ?? []).some((m) => m.items.length > 0);
        if (odHasItems && !wdHasItems) todayIsWorkoutDay = false;
      }

      // Override the default plan day with what the user actually logged today
      if (mealLog.workout && mealLog.workout.length > 0 && (!mealLog.off || mealLog.off.length === 0)) {
        todayIsWorkoutDay = true;
      } else if (mealLog.off && mealLog.off.length > 0 && (!mealLog.workout || mealLog.workout.length === 0)) {
        todayIsWorkoutDay = false;
      }

      setIsWorkoutDay(todayIsWorkoutDay);
      if (member?.currentWorkoutDay != null) setCurrentWorkoutDay(member.currentWorkoutDay);

      if (nutrition) {
        const dayMeals = todayIsWorkoutDay
          ? (nutrition.workoutDay?.meals ?? [])
          : (nutrition.offDay?.meals ?? []);
        setMeals(dayMeals);
        setCheckedKeys(new Set(todayIsWorkoutDay ? mealLog.workout : mealLog.off));
      }
      if (workout?.days) setWorkoutDays(workout.days);
      if (todayCheckin) setCheckinDone(true);
      setWaterGlasses(glasses);
      const period = member?.checkinPeriod || "7days";
      setPeriodCheckinCooldownDays(computePeriodCooldown(periodCks as PeriodCheckinData[], period));
    }).catch(console.error);
  }, [user, refreshKey]);

  // Compute today's nutrition totals
  // consumed = checked items only; target = full plan total
  const totalKcal = meals.reduce((s, m, mi) => s + m.items.reduce((ss, i, ii) => ss + (checkedKeys.has(`${mi}_${ii}`) ? (i.kcal || 0) : 0), 0), 0);
  const totalProtein = meals.reduce((s, m, mi) => s + m.items.reduce((ss, i, ii) => ss + (checkedKeys.has(`${mi}_${ii}`) ? (i.protein || 0) : 0), 0), 0);
  const totalCarbs = meals.reduce((s, m, mi) => s + m.items.reduce((ss, i, ii) => ss + (checkedKeys.has(`${mi}_${ii}`) ? (i.carbs || 0) : 0), 0), 0);
  const totalFats = meals.reduce((s, m, mi) => s + m.items.reduce((ss, i, ii) => ss + (checkedKeys.has(`${mi}_${ii}`) ? (i.fats || 0) : 0), 0), 0);
  const targetKcal = Math.max(1, meals.reduce((s, m) => s + m.items.reduce((ss, i) => ss + (i.kcal || 0), 0), 0));
  const targetProtein = Math.max(1, meals.reduce((s, m) => s + m.items.reduce((ss, i) => ss + (i.protein || 0), 0), 0));
  const targetCarbs = Math.max(1, meals.reduce((s, m) => s + m.items.reduce((ss, i) => ss + (i.carbs || 0), 0), 0));
  const targetFats = Math.max(1, meals.reduce((s, m) => s + m.items.reduce((ss, i) => ss + (i.fats || 0), 0), 0));

  const todayWorkout = workoutDays.find((d) => d.dayNumber === currentWorkoutDay) ?? workoutDays[0] ?? null;
  return (
    <div className="flex flex-col min-h-[100dvh] pb-24 font-sans text-white px-5 pt-8 bg-[#121212] overflow-x-hidden">

      {/* Header */}
      <header className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#2a2a2c] flex items-center justify-center overflow-hidden shrink-0 mt-1">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-[16px] font-bold text-white">
                {displayName ? displayName.charAt(0).toUpperCase() : "U"}
              </span>
            )}
          </div>
          <div>
            <div className="text-[12px] font-medium text-gray-400">Hey 👋 Athlete</div>
            <h1 className="text-[18px] font-bold text-white leading-tight mt-0.5">
              {displayName || "There"}
            </h1>
            <p className="text-[12px] font-medium text-gray-400 mt-0.5">Let's stay active today</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Chat icon */}
          <button
            onClick={() => router.push("/chat")}
            className="relative p-2 rounded-full bg-[#1c1c1e] text-white"
          >
            <MessageCircle className="w-5 h-5" />
            {unreadChat > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#a3e635] rounded-full border-2 border-[#1c1c1e]" />
            )}
          </button>
          {/* Notification bell */}
          <button onClick={() => { router.push("/notifications") }} className="relative p-2 rounded-full bg-[#1c1c1e] text-white">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1c1c1e]" />
            )}
          </button>
        </div>
      </header>

      {/* Ticker Tape */}
      {ticker?.clientEnabled && ticker.clientContent.trim() && (
        <div className="mx-[-20px] bg-[#7367f0] py-1.5 mb-4 overflow-hidden">
          <TickerTape content={ticker.clientContent} className="text-white" />
        </div>
      )}

      {/* Top Stats Section */}



      {/* ── Personal Goal Card (read-only) ──────────────────────────────── */}
      {personalGoal && (() => {
        const cd = computeCountdown(personalGoal.targetDate);
        const start = personalGoal.startWeight;
        const current = personalGoal.currentWeight;
        const target = personalGoal.targetWeight;
        return (
          <div className="bg-[#1a1f14] border border-[#a3e635]/25 rounded-2xl p-4 mb-5">
            {/* Label */}
            <div className="flex items-center justify-center mb-2">
              <span className="text-[9px] font-extrabold text-[#a3e635] tracking-widest uppercase">Target 🎯</span>
            </div>
            {/* Title */}
            <p className="text-[17px] font-extrabold text-white text-center mb-1 tracking-wide">{personalGoal.title.toUpperCase()}</p>
            {personalGoal.reason && (
              <div className="text-center mb-3">
                <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Why this Goal?</p>
                <p className="text-[11px] text-gray-300 font-medium">{personalGoal.reason}</p>
              </div>
            )}
            {/* Countdown */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Weeks", val: cd.weeks },
                { label: "Days", val: cd.days },
                { label: "Hours", val: cd.hours },
              ].map(({ label, val }) => (
                <div key={label} className="bg-[#121212] rounded-xl py-2 px-1 flex flex-col items-center border border-white/5">
                  <span className="text-[20px] font-extrabold text-white leading-none">{String(val).padStart(2, "0")}</span>
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wide mt-1">{label}</span>
                </div>
              ))}
            </div>
            {/* Weight chips */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[#121212] rounded-xl p-3 flex flex-col items-center border border-white/5">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wide mb-1">💪 Current Weight</span>
                <span className="text-[15px] font-extrabold text-white">{latestPeriodWeight ?? current} KG</span>
              </div>
              <div className="bg-[#121212] rounded-xl p-3 flex flex-col items-center border border-white/5">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wide mb-1">🎯 Target Weight</span>
                <span className="text-[15px] font-extrabold text-white">{target} KG</span>
              </div>
            </div>
            {/* Start → Target numbers */}
            <div className="flex items-center justify-between mt-1 mb-1 px-1">
              <span className="text-[13px] font-extrabold text-red-400">{start}kg</span>
              <span className="text-[13px] font-bold text-red-400">→</span>
              <span className="text-[13px] font-extrabold text-[#a3e635]">{target}kg</span>
            </div>
          </div>
        );
      })()}


      {/* Home Banner */}
      {bannerUrl && (
        <div className="relative w-full rounded-2xl overflow-hidden mb-5" style={{ aspectRatio: "21/9" }}>
          <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
        </div>
      )}




      {/* Today's Workout */}
      <div
        onClick={() => todayWorkout && router.push(`/workouts`)}
        className={`bg-[#1c1c1e] rounded-2xl p-5 mb-6 flex justify-between items-center shadow-lg group border border-white/5 ${todayWorkout ? "cursor-pointer hover:bg-[#222]" : ""}`}
      >
        <div className="flex flex-col justify-center">
          <h4 className="text-[10px] text-gray-400 font-extrabold tracking-widest mb-1.5 uppercase">
            TODAY&apos;S WORKOUT
          </h4>
          {todayWorkout ? (
            <>
              <p className="text-[18px] font-extrabold text-white mb-1.5 uppercase leading-tight">
                {getWorkoutName(todayWorkout)}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                {!todayWorkout.isRestDay && (
                  <span>{todayWorkout.exercises.length} exercises</span>
                )}
                {todayWorkout.isRestDay && <span>Rest &amp; Recovery</span>}
              </div>
              {lastWorkoutLog && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Previous logged Workout:</span>
                  <span className="text-[10px] font-bold text-[#a3e635]/70 uppercase tracking-wide">
                    {lastWorkoutLog.dayHeader?.trim() || lastWorkoutLog.dayLabel}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-[15px] font-extrabold text-white mb-1">No workout plan yet</p>
              <span className="text-[11px] text-gray-500 font-medium">Ask your trainer to assign a plan</span>
            </>
          )}
        </div>
        {todayWorkout && (
          <button className="w-12 h-12 bg-[#a3e635] rounded-full flex items-center justify-center pl-1 group-hover:scale-105 transition-transform shadow-lg shadow-[#a3e635]/20 shrink-0">
            <Play fill="black" className="w-6 h-6 text-black" />
          </button>
        )}
      </div>


      {/* Nutrition Summary */}
      <h3 className="text-[12px] font-extrabold tracking-wider text-white mb-4">NUTRITION SUMMARY</h3>
      <div className="bg-[#1c1c1e] rounded-2xl p-5 mb-5 shadow-lg flex items-center gap-6">
        <CircularRing percent={totalKcal > 0 ? Math.min(100, Math.round((totalKcal / targetKcal) * 100)) : 0} size={85} strokeWidth={7} trackColor="#93c5fd" progressColor="#f97316">
          <span className="text-[11px] font-bold text-white">{totalKcal}/{targetKcal}</span>
          <span className="text-[9px] text-gray-400 font-medium">kcal</span>
        </CircularRing>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex justify-between text-[11px] font-bold mb-1.5">
              <span className="text-white">Protein</span>
              <span className="text-gray-400">{totalProtein.toFixed(2)}/{targetProtein.toFixed(2)}g</span>
            </div>
            <div className="w-full bg-[#a3e635]/20 rounded-full h-[5px]">
              <div className="bg-[#a3e635] h-[5px] rounded-full" style={{ width: `${Math.min(100, Math.round((totalProtein / targetProtein) * 100))}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-bold mb-1.5">
              <span className="text-white">Carbs</span>
              <span className="text-gray-400">{totalCarbs.toFixed(2)}/{targetCarbs.toFixed(2)}g</span>
            </div>
            <div className="w-full bg-[#ef4444]/20 rounded-full h-[5px]">
              <div className="bg-[#ef4444] h-[5px] rounded-full" style={{ width: `${Math.min(100, Math.round((totalCarbs / targetCarbs) * 100))}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-bold mb-1.5">
              <span className="text-white">Fats</span>
              <span className="text-gray-400">{totalFats.toFixed(2)}/{targetFats.toFixed(2)}g</span>
            </div>
            <div className="w-full bg-[#a3e635]/20 rounded-full h-[5px]">
              <div className="bg-[#a3e635] h-[5px] rounded-full" style={{ width: `${Math.min(100, Math.round((totalFats / targetFats) * 100))}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      {memberPlan && (() => {
        let displayPlanName = memberPlan;
        let displayDuration = "";

        const matchingPlan = WEFIT_PLANS.find(p => p.id.toLowerCase() === memberPlan.toLowerCase());
        if (matchingPlan) {
          displayPlanName = matchingPlan.name;
          displayDuration = matchingPlan.duration;
        } else {
          // Legacy mapping
          const mp = memberPlan.toLowerCase();
          if (mp.includes("1 month")) { displayPlanName = "WeFit Signature Plan"; displayDuration = "1 Month"; }
          else if (mp.includes("3 month")) { displayPlanName = "WeFit Pro"; displayDuration = "3 Months"; }
          else if (mp.includes("6 month")) { displayPlanName = "WeFit Elite"; displayDuration = "6 Months"; }
        }

        return (
          <div className="bg-[#1c1c1e] rounded-2xl p-5 mb-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#2a2a2c] rounded-lg flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-[#a3e635]" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">Subscription</p>
                <p className="text-[15px] font-extrabold text-white uppercase">{displayPlanName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {displayDuration && <p className="text-[11px] font-bold text-[#a3e635] uppercase">{displayDuration}</p>}
                  {displayDuration && daysRemaining !== null && <span className="text-[10px] text-gray-500">•</span>}
                  {daysRemaining !== null && (
                    <p className="text-[11px] font-medium text-gray-400">
                      {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Plan expired"}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Link href="/renew-plan">
              <button className="flex items-center gap-2 bg-[#a3e635] text-black text-[12px] font-extrabold px-4 py-2.5 rounded-[12px] shadow-md shadow-[#a3e635]/20">
                <CreditCard className="w-3.5 h-3.5" />
                View Plans
              </button>
            </Link>
          </div>
        );
      })()}

      {/* Daily Check-In + Period dropdown */}
      <div className="flex items-center gap-3 mb-8">
        {/* Daily Check-In button */}
        <button
          onClick={() => dailyCheckinEnabled && router.push("/daily-checkin/log")}
          disabled={!dailyCheckinEnabled}
          className={`flex-1 font-bold text-[14px] rounded-[14px] py-[16px] flex items-center justify-center gap-2 transition-all ${dailyCheckinEnabled
            ? "bg-[#a3e635] hover:bg-[#b5f745] active:scale-95 text-black shadow-[0_0_16px_rgba(163,230,53,0.2)]"
            : "bg-[#1c1c1e] text-gray-600 border border-white/5 cursor-not-allowed"
            }`}
        >
          Daily Check-In
          {dailyCheckinEnabled && checkinDone && <span className="text-[13px]">✅</span>}
        </button>

        {/* Monthly / Period Check-In dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => weeklyCheckinEnabled && periodCheckinCooldownDays === 0 && setDropdownOpen((o) => !o)}
            disabled={!weeklyCheckinEnabled || periodCheckinCooldownDays > 0}
            className={`border text-font-semibold rounded-[14px] px-4 py-[12px] transition-all ${
              weeklyCheckinEnabled && periodCheckinCooldownDays === 0
                ? "flex items-center gap-2 text-[13px] bg-[#a3e635] hover:bg-[#b5f745] border-[#a3e635] text-black active:scale-95 shadow-[0_0_16px_rgba(163,230,53,0.2)]"
                : "flex flex-col items-center gap-0.5 bg-[#1c1c1e] border-white/5 text-gray-600 cursor-not-allowed"
            }`}
          >
            {weeklyCheckinEnabled && periodCheckinCooldownDays > 0 ? (
              <>
                <span className="text-[12px] font-semibold text-gray-500">Monthly Check-In</span>
                <span className="text-[10px] font-medium text-gray-600">
                  In {periodCheckinCooldownDays} day{periodCheckinCooldownDays !== 1 ? "s" : ""}
                </span>
              </>
            ) : (
              <>
                Monthly Check-In
                {weeklyCheckinEnabled && (
                  <ChevronDown
                    className={`w-4 h-4 text-black/70 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                )}
              </>
            )}
          </button>

          <AnimatePresence>
            {dropdownOpen && weeklyCheckinEnabled && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 bottom-full mb-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl overflow-hidden shadow-xl z-50 min-w-[140px]"
              >
                {(checkinPeriod
                  ? PERIOD_OPTIONS.filter((o) => o.value === checkinPeriod)
                  : PERIOD_OPTIONS
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push(`/daily-checkin/monthly-log?period=${opt.value}`);
                    }}
                    className="w-full text-left px-4 py-3 text-[13px] font-semibold text-white hover:bg-[#2a2a2c] hover:text-[#a3e635] transition-colors border-b border-[#2c2c2e] last:border-none"
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
