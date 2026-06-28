"use client";

import { motion } from "framer-motion";
import {
  Bell,
  MessageCircle,
  Users,
  Activity,
  CalendarDays,
  Plus,
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useState, useEffect } from "react";
import { getMembersByTrainer, type Member } from "@/lib/services/members.service";
import { getTrainerUnreadTotal } from "@/lib/services/chat.service";
import { getTrainerNotifications, getUnreadCount, markNotificationRead, type AppNotification, timeAgo } from "@/lib/services/notifications.service";
import { getBannerSettings } from "@/lib/services/banner.service";
import { getTickerSettings } from "@/lib/services/ticker.service";
import { TickerTape } from "@/components/ui/ticker-tape";
import { getLatestCheckin } from "@/lib/services/checkin.service";

const NOTIF_ICON_MAP: Record<string, typeof Dumbbell> = {
  workout: Dumbbell,
  checkin: CheckCircle2,
  period_checkin: CalendarDays,
  weight: Activity,
  missed: AlertTriangle,
  photo: ClipboardCheck,
  streak: Dumbbell,
};

export default function TrainerDashboard() {
  const router = useRouter();
  const { displayName, avatarUrl, user } = useAuth();

  const [clients, setClients] = useState<Member[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChat, setUnreadChat] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [ticker, setTicker] = useState<{ trainerEnabled: boolean; trainerContent: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getMembersByTrainer(user.uid),
      getTrainerNotifications(user.uid),
      getUnreadCount(user.uid),
    ])
      .then(async ([allClients, notifs, unread]) => {
        const clientsWithProgress = await Promise.all(
          allClients.map(async (client) => {
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
        setClients(clientsWithProgress);
        setRecentNotifs(notifs.filter((n) => !n.read && n.type === "period_checkin").slice(0, 4));
        setUnreadCount(unread);
      })
      .catch(console.error)
      .finally(() => setLoadingStats(false));
    // Chat unread count
    getTrainerUnreadTotal(user.uid).then(setUnreadChat).catch(console.error);
    getBannerSettings().then((s) => { if (s.trainerImageUrl) setBannerUrl(s.trainerImageUrl); }).catch(console.error);
    getTickerSettings().then((s) => setTicker({ trainerEnabled: s.trainerEnabled, trainerContent: s.trainerContent })).catch(console.error);
  }, [user]);

  const handleMarkRead = async (notifId: string) => {
    await markNotificationRead(notifId).catch(console.error);
    setRecentNotifs((prev) => prev.filter((n) => n.id !== notifId));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "Active").length;

  // Plans expiring within 7 days
  const expiringCount = clients.filter((c) => {
    if (!c.membershipEnd) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = c.membershipEnd as any;
    const end: Date = raw?.toDate ? raw.toDate() : new Date(raw);
    const daysLeft = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;

  return (
    <div className="min-h-screen bg-[#121212] font-sans pb-24 overflow-x-hidden pt-12 px-5">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
           <div className="w-[42px] h-[42px] rounded-full overflow-hidden bg-[#2a2a2c]">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Profile" width={42} height={42} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[16px] font-bold text-white">
                  {displayName ? displayName.charAt(0).toUpperCase() : "T"}
                </div>
              )}
           </div>
           <div>
             <p className="text-[12px] text-gray-400 font-medium tracking-wide">Welcome Back 👋</p>
             <h1 className="text-[18px] font-extrabold text-white tracking-wide">
               {displayName || "Trainer"}
             </h1>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/trainer/messages")}
            className="relative w-[40px] h-[40px] rounded-full bg-[#1c1c1e] flex items-center justify-center hover:bg-[#2a2a2c] transition-colors"
          >
            <MessageCircle className="w-[18px] h-[18px] text-gray-300" />
            {unreadChat > 0 && (
              <div className="absolute top-[9px] right-[10px] w-[6px] h-[6px] rounded-full bg-[#a3e635] border-2 border-[#1c1c1e]" />
            )}
          </button>
          <button
            onClick={() => router.push("/trainer/notifications")}
            className="relative w-[40px] h-[40px] rounded-full bg-[#1c1c1e] flex items-center justify-center hover:bg-[#2a2a2c] transition-colors"
          >
            <Bell className="w-[18px] h-[18px] text-gray-300" />
            {unreadCount > 0 && (
              <div className="absolute top-[10px] right-[12px] w-[6px] h-[6px] rounded-full bg-red-500 border-2 border-[#1c1c1e]" />
            )}
          </button>
        </div>
      </div>

      {/* Ticker Tape */}
      {ticker?.trainerEnabled && ticker.trainerContent.trim() && (
        <div className="mx-[-20px] bg-[#28c76f] py-1.5 mb-6 overflow-hidden">
          <TickerTape content={ticker.trainerContent} className="text-white" />
        </div>
      )}

      {/* Action Required Banner — only show if there are issues */}
      {/* {(expiringCount > 0 || recentNotifs.length > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#212124] rounded-2xl p-4 mb-6 relative overflow-hidden"
        >
          <div className="text-center relative z-10">
            <h2 className="text-[12px] font-extrabold text-[#eab308] uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
              ACTION REQUIRED <AlertTriangle className="w-[14px] h-[14px]" fill="currentColor" />
            </h2>
            {expiringCount > 0 && (
              <p className="text-[11px] text-gray-300 font-medium mb-1">
                {expiringCount} member plan{expiringCount > 1 ? "s" : ""} expiring within 7 days
              </p>
            )}
            {unreadCount > 0 && (
              <p className="text-[11px] text-gray-300 font-medium mb-4">
                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""} to review
              </p>
            )}
            <div className="flex justify-center gap-3">
               <button
                 onClick={() => router.push("/trainer/clients")}
                 className="px-5 py-2 rounded-[8px] border border-[#eab308]/30 text-[#eab308] text-[11px] font-bold hover:bg-[#eab308]/10 transition-colors"
               >
                 View Clients
               </button>
               <button
                 onClick={() => router.push("/trainer/notifications")}
                 className="px-7 py-2 rounded-[8px] bg-[#4ade80]/20 text-[#4ade80] text-[11px] font-bold hover:bg-[#4ade80]/30 transition-colors"
               >
                 Review
               </button>
            </div>
          </div>
        </motion.div>
      )} */}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: Users, label: "Total Clients", value: loadingStats ? "—" : String(totalClients), color: "text-[#60a5fa]", bg: "bg-[#60a5fa]/20" },
          { icon: Activity, label: "Active", value: loadingStats ? "—" : String(activeClients), color: "text-[#f87171]", bg: "bg-[#f87171]/20" },
          { icon: CalendarDays, label: "Expiring", value: loadingStats ? "—" : String(expiringCount), color: "text-[#eab308]", bg: "bg-[#eab308]/20" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 + 0.1 }}
            className="bg-[#1c1c1e] rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-white/5"
          >
            <div className={`w-[28px] h-[28px] rounded-lg ${stat.bg} flex items-center justify-center mb-1`}>
               <stat.icon className={`w-[14px] h-[14px] ${stat.color}`} />
            </div>
            <span className="text-[16px] font-bold text-white leading-none">{stat.value}</span>
            <span className="text-[8px] text-gray-400 font-medium text-center leading-tight tracking-wide uppercase">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Home Banner */}
      {bannerUrl && (
        <div className="relative w-full rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: "21/9" }}>
          <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
        </div>
      )}

      {/* Recent Activity */}
      <div className="mb-8">
        <h3 className="text-[11px] font-extrabold text-white tracking-widest uppercase mb-4 ml-1">RECENT ACTIVITY</h3>
        {loadingStats && (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="bg-[#1c1c1e] rounded-[14px] h-[56px] animate-pulse" />)}
          </div>
        )}
        {!loadingStats && recentNotifs.length === 0 && (
          <div className="bg-[#1c1c1e] rounded-[14px] p-4 text-center">
            <p className="text-[12px] text-gray-500">No recent activity yet</p>
          </div>
        )}
        {!loadingStats && recentNotifs.length > 0 && (
          <div className="space-y-3">
            {recentNotifs.map((notif, i) => {
              const IconComp = NOTIF_ICON_MAP[notif.type] ?? CheckCircle2;
              const isMissed = notif.type === "missed";
              return (
                <motion.div 
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.2 }}
                  className="bg-[#1c1c1e] rounded-[14px] p-3.5 flex items-center gap-4 hover:bg-[#2a2a2c] transition-colors"
                >
                  <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 ${isMissed ? "bg-red-500/20" : "bg-[#a3e635]"}`}>
                    <IconComp className={`w-[16px] h-[16px] ${isMissed ? "text-red-500" : "text-black"}`} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white font-bold leading-tight mb-0.5 tracking-wide">{notif.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                      className="w-[28px] h-[28px] rounded-full bg-[#a3e635]/20 flex items-center justify-center shrink-0 hover:bg-[#a3e635]/40 transition-colors"
                    >
                      <Check className="w-[14px] h-[14px] text-[#a3e635]" strokeWidth={2.5} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
         <h3 className="text-[11px] font-extrabold text-white tracking-widest uppercase mb-4 ml-1">QUICK ACTIONS</h3>
         <button
           onClick={() => router.push("/trainer/clients/add")}
           className="w-full h-[48px] bg-[#1c1c1e] hover:bg-[#2a2a2c] hover:border-[#a3e635]/30 rounded-xl border border-white/5 flex items-center justify-center gap-2 transition-all mb-3"
         >
           <Plus className="w-[14px] h-[14px] text-[#a3e635]" strokeWidth={2.5} />
           <span className="text-[12px] font-bold text-white tracking-wide">Add Client</span>
         </button>
         <button
           onClick={() => router.push("/trainer/library/add")}
           className="w-full h-[48px] bg-[#1c1c1e] hover:bg-[#2a2a2c] hover:border-[#a3e635]/30 rounded-xl border border-white/5 flex items-center justify-center gap-2 transition-all"
         >
           <span className="text-[16px] leading-none">🍎</span>
           <span className="text-[12px] font-bold text-white tracking-wide">Add Supplement / Nutrition</span>
         </button>
      </div>

      {/* Client Overview */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
           <h3 className="text-[11px] font-extrabold text-white tracking-widest uppercase">CLIENT OVERVIEW</h3>
           <Link href="/trainer/clients" className="text-[11px] font-bold text-[#a3e635] hover:underline cursor-pointer">See all</Link>
        </div>
        {loadingStats && (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="bg-[#1c1c1e] rounded-[16px] h-[64px] animate-pulse" />)}
          </div>
        )}
        {!loadingStats && clients.length === 0 && (
          <div className="bg-[#1c1c1e] rounded-[16px] p-6 text-center">
            <p className="text-[13px] font-bold text-white mb-1">No clients yet</p>
            <p className="text-[11px] text-gray-500">Tap Add Client to get started</p>
          </div>
        )}
        {!loadingStats && (
          <div className="space-y-3">
            {clients.slice(0, 4).map((client, i) => (
              <motion.button 
                key={client.id}
                onClick={() => router.push(`/trainer/clients/${client.id}`)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 + 0.3 }}
                className="w-full bg-[#1c1c1e] rounded-[16px] p-4 flex items-center justify-between hover:bg-[#2a2a2c] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center bg-[#a3e635] text-black font-extrabold text-[16px] shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-white leading-tight mb-1">{client.name}</h4>
                    <p className="text-[10px] text-gray-500 font-medium">{client.goal || client.purpose || "No goal"} • {client.plan}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-[14px] font-extrabold text-[#a3e635]">{client.progress ?? 0}%</span>
                  <span className={`text-[9px] font-bold ${client.status === "Active" ? "text-[#a3e635]" : "text-gray-500"}`}>
                    {client.status}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
