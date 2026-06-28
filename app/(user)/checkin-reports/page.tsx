"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  getCheckins,
  getPeriodCheckins,
  type CheckinData,
  type PeriodCheckinData,
} from "@/lib/services/checkin.service";
import { BottomNav } from "@/components/layout/bottom-nav";

// ── Tab type ────────────────────────────────────────────────────────────────
type Tab = "daily" | "monthly";

const MONTH_NAMES = [
  "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
  "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER",
];

function formatDailyDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();
}

// ── Main page ────────────────────────────────────────────────────────────────

function CheckinReportsContent() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("daily");
  const [dailyCheckins, setDailyCheckins] = useState<CheckinData[]>([]);
  const [monthlyCheckins, setMonthlyCheckins] = useState<PeriodCheckinData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([getCheckins(user.uid), getPeriodCheckins(user.uid)])
      .then(([daily, monthly]) => {
        setDailyCheckins(daily);
        setMonthlyCheckins(monthly);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen bg-[#121212] font-sans flex flex-col pb-28">
      {/* Header */}
      <div className="pt-12 px-5 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-5 transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          back
        </button>
        <h1 className="text-[22px] font-extrabold text-white mb-0.5">Check in Reports</h1>
        <p className="text-[12px] text-gray-500 font-medium">Your checkin reports</p>
      </div>

      {/* Tab switcher */}
      <div className="px-5 mb-5">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl text-[13px] font-extrabold tracking-wide transition-all ${
              activeTab === "daily"
                ? "bg-[#a3e635] text-black shadow-[0_0_16px_rgba(163,230,53,0.3)]"
                : "bg-[#1c1c1e] text-gray-400 border border-white/5"
            }`}
          >
            Daily Check-In
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${activeTab === "daily" ? "bg-black/20" : "bg-white/10"}`}>
              <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5.5L3.5 7.5L8.5 2.5" stroke={activeTab === "daily" ? "black" : "white"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("monthly")}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl text-[13px] font-extrabold tracking-wide transition-all ${
              activeTab === "monthly"
                ? "bg-[#a3e635] text-black shadow-[0_0_16px_rgba(163,230,53,0.3)]"
                : "bg-[#1c1c1e] text-gray-400 border border-white/5"
            }`}
          >
            Monthly Check-In
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${activeTab === "monthly" ? "bg-black/20" : "bg-white/10"}`}>
              <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5.5L3.5 7.5L8.5 2.5" stroke={activeTab === "monthly" ? "black" : "white"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 px-5">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#1c1c1e] rounded-2xl h-[72px] animate-pulse" />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Daily tab ── */}
          {!loading && activeTab === "daily" && (
            <motion.div
              key="daily"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {dailyCheckins.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-[48px] mb-4">📋</div>
                  <p className="text-[14px] font-bold text-white mb-1">No daily check-ins yet</p>
                  <p className="text-[12px] text-gray-500">Start logging from the Daily Check-In page</p>
                </div>
              )}
              {dailyCheckins.map((checkin, idx) => (
                <button
                  key={checkin.id ?? idx}
                  onClick={() =>
                    router.push(`/daily-checkin/details?date=${checkin.date}`)
                  }
                  className="w-full bg-[#1c1c1e] rounded-2xl px-4 py-4 flex items-center justify-between border border-white/5 hover:border-[#a3e635]/30 hover:bg-[#232323] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#a3e635] flex items-center justify-center text-black font-extrabold text-[15px] shrink-0 shadow-[0_0_12px_rgba(163,230,53,0.2)]">
                      {idx + 1}
                    </div>
                    <div className="text-left">
                      <h4 className="text-[13px] font-extrabold text-white tracking-wide">
                        {formatDailyDate(checkin.date)}
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

          {/* ── Monthly tab ── */}
          {!loading && activeTab === "monthly" && (
            <motion.div
              key="monthly"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {monthlyCheckins.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-[48px] mb-4">📊</div>
                  <p className="text-[14px] font-bold text-white mb-1">No monthly check-ins yet</p>
                  <p className="text-[12px] text-gray-500">Submit a periodic check-in to see it here</p>
                </div>
              )}
              {monthlyCheckins.map((checkin, idx) => {
                const monthIdx = parseInt(checkin.date.split("-")[1]) - 1;
                const monthName = MONTH_NAMES[monthIdx] ?? checkin.date;
                return (
                  <button
                    key={checkin.id ?? idx}
                    onClick={() =>
                      router.push(`/checkin-reports/monthly/${checkin.id}`)
                    }
                    className="w-full bg-[#1c1c1e] rounded-2xl px-4 py-4 flex items-center justify-between border border-white/5 hover:border-[#a3e635]/30 hover:bg-[#232323] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#a3e635] flex items-center justify-center text-black font-extrabold text-[15px] shrink-0 shadow-[0_0_12px_rgba(163,230,53,0.2)]">
                        {idx + 1}
                      </div>
                      <div className="text-left">
                        <h4 className="text-[13px] font-extrabold text-white tracking-wide">
                          {monthName}
                          <span className="text-gray-400 font-medium ml-2">
                            {new Date(checkin.date + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </h4>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                          {checkin.weight ? `${checkin.weight}KG` : "—"}
                          <span className="mx-1.5 text-gray-600">•</span>
                          Energy {checkin.energy ?? "—"}/10
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#a3e635] transition-colors" />
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}

export default function CheckinReportsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
      <CheckinReportsContent />
    </Suspense>
  );
}
