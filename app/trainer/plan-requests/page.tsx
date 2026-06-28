"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpCircle, Clock, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import {
  getRequestsForTrainer,
  markRequestSeen,
  type ContactRequest,
} from "@/lib/services/contact-requests.service";
import { toast } from "sonner";

function timeAgo(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}


export default function TrainerPlanRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getRequestsForTrainer(user.uid)
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleMarkSeen = async (id: string) => {
    try {
      await markRequestSeen(id);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "seen" } : r))
      );
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-24 text-white">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-gray-400 text-[13px] font-medium mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        back
      </button>

      <h1 className="text-[24px] font-extrabold text-white mb-1">Plan Requests</h1>
      <p className="text-[13px] text-gray-500 mb-6">
        {pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? "s" : ""}` : "All caught up"}
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#1c1c1e] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center text-gray-500 text-[14px] py-20">No plan requests yet.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-[#1c1c1e] rounded-2xl p-4 border ${
                req.status === "pending" ? "border-[#a3e635]/30" : "border-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#a3e635]/15 flex items-center justify-center shrink-0">
                    <ArrowUpCircle className="w-4 h-4 text-[#a3e635]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-white">{req.fromName}</p>
                    {req.plan && (
                      <p className="text-[12px] text-[#a3e635] font-semibold mt-0.5">{req.plan}</p>
                    )}
                    <p className="text-[13px] text-gray-300 mt-1 line-clamp-2">{req.message}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(req.createdAt)}
                  </span>
                  {req.status === "pending" ? (
                    <button
                      onClick={() => handleMarkSeen(req.id)}
                      className="text-[11px] font-bold text-[#a3e635] hover:underline"
                    >
                      Mark seen
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> seen
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
