"use client";

import { ArrowLeft, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { getMemberById } from "@/lib/services/members.service";
import { PTRB_PAID_PLANS, daysUntilExpiry } from "@/lib/services/subscriptions.service";

export default function RenewPlanPage() {
  const router = useRouter();
  const { user, displayName, avatarUrl } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>("");
  const [membershipEnd, setMembershipEnd] = useState<string>("");
  const [status, setStatus] = useState<string>("Active");

  useEffect(() => {
    if (!user) return;
    getMemberById(user.uid).then((m) => {
      if (!m) return;
      if (m.plan) setCurrentPlan(m.plan);
      if (m.membershipEnd) setMembershipEnd(m.membershipEnd);
      if (m.status) setStatus(m.status);
    }).catch(console.error);
  }, [user]);

  const days = membershipEnd ? daysUntilExpiry(membershipEnd) : null;

  const handleContactTrainer = () => {
    router.push("/contact/plan-upgrade");
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col font-sans text-white px-5 pt-10 pb-10">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-white mb-8 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-[13px] font-semibold text-gray-400">back</span>
      </button>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold text-white leading-tight">Renew Plan</h1>
        {displayName && (
          <p className="text-[13px] text-gray-400 font-medium mt-0.5">For {displayName}</p>
        )}
      </div>

      {/* Member Card */}
      <div className="bg-[#1c1c1e] rounded-2xl p-4 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#a3e635] flex items-center justify-center shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-[20px] font-extrabold text-black">
              {displayName ? displayName.charAt(0).toUpperCase() : "U"}
            </span>
          )}
        </div>
        <div>
          <p className="text-[15px] font-extrabold text-white">{displayName || "Member"}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] font-medium text-gray-300">
              {status === "Active" ? "Monthly Active" : status}
            </span>
            {days !== null && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                days <= 7
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-[#2a2a2c] text-gray-300"
              }`}>
                {days > 0 ? `${days}d left` : "Expired"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Plan Selection Label */}
      <p className="text-[13px] font-semibold text-white mb-3">Select Plan</p>

      {/* Plan Cards */}
      <div className="flex flex-col gap-3 mb-8">
        {PTRB_PAID_PLANS.map((plan) => {
          const isSelected = currentPlan.toLowerCase() === plan.id.toLowerCase();
          return (
            <div
              key={plan.id}
              className={`rounded-2xl px-5 py-4 flex items-center justify-between border transition-all ${
                isSelected
                  ? "bg-[#1c1c1e] border-[#a3e635]"
                  : "bg-[#1c1c1e] border-transparent"
              }`}
            >
              <div>
                <p className="text-[14px] font-extrabold text-white">{plan.name}</p>
                {plan.tag ? (
                  <p className="text-[12px] font-semibold text-[#a3e635] mt-0.5">{plan.tag}</p>
                ) : (
                  <p className="text-[12px] font-medium text-gray-400 mt-0.5">{plan.duration}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contact Trainer Button */}
      <button
        onClick={handleContactTrainer}
        className="w-full bg-[#a3e635] text-black text-[14px] font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2"
      >
        <CreditCard className="w-4 h-4 text-black" />
        Contact Trainer
      </button>
    </div>
  );
}
