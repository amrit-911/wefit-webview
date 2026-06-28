"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getTrainerById, daysUntilTrainerExpiry, TRAINER_PLANS } from "@/lib/services/trainers.service";

const PLAN_CARDS = [
  {
    planId: "1 Month",
    name: "WEFIT SIGNATURE PLAN",
    price: "999",
    period: "1 Month",
    features: ["Up To 20 Clients", "Workout Builder", "Basic Analytics"],
  },
  {
    planId: "3 Months",
    name: "WEFIT PRO",
    price: "2,499",
    period: "3 Months",
    features: ["Up To 50 Clients", "Workout + Nutrition Builder", "Client Messaging", "Advance Analytics"],
  },
  {
    planId: "6 Months",
    name: "WEFIT ELITE",
    price: "4,499",
    period: "6 Months",
    features: ["Unlimited Clients", "Full Feature Access", "PDF Reports", "Dedicated Support"],
  },
  {
    planId: "1 Year",
    name: "WEFIT MASTER PLAN",
    price: "4,499",
    period: "1 Year",
    features: ["Unlimited Clients", "Full Feature Access", "PDF Reports", "Dedicated Support"],
  },
];

export default function PlansPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [periodOfAccess, setPeriodOfAccess] = useState<string>("");
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getTrainerById(user.uid)
      .then((trainer) => {
        if (trainer) {
          setCurrentPlan(trainer.plan || null);
          setPeriodOfAccess(trainer.periodOfAccess || "");
        }
      })
      .finally(() => setLoadingPlan(false));
  }, [user?.uid]);

  const daysLeft = periodOfAccess ? daysUntilTrainerExpiry(periodOfAccess) : null;

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-12 px-5 pb-28">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-5 transition-colors"
      >
        <span className="mr-1 text-[14px]">←</span> back
      </button>

      {/* Header */}
      <h1 className="text-[26px] font-extrabold text-white leading-tight">Plans</h1>

      {/* Current plan summary */}
      {!loadingPlan && currentPlan && (
        <div className="mt-1 mb-6">
          <p className="text-[13px] text-gray-400 font-medium">
            Current:{" "}
            <span className="text-[#a3e635] font-bold">
              {PLAN_CARDS.find((p) => p.planId === currentPlan)?.name ?? currentPlan}
            </span>
          </p>
          {daysLeft !== null && (
            <p className={`text-[13px] font-semibold mt-0.5 ${daysLeft < 0 ? "text-red-400" : daysLeft <= 7 ? "text-orange-400" : "text-gray-400"}`}>
              {daysLeft < 0
                ? "Plan expired"
                : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
              {periodOfAccess ? ` · Expires ${periodOfAccess}` : ""}
            </p>
          )}
        </div>
      )}
      {!loadingPlan && !currentPlan && (
        <p className="text-[13px] text-gray-500 font-medium mt-0.5 mb-6">No active plan</p>
      )}
      {loadingPlan && (
        <p className="text-[13px] text-gray-600 font-medium mt-0.5 mb-6">Loading...</p>
      )}

      {/* Plan Cards */}
      <div className="space-y-4">
        {PLAN_CARDS.map((plan, i) => {
          const isCurrent = plan.planId === currentPlan;
          return (
            <motion.div
              key={plan.planId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`rounded-[20px] p-5 border ${isCurrent ? "bg-[#1c1c1e] border-[#a3e635]/40" : "bg-[#1c1c1e] border-white/5"}`}
            >
              {/* Plan name + badge */}
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-[15px] font-extrabold text-white tracking-wide leading-tight pr-2">
                  {plan.name}
                </h2>
                {isCurrent && (
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 bg-[#a3e635] text-black">
                    CURRENT
                  </span>
                )}
              </div>

              {/* Period */}
              <p className="text-[12px] text-gray-500 font-medium mb-3">{plan.period}</p>

              {/* Days remaining — only on current plan */}
              {isCurrent && daysLeft !== null && (
                <p className={`text-[12px] font-bold mb-3 ${daysLeft < 0 ? "text-red-400" : daysLeft <= 7 ? "text-orange-400" : "text-[#a3e635]"}`}>
                  {daysLeft < 0 ? "Expired" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
                </p>
              )}

              {/* Features */}
              <div className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <Check className="w-[14px] h-[14px] text-[#a3e635] shrink-0" strokeWidth={3} />
                    <span className="text-[12px] text-gray-300 font-medium">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full h-[46px] bg-[#2a2a2c] text-gray-400 text-[13px] font-bold rounded-[12px] cursor-default"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => router.push("/trainer/contact/plan-upgrade")}
                  className="w-full h-[46px] bg-[#a3e635] hover:bg-[#b4f446] text-black text-[13px] font-extrabold rounded-[12px] transition-colors"
                >
                  Contact for Upgrade
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
