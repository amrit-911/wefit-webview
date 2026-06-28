"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getMemberById } from "@/lib/services/members.service";
import { PTRB_PAID_PLANS } from "@/lib/services/subscriptions.service";
import { submitContactRequest } from "@/lib/services/contact-requests.service";
import { toast } from "sonner";

export default function UserPlanUpgradePage() {
  const router = useRouter();
  const { user, displayName } = useAuth();
  const [plan, setPlan] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resolvedTrainerId, setResolvedTrainerId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getMemberById(user.uid).then((m) => {
      if (m?.plan) setPlan(m.plan);
      if (m?.trainer) setResolvedTrainerId(m.trainer);
    }).catch(console.error);
  }, [user]);

  const handleSubmit = async () => {
    if (!plan) { toast.error("Please select a plan."); return; }
    if (!message.trim()) { toast.error("Please enter a message."); return; }
    if (!resolvedTrainerId) { toast.error("No trainer assigned. Contact admin instead."); return; }
    if (!user) return;

    setSubmitting(true);
    try {
      await submitContactRequest({
        type: "plan_upgrade",
        fromId: user.uid,
        fromName: displayName || user.email || "User",
        fromRole: "user",
        toRole: "trainer",
        toId: resolvedTrainerId,
        plan,
        message: message.trim(),
      });
      toast.success("Request sent to your trainer!");
      router.back();
    } catch {
      toast.error("Failed to send request. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-10 text-white">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-gray-400 text-[13px] font-medium mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        back
      </button>

      <h1 className="text-[24px] font-extrabold text-white mb-1">Plan Upgrade</h1>
      <p className="text-[13px] text-gray-500 mb-8">Your request will be sent to your trainer.</p>

      {/* Plan dropdown */}
      <div className="mb-5">
        <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-2 block">
          Select Plan
        </label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="w-full bg-[#1c1c1e] border border-white/10 text-white text-[14px] font-semibold rounded-2xl px-4 py-3.5 appearance-none focus:outline-none focus:border-[#a3e635]"
        >
          <option value="" disabled>Choose a plan...</option>
          {PTRB_PAID_PLANS.map((p) => (
            <option key={p.id} value={p.id}>{p.name} — {p.duration}</option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div className="mb-8">
        <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-2 block">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell your trainer what you need..."
          rows={4}
          className="w-full bg-[#1c1c1e] border border-white/10 text-white text-[14px] rounded-2xl px-4 py-3.5 resize-none focus:outline-none focus:border-[#a3e635] placeholder:text-gray-600"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-[#a3e635] text-black text-[14px] font-extrabold py-4 rounded-2xl disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send Request"}
      </button>
    </div>
  );
}
