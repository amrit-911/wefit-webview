"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getMemberById, type Member } from "@/lib/services/members.service";
import { getPeriodCheckins } from "@/lib/services/checkin.service";
import { daysUntilExpiry } from "@/lib/services/subscriptions.service";

export function CircularRing({ percent, size = 80, strokeWidth = 8, trackColor, progressColor, children }: any) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
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

export function GoalCountdown() {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [liveWeight, setLiveWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      getMemberById(user.uid),
      getPeriodCheckins(user.uid),
    ])
      .then(([m, periodCheckins]) => {
        if (m) {
          const raw = m as any;
          const onb = raw.onboarding ?? {};
          if (!m.currentWeight && onb.weight) m.currentWeight = Number(onb.weight);
          if (!m.goalWeight && onb.goalWeight) m.goalWeight = Number(onb.goalWeight);
          if (!m.goal && onb.goal) m.goal = onb.goal;
          if (!m.joinDate && onb.completedAt) {
            const ts = typeof onb.completedAt?.toDate === "function"
              ? onb.completedAt.toDate()
              : onb.completedAt?.seconds
                ? new Date(onb.completedAt.seconds * 1000)
                : null;
            if (ts) m.joinDate = ts.toISOString().split("T")[0];
          }
        }
        setMember(m);

        // Latest period check-in with a valid weight
        const latest = periodCheckins
          .filter((c) => c.weight != null && c.weight !== "" && !isNaN(parseFloat(c.weight!)))
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        if (latest?.weight) setLiveWeight(parseFloat(latest.weight!));
      })
      .finally(() => setLoading(false));
  }, [user?.uid]);

  if (loading) {
    return <div className="bg-[#1c1c1e] rounded-2xl p-5 mb-5 shadow-lg mt-1 h-[110px] animate-pulse" />;
  }

  if (!member) return null;

  const startWeight = member.startWeight ?? member.currentWeight ?? 0;
  const goalWeight = member.goalWeight ?? 0;
  const currentWeight = liveWeight ?? member.currentWeight ?? startWeight;

  // Don't render if no meaningful weight data
  if (!startWeight && !goalWeight) return null;

  const isGain = goalWeight > startWeight;
  const isMaintenance = goalWeight === startWeight;
  const challengeTitle = isMaintenance ? "WEIGHT MAINTENANCE" : isGain ? "WEIGHT GAIN CHALLENGE" : "WEIGHT LOSS CHALLENGE";
  const weightDiff = Number(Math.abs(goalWeight - startWeight).toFixed(1));

  // Weight progress % (how far from start toward goal)
  let rawProgress = 0;
  if (startWeight === goalWeight) {
    rawProgress = 100;
  } else if (isGain) {
    rawProgress = ((currentWeight - startWeight) / (goalWeight - startWeight)) * 100;
  } else {
    rawProgress = ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100;
  }
  const weightProgressPct = Math.min(100, Math.max(0, Math.round(rawProgress)));

  // Days from plan membership
  const daysLeft = member.membershipEnd ? Math.max(0, daysUntilExpiry(member.membershipEnd) ?? 0) : 0;

  // Total plan days to compute time-elapsed ring
  const planInfo = (() => {
    if (!member.membershipEnd || !member.joinDate) return null;
    const endMs = new Date(member.membershipEnd.includes("/")
      ? member.membershipEnd.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, "$3-$2-$1")
      : member.membershipEnd
    ).getTime();
    const startMs = new Date(member.joinDate).getTime();
    if (isNaN(endMs) || isNaN(startMs)) return null;
    const total = Math.max(1, Math.round((endMs - startMs) / 86400000));
    const elapsed = total - daysLeft;
    return { total, timeElapsedPct: Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) };
  })();

  const ringPercent = planInfo?.timeElapsedPct ?? 0;
  const totalDays = planInfo?.total ?? daysLeft;

  return (
    <div className="bg-[#1c1c1e] rounded-2xl p-5 mb-5 shadow-lg mt-1 relative overflow-hidden">
      <div className="flex flex-col items-center text-center">
        <p className="text-[10px] text-[#a3e635] font-extrabold tracking-widest mb-1">
          GOAL COUNTDOWN 🎯
        </p>
        <h2 className="text-[16px] font-extrabold text-white mb-6">{challengeTitle}</h2>

        <div className="flex items-center w-full gap-5">
          <CircularRing
            percent={ringPercent}
            size={60}
            strokeWidth={5}
            trackColor="#2563eb"
            progressColor="#e0e7ff"
          >
            <span className="text-[14px] font-bold text-[#a3e635]">{daysLeft}</span>
            <span className="text-[8px] font-medium text-gray-400">Days</span>
          </CircularRing>

          <div className="flex-1 text-left relative top-1">
            <div className="flex justify-between text-[10px] font-bold mb-2">
              <span className="text-white">{weightProgressPct}% Complete</span>
              <span className="text-gray-400">{daysLeft} days left</span>
            </div>
            <div className="w-full bg-[#374151] rounded-full h-[6px]">
              <div
                className="bg-[#3b82f6] h-[6px] rounded-full transition-all"
                style={{ width: `${weightProgressPct}%` }}
              />
            </div>
            <p className="text-[12px] text-gray-400 font-medium mt-3 text-center pr-4">
              {isGain ? "Gain" : "Lose"} {weightDiff.toFixed(1)} kg in {totalDays} days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
