"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ArrowUpCircle, Clock, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  getRequestsForAdmin,
  markRequestSeen,
  type ContactRequest,
} from "@/lib/services/contact-requests.service";
import { toast } from "sonner";

const tabs = ["All", "Plan Upgrades", "Support"] as const;
type Tab = (typeof tabs)[number];

function timeAgo(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const load = () => {
    setLoading(true);
    getRequestsForAdmin()
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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

  const filtered = requests.filter((r) => {
    if (activeTab === "Plan Upgrades") return r.type === "plan_upgrade";
    if (activeTab === "Support") return r.type === "support";
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Requests"
        description={pendingCount > 0 ? `${pendingCount} pending` : "All caught up"}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 mt-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
              activeTab === tab
                ? "bg-[#a3e635] text-black"
                : "bg-[#1c1c1e] text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#1c1c1e] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 text-[14px] py-16">No requests found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`bg-[#1c1c1e] rounded-2xl p-4 border ${
                req.status === "pending" ? "border-[#a3e635]/30" : "border-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    req.type === "plan_upgrade"
                      ? "bg-[#a3e635]/15"
                      : "bg-blue-500/15"
                  }`}>
                    {req.type === "plan_upgrade"
                      ? <ArrowUpCircle className="w-4 h-4 text-[#a3e635]" />
                      : <MessageSquare className="w-4 h-4 text-blue-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-bold text-white">{req.fromName}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.fromRole === "trainer"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {req.fromRole}
                      </span>
                      {req.type === "plan_upgrade" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#a3e635]/20 text-[#a3e635]">
                          Plan Upgrade
                        </span>
                      )}
                    </div>
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
