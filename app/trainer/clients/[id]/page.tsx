"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Dumbbell, Apple, BarChart, Bell, RefreshCw, Phone, Mail, PowerOff, Power, MessageCircle, Pencil, Trash2, Plus } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getMemberById, updateMember, updateMemberStatus, type Member } from "@/lib/services/members.service";
import { WEFIT_PLANS, computeMembershipEnd } from "@/lib/services/subscriptions.service";
import { getCheckins, getPeriodCheckins, type CheckinData } from "@/lib/services/checkin.service";
import { getPersonalGoal, deletePersonalGoal, computeCountdown, type PersonalGoal } from "@/lib/services/personal-goal.service";
import { getClientNutritionPlan, getMealLog, type MealSection } from "@/lib/services/client-nutrition.service";
import { getClientWorkoutPlan } from "@/lib/services/client-workout.service";
import { WorkoutsTab } from "./workouts-tab";
import { NutritionTab } from "./nutrition-tab";
import { ProgressTab } from "./progress-tab";

const tabs = ["Overview", "Workouts", "Nutrition", "Progress"];

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;
  const [activeTab, setActiveTab] = useState("Overview");
  const [client, setClient] = useState<Member | null>(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [latestCheckinWeight, setLatestCheckinWeight] = useState<number | null>(null);
  const [latestCheckin, setLatestCheckin] = useState<CheckinData | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ goalWeight: "", plan: WEFIT_PLANS[0].id });
  const [savingEdit, setSavingEdit] = useState(false);
  const [personalGoal, setPersonalGoal] = useState<PersonalGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState(false);
  const [showDeleteGoalModal, setShowDeleteGoalModal] = useState(false);
  const [nutritionMeals, setNutritionMeals] = useState<MealSection[]>([]);
  const [nutritionCheckedKeys, setNutritionCheckedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!clientId) return;
    Promise.all([
      getMemberById(clientId),
      getCheckins(clientId),
      getPeriodCheckins(clientId),
    ]).then(([member, checkins, periodCheckins]) => {
      setClient(member);
      const withWeight = [...periodCheckins]
        .filter((c) => c.weight != null && c.weight !== "" && !isNaN(parseFloat(c.weight!)))
        .sort((a, b) => b.date.localeCompare(a.date));
      if (withWeight.length > 0) setLatestCheckinWeight(parseFloat(withWeight[0].weight!));
      const sortedAll = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
      if (sortedAll.length > 0) setLatestCheckin(sortedAll[0]);
    })
      .catch(console.error)
      .finally(() => setLoadingClient(false));
    // Load personal goal
    getPersonalGoal(clientId).then(setPersonalGoal).catch(console.error);
    // Load nutrition plan + meal log for today
    Promise.all([
      getClientNutritionPlan(clientId),
      getMealLog(clientId),
      getClientWorkoutPlan(clientId),
      getMemberById(clientId),
    ]).then(([nutrition, mealLog, workout, member]) => {
      if (!nutrition) return;
      const days = workout?.days ?? [];
      const cwDay = member?.currentWorkoutDay ?? 1;
      const todayPlanDay = days.find((d) => d.dayNumber === cwDay) ?? days[0] ?? null;
      let isWorkoutDay = todayPlanDay ? !todayPlanDay.isRestDay : true;
      if (!todayPlanDay && nutrition) {
        const wdHasItems = (nutrition.workoutDay?.meals ?? []).some((m) => m.items.length > 0);
        const odHasItems = (nutrition.offDay?.meals ?? []).some((m) => m.items.length > 0);
        if (odHasItems && !wdHasItems) isWorkoutDay = false;
      }

      // Override the plan-derived day with what the client actually logged today
      if (mealLog.workout && mealLog.workout.length > 0 && (!mealLog.off || mealLog.off.length === 0)) {
        isWorkoutDay = true;
      } else if (mealLog.off && mealLog.off.length > 0 && (!mealLog.workout || mealLog.workout.length === 0)) {
        isWorkoutDay = false;
      }

      const meals = isWorkoutDay ? (nutrition.workoutDay?.meals ?? []) : (nutrition.offDay?.meals ?? []);
      setNutritionMeals(meals);
      setNutritionCheckedKeys(new Set(isWorkoutDay ? mealLog.workout : mealLog.off));
    }).catch(console.error);
  }, [clientId]);

  const isActive = client?.status === "Active";

  async function handleToggleStatus() {
    if (!client) return;
    const newStatus = isActive ? "Inactive" : "Active";
    setTogglingStatus(true);
    try {
      await updateMemberStatus(clientId, newStatus);
      setClient((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingStatus(false);
      setShowStatusModal(false);
    }
  }

  async function handleDeleteGoal() {
    setDeletingGoal(true);
    try {
      await deletePersonalGoal(clientId);
      setPersonalGoal(null);
      setShowDeleteGoalModal(false);
    } catch (e) { console.error(e); }
    finally { setDeletingGoal(false); }
  }

  async function handleSaveEdit() {
    if (!client) return;
    setSavingEdit(true);
    try {
      const payload: Partial<Member> = {
        goalWeight: editForm.goalWeight ? Number(editForm.goalWeight) : client.goalWeight,
        plan: editForm.plan,
        membershipEnd: computeMembershipEnd(editForm.plan),
      };
      await updateMember(clientId, payload);
      setClient((prev) => prev ? { ...prev, ...payload } : prev);
      setShowEditModal(false);
    } catch (e) { console.error(e); }
    finally { setSavingEdit(false); }
  }

  const initial = client?.name?.charAt(0).toUpperCase() ?? "?";
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo(0, 0); // Scroll to top on tab change
  };

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-24">
      {/* Back Button */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          back
        </button>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Chat button */}
          <button
            onClick={() => router.push(`/trainer/chat/${clientId}`)}
            className="w-[34px] h-[34px] rounded-full bg-[#1c1c1e] border border-white/5 flex items-center justify-center hover:bg-[#a3e635]/20 hover:border-[#a3e635]/30 transition-all"
            title="Chat with client"
          >
            <MessageCircle className="w-[15px] h-[15px] text-gray-400" />
          </button>
          {/* Edit profile */}
          {!loadingClient && client && (
            <button
              onClick={() => {
                setEditForm({
                  goalWeight: client.goalWeight ? String(client.goalWeight) : "",
                  plan: client.plan || WEFIT_PLANS[0].id,
                });
                setShowEditModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border bg-[#1c1c1e] text-gray-300 border-white/10 hover:bg-[#2a2a2c]"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
          {/* Activate / Deactivate toggle */}
          {!loadingClient && client && (
            <button
              onClick={() => setShowStatusModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${isActive
                ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                : "bg-[#a3e635]/10 text-[#a3e635] border-[#a3e635]/20 hover:bg-[#a3e635]/20"
                }`}
            >
              {isActive ? (
                <><PowerOff className="w-3 h-3" /> Deactivate</>
              ) : (
                <><Power className="w-3 h-3" /> Activate</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loadingClient && (
        <div className="flex flex-col items-center mb-6 mt-4 animate-pulse">
          <div className="w-[70px] h-[70px] rounded-full bg-[#2a2a2c] mb-3" />
          <div className="h-5 w-32 bg-[#2a2a2c] rounded mb-2" />
          <div className="h-3 w-48 bg-[#2a2a2c] rounded" />
        </div>
      )}

      {/* Profile Card */}
      {!loadingClient && (
        <div className="flex flex-col items-center mb-6 mt-4">
          <div className="w-[70px] h-[70px] rounded-full overflow-hidden bg-[#2a2a2c] mb-3 border-2 border-[#a3e635]/30 flex items-center justify-center">
            <span className="text-[28px] font-extrabold text-[#a3e635]">{initial}</span>
          </div>
          <h2 className="text-[18px] font-extrabold text-white mb-1">{client?.name ?? "Unknown"}</h2>
          <p className="text-[11px] text-gray-500 font-medium mb-2">
            {client?.goal || client?.purpose || "No goal set"} • {client?.joinDate ?? ""}
          </p>
          <span className={`text-[9px] font-bold px-3 py-1 rounded-full ${client?.status === "Active"
            ? "bg-[#a3e635]/20 text-[#a3e635]"
            : "bg-gray-500/20 text-gray-400"
            }`}>
            {client?.status ?? "Unknown"}
          </span>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-[7px] flex-1 rounded-lg text-[11px] font-bold tracking-wide transition-all whitespace-nowrap ${activeTab === tab
              ? "bg-[#a3e635] text-black"
              : "bg-[#1c1c1e] text-gray-400 hover:text-white"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "Overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {/* ── Personal Goal Card ──────────────────────────────────────────── */}
          {personalGoal ? (() => {
            const cd = computeCountdown(personalGoal.targetDate);
            const start = personalGoal.startWeight;
            const current = personalGoal.currentWeight;
            const target = personalGoal.targetWeight;
            return (
              <div className="bg-[#1a1f14] border border-[#a3e635]/25 rounded-2xl p-4 mb-5">
                {/* Header */}
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <span className="text-[9px] font-extrabold text-[#a3e635] tracking-widest uppercase">Target 🎯</span>
                </div>
                {/* Title */}
                <p className="text-[18px] font-extrabold text-white text-center mb-1 tracking-wide">{personalGoal.title.toUpperCase()}</p>
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
                    <span className="text-[15px] font-extrabold text-white">{latestCheckinWeight ?? current} KG</span>
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
                {/* Edit / Delete */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => router.push(`/trainer/clients/${clientId}/personal-goal?edit=1`)}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#2a2a2c] hover:bg-[#333] text-white text-[12px] font-bold transition-colors border border-white/5"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteGoalModal(true)}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[12px] font-bold transition-colors border border-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })() : (
            <button
              onClick={() => router.push(`/trainer/clients/${clientId}/personal-goal`)}
              className="w-full h-[48px] bg-[#1c1c1e] hover:bg-[#2a2a2c] border border-dashed border-[#a3e635]/40 rounded-2xl flex items-center justify-center gap-2 mb-5 transition-all"
            >
              <Plus className="w-4 h-4 text-[#a3e635]" strokeWidth={2.5} />
              <span className="text-[13px] font-bold text-white">Add To Personal Goal</span>
            </button>
          )}
          {/* Stats Row */}
          {(() => {
            const startWeight = client?.startWeight ?? client?.currentWeight ?? 0;
            const goalWeight = client?.goalWeight ?? 0;
            const liveWeight = latestCheckinWeight ?? client?.currentWeight ?? startWeight;
            
            let progressPct = client?.progress ?? 0;
            if (startWeight && goalWeight && startWeight !== goalWeight) {
              const isGain = goalWeight > startWeight;
              if (isGain) {
                progressPct = ((liveWeight - startWeight) / (goalWeight - startWeight)) * 100;
              } else {
                progressPct = ((startWeight - liveWeight) / (startWeight - goalWeight)) * 100;
              }
              progressPct = Math.min(100, Math.max(0, Math.round(progressPct)));
            }

            return (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "Weight", value: liveWeight ? `${liveWeight}kg` : "--", emoji: "⚖️" },
                    { label: "Goal", value: goalWeight ? `${goalWeight}kg` : "--", emoji: "🎯" },
                    { label: "Plan", value: client?.plan ?? "--", emoji: "📦" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#1c1c1e] text-center rounded-2xl p-2 flex flex-col items-center gap-1 border border-white/5">
                      <span className="text-[16px]">{stat.emoji}</span>
                      <span className="text-[12px] font-bold text-white leading-none">{stat.value}</span>
                      <span className="text-[8px] text-gray-400 font-medium uppercase tracking-wide">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Goal Weight Section */}
                {startWeight && goalWeight ? (
                  <div className="bg-[#1c1c1e] rounded-2xl p-4 mb-5 border border-white/5">
                    <h3 className="text-[11px] font-extrabold text-white tracking-widest uppercase mb-2">ACTUAL GOAL</h3>
                    <p className="text-[14px] font-extrabold text-[#a3e635] mb-3">
                      CURRENT : {liveWeight}KG → TARGET : {goalWeight}KG
                    </p>
                    <div className="relative h-[6px] bg-[#2a2a2c] rounded-full overflow-hidden mb-2">
                      <div
                        className="absolute inset-y-0 left-0 bg-[#a3e635] rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-500 font-medium">
                      <span>Start: {startWeight}kg</span>
                      <span>Target: {goalWeight}kg</span>
                    </div>
                  </div>
                ) : null}
              </>
            );
          })()}





          {/* Subscription */}
          {/* <div className="bg-[#1c1c1e] rounded-2xl p-4 mb-5 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px]">📦</span>
              <h3 className="text-[10px] font-extrabold text-white tracking-widest uppercase">Subscription</h3>
            </div>
            <p className="text-[13px] font-bold text-white mb-0.5">{client?.plan ?? "--"}</p>
            <p className="text-[10px] text-gray-500 font-medium mb-3">Ends: {client?.membershipEnd ?? "--"}</p>
            <div className="flex gap-2">
              <button className="bg-[#a3e635]/20 text-[#a3e635] text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#a3e635]/30 transition-colors flex items-center gap-1">
                <RefreshCw className="w-[10px] h-[10px]" /> Pay & Renew
              </button>
              <button className="bg-[#eab308]/20 text-[#eab308] text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#eab308]/30 transition-colors flex items-center gap-1">
                <Bell className="w-[10px] h-[10px]" /> Notify
              </button>
            </div>
          </div> */}

          {/* Nutrition Summary */}
          <NutritionSummaryCard meals={nutritionMeals} checkedKeys={nutritionCheckedKeys} />

          {/* Contact */}
          <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5">
            <h3 className="text-[10px] font-extrabold text-white tracking-widest uppercase mb-3">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-[12px] h-[12px] text-gray-500" />
                <span className="text-[12px] text-gray-300 font-medium">{client?.email ?? "--"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-[12px] h-[12px] text-gray-500" />
                <span className="text-[12px] text-gray-300 font-medium">{client?.phone ?? "--"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-gray-300 font-medium">Injuries:</span>
                <span className="text-[12px] text-gray-300 font-medium">{client?.injuries ?? "--"}</span>
              </div>
            </div>
          </div>

        </motion.div>
      )}

      {/* Workouts Tab */}
      {activeTab === "Workouts" && (
        <WorkoutsTab clientId={clientId} router={router} />
      )}

      {/* Nutrition Tab */}
      {activeTab === "Nutrition" && (
        <NutritionTab clientId={clientId} router={router} />
      )}

      {/* Progress Tab */}
      {activeTab === "Progress" && (
        <ProgressTab clientId={clientId} />
      )}

      {/* Activate / Deactivate Confirmation Modal */}
      <AnimatePresence>
        {showStatusModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60]"
              onClick={() => setShowStatusModal(false)}
            />

            {/* Modal Sheet */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[#1c1c1e] rounded-t-3xl px-6 pt-6 pb-24 border-t border-white/10"
            >
              {/* Handle bar */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isActive ? "bg-red-500/15" : "bg-[#a3e635]/15"
                }`}>
                {isActive
                  ? <PowerOff className="w-6 h-6 text-red-400" />
                  : <Power className="w-6 h-6 text-[#a3e635]" />
                }
              </div>

              {/* Title */}
              <h3 className="text-[18px] font-extrabold text-white text-center mb-2">
                {isActive ? "Deactivate Member?" : "Activate Member?"}
              </h3>

              {/* Description */}
              <p className="text-[12px] text-gray-400 text-center leading-relaxed mb-6">
                {isActive
                  ? `${client?.name} will be marked as Inactive and may lose access to the app.`
                  : `${client?.name} will be marked as Active and will regain full app access.`
                }
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleToggleStatus}
                  disabled={togglingStatus}
                  className={`w-full h-13 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${isActive
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-[#a3e635] hover:bg-[#b5f745] text-black"
                    }`}
                >
                  {togglingStatus ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isActive ? (
                    <><PowerOff className="w-4 h-4" /> Yes, Deactivate</>
                  ) : (
                    <><Power className="w-4 h-4" /> Yes, Activate</>
                  )}
                </button>

                <button
                  onClick={() => setShowStatusModal(false)}
                  className="w-full h-12 rounded-2xl bg-[#2a2a2c] text-gray-300 font-bold text-[14px] hover:bg-[#333] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Edit Client Profile Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showEditModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60]"
              onClick={() => setShowEditModal(false)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[#1c1c1e] rounded-t-3xl border-t border-white/10 flex flex-col max-h-[90vh]"
            >
              {/* Handle + header */}
              <div className="pt-4 pb-2 px-6 flex-shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[18px] font-extrabold text-white">Edit Client</h3>
                  <button onClick={() => setShowEditModal(false)} className="text-gray-500 text-[12px] font-medium hover:text-white transition-colors">Cancel</button>
                </div>
              </div>

              {/* Fields */}
              <div className="overflow-y-auto flex-1 px-6 pb-10 space-y-5">
                {/* Goal Weight */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
                    GOAL WEIGHT &#123;KG&#125;
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 70"
                    value={editForm.goalWeight}
                    onChange={(e) => setEditForm((f) => ({ ...f, goalWeight: e.target.value }))}
                    className="w-full h-12 bg-[#1c1c1e] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
                  />
                </div>

                {/* Plan */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
                    MEMBERSHIP PLAN
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WEFIT_PLANS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, plan: p.id }))}
                        className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all border ${
                          editForm.plan === p.id
                            ? "bg-[#a3e635] text-black border-[#a3e635]"
                            : "bg-[#1c1e1c] text-gray-400 border-white/10 hover:border-[#a3e635]/30"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save */}
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="w-full h-14 bg-[#a3e635] hover:bg-[#b5f745] disabled:bg-[#2a2a2c] disabled:text-gray-500 text-black font-bold text-[15px] rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {savingEdit
                    ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Goal Confirm Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteGoalModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60]"
              onClick={() => setShowDeleteGoalModal(false)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[#1c1c1e] rounded-t-3xl px-6 pt-6 pb-24 border-t border-white/10"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-[18px] font-extrabold text-white text-center mb-2">Delete Personal Goal?</h3>
              <p className="text-[12px] text-gray-400 text-center leading-relaxed mb-6">
                This will permanently remove the personal goal for {client?.name}. This cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDeleteGoal}
                  disabled={deletingGoal}
                  className="w-full h-13 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-50"
                >
                  {deletingGoal ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <><Trash2 className="w-4 h-4" /> Yes, Delete</>}
                </button>
                <button onClick={() => setShowDeleteGoalModal(false)} className="w-full h-12 rounded-2xl bg-[#2a2a2c] text-gray-300 font-bold text-[14px] hover:bg-[#333] transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>

  );
}

// ── Circular Ring ─────────────────────────────────────────────────────────────

function CircularRing({ percent, size = 80, strokeWidth = 8, trackColor, progressColor, children }: {
  percent: number; size?: number; strokeWidth?: number;
  trackColor: string; progressColor: string; children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={progressColor} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

// ── Nutrition Summary Card ────────────────────────────────────────────────────

function NutritionSummaryCard({ meals, checkedKeys }: { meals: MealSection[]; checkedKeys: Set<string> }) {
  const totalKcal = Math.round(meals.reduce((s, m, mi) => s + m.items.reduce((ss, item, ii) => ss + (checkedKeys.has(`${mi}_${ii}`) ? (item.kcal || 0) : 0), 0), 0));
  const totalProtein = Number(meals.reduce((s, m, mi) => s + m.items.reduce((ss, item, ii) => ss + (checkedKeys.has(`${mi}_${ii}`) ? (item.protein || 0) : 0), 0), 0).toFixed(1));
  const totalCarbs = Number(meals.reduce((s, m, mi) => s + m.items.reduce((ss, item, ii) => ss + (checkedKeys.has(`${mi}_${ii}`) ? (item.carbs || 0) : 0), 0), 0).toFixed(1));
  const totalFats = Number(meals.reduce((s, m, mi) => s + m.items.reduce((ss, item, ii) => ss + (checkedKeys.has(`${mi}_${ii}`) ? (item.fats || 0) : 0), 0), 0).toFixed(1));
  const targetKcal = Math.max(1, Math.round(meals.reduce((s, m) => s + m.items.reduce((ss, i) => ss + (i.kcal || 0), 0), 0)));
  const targetProtein = Math.max(1, Number(meals.reduce((s, m) => s + m.items.reduce((ss, i) => ss + (i.protein || 0), 0), 0).toFixed(1)));
  const targetCarbs = Math.max(1, Number(meals.reduce((s, m) => s + m.items.reduce((ss, i) => ss + (i.carbs || 0), 0), 0).toFixed(1)));
  const targetFats = Math.max(1, Number(meals.reduce((s, m) => s + m.items.reduce((ss, i) => ss + (i.fats || 0), 0), 0).toFixed(1)));

  if (meals.length === 0) return null;

  const macros = [
    { label: "Protein", consumed: totalProtein, target: targetProtein, color: "bg-[#a3e635]" },
    { label: "Carbs", consumed: totalCarbs, target: targetCarbs, color: "bg-[#ef4444]" },
    { label: "Fats", consumed: totalFats, target: targetFats, color: "bg-[#a3e635]" },
  ];

  return (
    <div className="bg-[#1c1c1e] rounded-2xl p-5 mb-5 border border-white/5">
      <h3 className="text-[11px] font-extrabold text-white tracking-widest uppercase mb-4">NUTRITION SUMMARY</h3>
      <div className="flex items-center gap-6">
        <CircularRing
          percent={Math.min(100, Math.round((totalKcal / targetKcal) * 100))}
          size={85} strokeWidth={7} trackColor="#93c5fd" progressColor="#f97316"
        >
          <span className="text-[12px] font-bold text-white">{totalKcal}/{targetKcal}</span>
          <span className="text-[9px] text-gray-400 font-medium">kcal</span>
        </CircularRing>
        <div className="flex-1 space-y-3.5">
          {macros.map(({ label, consumed, target, color }) => (
            <div key={label}>
              <div className="flex justify-between text-[11px] font-bold mb-1.5">
                <span className="text-white">{label}</span>
                <span className="text-gray-400">{consumed}/{target}g</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-[5px]">
                <div className={`${color} h-[5px] rounded-full`} style={{ width: `${Math.min(100, Math.round((consumed / target) * 100))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
