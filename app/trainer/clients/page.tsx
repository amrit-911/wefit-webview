"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getMembersByTrainer, type Member } from "@/lib/services/members.service";
import { getLatestCheckin } from "@/lib/services/checkin.service";

const tabs = ["All", "Active", "Inactive"];

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    getMembersByTrainer(user.uid)
      .then(async (members) => {
        const withProgress = await Promise.all(
          members.map(async (client) => {
            try {
              const latest = await getLatestCheckin(client.id);
              const startWeight = client.currentWeight ?? 0;
              const goalWeight = client.goalWeight ?? 0;
              const liveWeight = (latest?.weight && latest.weight > 0) ? latest.weight : startWeight;

              let progressPct = client.progress ?? 0;
              if (startWeight && goalWeight && startWeight !== goalWeight) {
                progressPct = Math.min(100, Math.round(Math.abs((startWeight - liveWeight) / (startWeight - goalWeight)) * 100));
              }
              return { ...client, progress: progressPct };
            } catch (err) {
              console.error(err);
              return client;
            }
          })
        );
        setClients(withProgress);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = clients.filter((c) => {
    const matchesTab = activeTab === "All" || c.status === activeTab;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-12 px-5 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[22px] font-extrabold text-white tracking-wide">My Clients</h1>
        <button
          onClick={() => router.push('/trainer/clients/add')}
          className="bg-[#a3e635] text-black text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-[#b5f745] transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-gray-500" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-[42px] bg-[#1c1c1e] rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/40 transition-all border-none"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-[7px] rounded-full text-[11px] font-bold tracking-wide transition-all ${activeTab === tab
                ? "bg-[#a3e635] text-black"
                : "bg-[#1c1c1e] text-gray-400 hover:text-white"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1c1c1e] rounded-[16px] p-4 h-[72px] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-[40px] mb-3">👥</div>
          <p className="text-[14px] font-bold text-white mb-1">
            {search || activeTab !== "All" ? "No clients match" : "No clients yet"}
          </p>
          <p className="text-[12px] text-gray-500">
            {search || activeTab !== "All" ? "Try a different search or filter" : "Tap + Add to add your first client"}
          </p>
        </div>
      )}

      {/* Client List */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map((client, i) => (
            <motion.button
              key={client.id}
              onClick={() => router.push(`/trainer/clients/${client.id}`)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="w-full bg-[#1c1c1e] rounded-[16px] p-4 flex items-center justify-between hover:bg-[#2a2a2c] transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center bg-[#a3e635] text-black font-extrabold text-[16px] shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-[14px] font-bold text-white leading-tight">{client.name}</h4>
                    <span className={`text-[8px] font-bold px-2 py-[2px] rounded-full ${client.status === "Active"
                        ? "bg-[#a3e635]/20 text-[#a3e635]"
                        : "bg-gray-500/20 text-gray-400"
                      }`}>
                      {client.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {client.goal || client.purpose || "No goal set"} • {client.plan}
                  </p>
                </div>
              </div>
              <span className="text-[14px] font-extrabold text-[#a3e635]">{client.progress ?? 0}%</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
