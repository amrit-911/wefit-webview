"use client";

import { motion } from "framer-motion";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Target } from "lucide-react";
import { GoalCountdown } from "@/components/ui/goal-countdown";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getCheckins, getPeriodCheckins, type CheckinData } from "@/lib/services/checkin.service";
import { getMemberById } from "@/lib/services/members.service";
import { getWorkoutLogs, type WorkoutLog } from "@/lib/services/workout-log.service";
import { getLocalDateString } from "@/lib/utils";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface WeightPoint {
  date: string;
  weight: number;
}


export default function ProgressPage() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [chartData, setChartData] = useState<WeightPoint[]>([]);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [startWeight, setStartWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getCheckins(user.uid),
      getMemberById(user.uid),
      getWorkoutLogs(user.uid),
      getPeriodCheckins(user.uid),
    ]).then(([cks, member, logs, periodCks]) => {
      setCheckins(cks);
      setWorkoutLogs(logs);
      if (member?.goalWeight) setGoalWeight(member.goalWeight);
      if (member) {
        setStartWeight(member.startWeight ?? member.currentWeight ?? null);
      }

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

      setChartData(points);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const workoutDates = new Set(workoutLogs.map((l) => l.date));
  const checkinDates = new Set(checkins.map((c) => c.date));

  const now = new Date();

  return (
    <div className="flex flex-col min-h-screen font-sans pb-4 text-white px-5 pt-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-white mb-0.5">Progress</h1>
        <p className="text-[12px] font-medium text-gray-400">Your fitness journey</p>
      </div>

      {/* Stat Cards — current weight + streak only */}
      {/* <div className="flex gap-3 mb-6">
        <StatCard
          value={currentWeight !== null ? `${currentWeight} Kg` : "—"}
          label={goalWeight ? `Goal : ${goalWeight}` : "Current weight"}
          icon={
            <div className="relative w-6 h-6 flex items-center justify-center">
              <Target className="w-5 h-5 text-red-500 z-10" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full blur-[2px]" />
            </div>
          }
        />
        <StatCard
          value={`${streak} Days`}
          label="Current streak"
          icon={
            <div className="relative w-5 h-6 bg-white rounded-[4px] overflow-hidden shadow-sm flex flex-col">
              <div className="w-full h-2 bg-red-500" />
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[10px] font-bold text-black" style={{ marginTop: "-2px" }}>
                  {now.getDate()}
                </span>
              </div>
            </div>
          }
        />
      </div> */}

      {/* Goal Countdown */}
      <GoalCountdown />

      {/* Weight Progress Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1c1c1e] rounded-2xl p-5 mb-4"
      >
        <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-4">
          Weight Progress
        </h3>
        {loading ? (
          <div className="h-[160px] flex items-center justify-center text-gray-500 text-[12px]">
            Loading...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[120px] flex items-center justify-center text-gray-500 text-[12px]">
            No weight data yet. Start checking in!
          </div>
        ) : (
          <WeightLineChart data={chartData} />
        )}
      </motion.div>

      {/* Workout Consistency Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1c1c1e] rounded-2xl p-5 mb-4"
      >
        <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-4">
          Workout Consistency
        </h3>
        <WorkoutConsistencyCalendar
          workoutDates={workoutDates}
          checkinDates={checkinDates}
          calendarDate={calendarDate}
          onPrevMonth={() => {
            const nd = new Date(calendarDate);
            nd.setMonth(nd.getMonth() - 1);
            setCalendarDate(nd);
          }}
          onNextMonth={() => {
            const nd = new Date(calendarDate);
            nd.setMonth(nd.getMonth() + 1);
            setCalendarDate(nd);
          }}
        />
      </motion.div>

      {/* Workout Logs */}
      <Link href="/workout-logs" className="block mb-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-[#1c1c1e] rounded-2xl px-5 py-4 flex items-center gap-4 border border-white/5 hover:border-[#a3e635]/30 active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 bg-[#a3e635] rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(163,230,53,0.25)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="4" height="7" rx="1.5" fill="black" />
              <rect x="17" y="11" width="4" height="7" rx="1.5" fill="black" />
              <rect x="7" y="13" width="10" height="3" rx="1.5" fill="black" />
              <rect x="2" y="12.5" width="2.5" height="4" rx="1" fill="black" />
              <rect x="19.5" y="12.5" width="2.5" height="4" rx="1" fill="black" />
            </svg>
          </div>
          <div>
            <h4 className="text-[15px] font-extrabold text-white tracking-wide mb-0.5">
              WORKOUT LOGS
            </h4>
            <p className="text-[11px] text-gray-400 font-medium">View all your workout history</p>
          </div>
        </motion.div>
      </Link>

      {/* Daily Check In Reports */}
      <Link href="/checkin-reports" className="block mb-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1c1c1e] rounded-2xl px-5 py-4 flex items-center gap-4 border border-white/5 hover:border-[#a3e635]/30 active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 bg-[#a3e635] rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(163,230,53,0.25)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 10h10M4 14h7" stroke="black" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M17 13l-4 4 2 1 4-4-2-1z" fill="black" />
              <path d="M13 17l1 3 1-2 2-1-1-3-1 2-2 1z" fill="black" />
            </svg>
          </div>
          <div>
            <h4 className="text-[15px] font-extrabold text-white tracking-wide mb-0.5">
              DAILY CHECK IN REPORTS
            </h4>
            <p className="text-[11px] text-gray-400 font-medium">Log your Weight, mood &amp; Energy</p>
          </div>
        </motion.div>
      </Link>

      {/* Photo Gallery */}
      <Link href="/photo-gallery" className="block mb-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-[#1c1c1e] rounded-2xl px-5 py-4 flex items-center justify-between border border-white/5 hover:border-[#a3e635]/30 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#1e1e20] rounded-xl flex items-center justify-center shrink-0 border border-white/10">
              <span className="text-[22px]">📸</span>
            </div>
            <h4 className="text-[14px] font-extrabold text-white tracking-wide">PHOTO GALLERY</h4>
          </div>
          <svg
            className="w-4 h-4 text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.div>
      </Link>

      {/* Goal Progress */}
      {/* <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-[#1c1c1e] rounded-2xl p-5 mb-6"
      >
        <h3 className="text-[11px] font-bold text-white mb-3">Goal Progress</h3>
        <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-2">
          <span>
            {startWeight ?? "?"}KG / {goalWeight ?? "?"}KG
          </span>
          <span className="text-gray-400">{currentWeight ?? "?"}KG</span>
        </div>
        <div className="w-full h-3 bg-white rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-[#a3e635] rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
          <span>{progressPct}% Progress</span>
          {goalWeight !== null && currentWeight !== null && (
            <>
              <span className="text-[8px]">•</span>
              <span>{Math.abs(parseFloat((currentWeight - goalWeight).toFixed(1)))}kg Remaining</span>
            </>
          )}
        </div>
      </motion.div> */}

      <BottomNav />
    </div>
  );
}

// ── Weight Line Chart ────────────────────────────────────────────────────────

function WeightLineChart({ data }: { data: WeightPoint[] }) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric" });

  // Show at most ~5 x-axis labels regardless of data density
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
  calendarDate,
  onPrevMonth,
  onNextMonth,
}: {
  workoutDates: Set<string>;
  checkinDates: Set<string>;
  calendarDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const todayStr = getLocalDateString();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const monthLabel =
    calendarDate.toLocaleString("en-US", { month: "long" }).toUpperCase() +
    " " +
    year;

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay(); // 0 = Sunday

  const cells: CalendarCell[] = [];

  // Fill days from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ dateStr: getLocalDateString(d), day: d.getDate(), inMonth: false });
  }
  // Current month days
  for (let i = 1; i <= lastDate; i++) {
    const d = new Date(year, month, i);
    cells.push({ dateStr: getLocalDateString(d), day: i, inMonth: true });
  }
  // Fill remaining cells to complete the last row
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
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
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onPrevMonth}
          className="w-8 h-8 rounded-full bg-[#a3e635] flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[13px] font-bold text-white tracking-widest">{monthLabel}</span>
        <button
          onClick={onNextMonth}
          className="w-8 h-8 rounded-full bg-[#a3e635] flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {DOW.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
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

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#1c1c1e] rounded-[14px] p-2 flex flex-col items-center justify-center flex-1 aspect-[4/5] text-center shadow-lg">
      <div className="mb-2.5 h-6 flex items-center justify-center">{icon}</div>
      <div className="text-[12px] font-bold text-white mb-1.5 whitespace-nowrap">{value}</div>
      <div className="text-[8px] font-medium text-gray-400 leading-tight">{label}</div>
    </div>
  );
}
