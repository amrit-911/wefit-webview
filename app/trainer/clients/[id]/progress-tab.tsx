"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, CalendarDays, UtensilsCrossed, Dumbbell } from "lucide-react";
import { getCheckins, getPeriodCheckins, type CheckinData } from "@/lib/services/checkin.service";
import { getWorkoutLogs, type WorkoutLog } from "@/lib/services/workout-log.service";
import { getMemberById } from "@/lib/services/members.service";
import { getLocalDateString } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PERIOD_OPTIONS = [
  { label: "3 Days", value: "3days" },
  { label: "7 Days", value: "7days" },
  { label: "14 Days", value: "14days" },
  { label: "1 Month", value: "1month" },
] as const;

interface WeightPoint {
  date: string;
  weight: number;
}

export function ProgressTab({ clientId }: { clientId?: string }) {
  const router = useRouter();
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [weightChartData, setWeightChartData] = useState<WeightPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [showMonthlyDropdown, setShowMonthlyDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    Promise.all([
      getCheckins(clientId),
      getPeriodCheckins(clientId),
      getWorkoutLogs(clientId),
      getMemberById(clientId),
    ]).then(([cks, periodCks, logs, member]) => {
      setCheckins(cks);
      setWorkoutLogs(logs);

      const points: WeightPoint[] = periodCks
        .filter((c) => c.weight != null && c.weight !== "" && !isNaN(parseFloat(c.weight!)))
        .map((c) => ({ date: c.date, weight: parseFloat(c.weight!) }))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (member?.currentWeight) {
        let startDate: string;
        if (member.createdAt) {
          const ts = member.createdAt as any;
          const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
          startDate = d.toISOString().split("T")[0];
        } else if (points.length > 0) {
          const d = new Date(points[0].date);
          d.setDate(d.getDate() - 1);
          startDate = d.toISOString().split("T")[0];
        } else {
          startDate = new Date().toISOString().split("T")[0];
        }
        if (!points.some((p) => p.date === startDate)) {
          points.unshift({ date: startDate, weight: member.currentWeight });
        }
      }

      setWeightChartData(points);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const workoutDates = new Set(workoutLogs.map((l) => l.date));
  const checkinDates = new Set(checkins.map((c) => c.date));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-4">

      {/* ── Check-In Navigation Buttons ── */}


      {/* ── Weight Progress Line Chart ── */}
      <div className="bg-[#1c1c1e] rounded-2xl p-5 mb-5 border border-white/5">
        <p className="text-[11px] font-extrabold text-white tracking-widest uppercase mb-4">
          Weight Progress
        </p>
        {loading ? (
          <div className="h-[180px] bg-[#2a2a2c] rounded-xl animate-pulse" />
        ) : weightChartData.length === 0 ? (
          <div className="h-[120px] flex flex-col items-center justify-center text-center">
            <p className="text-[13px] font-bold text-white mb-1">No weight data yet</p>
            <p className="text-[11px] text-gray-500">Weight is logged via monthly check-ins</p>
          </div>
        ) : (
          <WeightLineChart data={weightChartData} />
        )}
      </div>

      {/* ── Stats Row ── */}
      {/* <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-[18px]">🎯</span>
          </div>
          <p className="text-[18px] font-extrabold text-white leading-none">
            {loading ? "—" : rawChange !== null ? `${rawChange >= 0 ? "+" : ""}${rawChange} Kg` : "—"}
          </p>
          <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Weight Change</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#a3e635]/20 flex items-center justify-center">
            <span className="text-[18px]">📅</span>
          </div>
          <p className="text-[18px] font-extrabold text-white leading-none">
            {loading ? "—" : `${workoutRate}%`}
          </p>
          <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Check-in Rate</p>
        </div>
      </div> */}

      {/* ── Workout Consistency Calendar ── */}
      <div className="bg-[#1c1c1e] rounded-2xl p-4 mb-5 border border-white/5">
        <p className="text-[11px] font-extrabold text-white tracking-widest uppercase mb-4">
          Workout Consistency
        </p>
        <WorkoutConsistencyCalendar
          workoutDates={workoutDates}
          checkinDates={checkinDates}
          calMonth={calMonth}
          calYear={calYear}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />
      </div>

      <div className="flex gap-3 mb-5">
        <button
          onClick={() => router.push(`/trainer/clients/${clientId}/checkins/daily`)}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#1c1c1e] hover:bg-[#a3e635]/10 border border-white/5 hover:border-[#a3e635]/40 transition-all group"
        >
          <Calendar className="w-4 h-4 text-[#a3e635]" />
          <span className="text-[13px] font-bold text-white group-hover:text-[#a3e635] transition-colors">Daily Check-In</span>
        </button>

        <div className="flex-1 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowMonthlyDropdown((v) => !v)}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#1c1c1e] hover:bg-[#a3e635]/10 border border-white/5 hover:border-[#a3e635]/40 transition-all group"
          >
            <CalendarDays className="w-4 h-4 text-[#a3e635]" />
            <span className="text-[13px] font-bold text-white group-hover:text-[#a3e635] transition-colors">Monthly Check-In</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showMonthlyDropdown ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showMonthlyDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[calc(100%+6px)] left-0 right-0 bg-[#1c1c1e] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setShowMonthlyDropdown(false);
                      router.push(`/trainer/clients/${clientId}/checkins/monthly?period=${opt.value}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#a3e635]/10 hover:text-[#a3e635] text-white text-[13px] font-bold transition-colors border-b border-white/5 last:border-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#a3e635]/50" />
                    {opt.label} Check-In
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Workout Logs Button ── */}
      <button
        onClick={() => router.push(`/trainer/clients/${clientId}/workout-logs`)}
        className="w-full flex items-center justify-between px-5 py-4 mb-5 bg-[#1c1c1e] rounded-2xl border border-white/5 hover:border-[#a3e635]/30 hover:bg-[#232323] transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1e1e20] rounded-xl flex items-center justify-center border border-white/10 shrink-0">
            <Dumbbell className="w-4 h-4 text-[#a3e635]" />
          </div>
          <span className="text-[14px] font-extrabold text-white tracking-wide group-hover:text-[#a3e635] transition-colors">WORKOUT LOGS</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#a3e635] transition-colors" />
      </button>

      {/* ── Photo Gallery Button ── */}
      <button
        onClick={() => router.push(`/trainer/clients/${clientId}/gallery`)}
        className="w-full flex items-center justify-between px-5 py-4 mb-5 bg-[#1c1c1e] rounded-2xl border border-white/5 hover:border-[#a3e635]/30 hover:bg-[#232323] transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1e1e20] rounded-xl flex items-center justify-center border border-white/10 shrink-0">
            <span className="text-[18px]">📸</span>
          </div>
          <span className="text-[14px] font-extrabold text-white tracking-wide group-hover:text-[#a3e635] transition-colors">PHOTO GALLERY</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#a3e635] transition-colors" />
      </button>

      {/* ── Nutrition Log Button ── */}
      <button
        onClick={() => router.push(`/trainer/clients/${clientId}/nutrition-logs`)}
        className="w-full flex items-center justify-between px-5 py-4 mb-5 bg-[#1c1c1e] rounded-2xl border border-white/5 hover:border-[#a3e635]/30 hover:bg-[#232323] transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1e1e20] rounded-xl flex items-center justify-center border border-white/10 shrink-0">
            <UtensilsCrossed className="w-4 h-4 text-[#a3e635]" />
          </div>
          <span className="text-[14px] font-extrabold text-white tracking-wide group-hover:text-[#a3e635] transition-colors">NUTRITION LOG</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#a3e635] transition-colors" />
      </button>

      {/* ── Generate PDF Report ── */}
      {/* <button className="w-full h-12 bg-[#1c1c1e] hover:bg-[#2a2a2c] border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-colors">
        <span className="text-[13px] font-bold text-gray-400">Generate Pdf Report</span>
      </button> */}

    </motion.div>
  );
}

// ── Weight Line Chart ────────────────────────────────────────────────────────

function WeightLineChart({ data }: { data: WeightPoint[] }) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric" });

  const tickInterval = Math.max(0, Math.ceil(data.length / 5) - 1);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2c" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          interval={tickInterval}
          tick={{ fill: "#6b7280", fontSize: 9 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[40, "auto"]}
          tick={{ fill: "#6b7280", fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}kg`}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: "#1c1c1e",
            border: "1px solid #2a2a2c",
            borderRadius: 8,
            color: "#fff",
            fontSize: 11,
          }}
          formatter={(value) => [`${value ?? ""} kg`, "Weight"]}
          labelFormatter={(label) => formatDate(String(label))}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#a3e635"
          strokeWidth={2.5}
          dot={{ fill: "#a3e635", r: 4, strokeWidth: 0 }}
          activeDot={{ fill: "#a3e635", r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Workout Consistency Calendar ─────────────────────────────────────────────

type CalendarCell = { dateStr: string; day: number; inMonth: boolean };

function WorkoutConsistencyCalendar({
  workoutDates,
  checkinDates,
  calMonth,
  calYear,
  onPrevMonth,
  onNextMonth,
}: {
  workoutDates: Set<string>;
  checkinDates: Set<string>;
  calMonth: number;
  calYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const todayStr = getLocalDateString();
  const monthLabel = MONTH_NAMES[calMonth].toUpperCase() + " " + calYear;

  const firstDay = new Date(calYear, calMonth, 1);
  const lastDate = new Date(calYear, calMonth + 1, 0).getDate();
  const startDow = firstDay.getDay();

  const cells: CalendarCell[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(calYear, calMonth, -i);
    cells.push({ dateStr: getLocalDateString(d), day: d.getDate(), inMonth: false });
  }
  for (let i = 1; i <= lastDate; i++) {
    const d = new Date(calYear, calMonth, i);
    cells.push({ dateStr: getLocalDateString(d), day: i, inMonth: true });
  }
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(calYear, calMonth + 1, i);
    cells.push({ dateStr: getLocalDateString(d), day: i, inMonth: false });
  }

  const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  function getStatus(cell: CalendarCell): "green" | "red" | "grey" {
    if (!cell.inMonth || cell.dateStr > todayStr) return "grey";
    if (workoutDates.has(cell.dateStr)) return "green";
    if (checkinDates.has(cell.dateStr)) return "red";
    return "grey";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onPrevMonth}
          className="w-8 h-8 rounded-full bg-[#a3e635] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-4 h-4 text-black" strokeWidth={3} />
        </button>
        <span className="text-[13px] font-bold text-white tracking-widest">{monthLabel}</span>
        <button
          onClick={onNextMonth}
          className="w-8 h-8 rounded-full bg-[#a3e635] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ChevronRight className="w-4 h-4 text-black" strokeWidth={3} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DOW.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold text-gray-500">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2">
        {cells.map((cell, idx) => {
          const status = getStatus(cell);
          let circleClass: string;
          let textClass: string;

          if (!cell.inMonth) {
            circleClass = "border border-dashed border-gray-700";
            textClass = "text-gray-700";
          } else if (status === "green") {
            circleClass = "bg-[#4ade80]";
            textClass = "text-black font-bold";
          } else if (status === "red") {
            circleClass = "bg-[#ef4444]";
            textClass = "text-white font-bold";
          } else {
            circleClass = "bg-[#2d2d2f]";
            textClass = "text-gray-400";
          }

          return (
            <div key={idx} className="flex items-center justify-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${circleClass}`}>
                <span className={`text-[12px] ${textClass}`}>{cell.day}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

