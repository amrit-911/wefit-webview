"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
  NOTIF_META,
  timeAgo,
} from "@/lib/services/notifications.service";

function NotifIcon({ type }: { type: AppNotification["type"] }) {
  const meta = NOTIF_META[type] ?? { emoji: "🔔", color: "#a3e635" };
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[18px]"
      style={{ background: `${meta.color}20` }}
    >
      {meta.emoji}
    </div>
  );
}

export default function UserNotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getNotifications(user.uid)
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.uid).catch(console.error);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleTap = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id).catch(console.error);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    if (notif.linkPath) router.push(notif.linkPath);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-12 px-5 pb-28">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-5 transition-colors"
      >
        <ArrowLeft className="w-3 h-3 mr-1" />
        back
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-[24px] font-extrabold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-[#a3e635] text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-[12px] font-bold text-[#a3e635] hover:text-[#b5f745] transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1c1c1e] rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-[52px] mb-4">🔔</div>
          <p className="text-[15px] font-extrabold text-white mb-1">You're all caught up!</p>
          <p className="text-[12px] text-gray-500 leading-relaxed max-w-[220px]">
            New plans, subscription updates and messages from your trainer will appear here.
          </p>
        </div>
      )}

      {/* Notification list */}
      {!loading && notifications.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {notifications.map((notif, i) => (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleTap(notif)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-colors text-left ${
                  notif.read
                    ? "bg-[#1c1c1e] border-white/5 opacity-60"
                    : "bg-[#1c1c1e] border-[#a3e635]/15 hover:bg-[#242424]"
                }`}
              >
                <NotifIcon type={notif.type} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-bold leading-snug ${notif.read ? "text-gray-400" : "text-white"}`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5 line-clamp-2">{notif.body}</p>
                  )}
                  <p className="text-[10px] text-gray-600 font-medium mt-1">
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-[#a3e635] shrink-0 mt-1.5" />
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
