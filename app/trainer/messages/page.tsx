"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { subscribeToTrainerRooms, type ChatRoom } from "@/lib/services/chat.service";
import { Timestamp } from "firebase/firestore";

function timeAgo(ts: Timestamp | null | undefined): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts as unknown as number);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function TrainerMessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTrainerRooms(user.uid, (r) => {
      setRooms(r);
      setLoading(false);
    });
    // fallback: set loading false after 3s if no snapshot arrives
    const t = setTimeout(() => setLoading(false), 3000);
    return () => { unsub(); clearTimeout(t); };
  }, [user]);

  const totalUnread = rooms.reduce((s, r) => s + (r.unreadTrainer ?? 0), 0);

  return (
    <div className="min-h-dvh bg-[#121212] font-sans pt-10 px-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-extrabold text-white">Messages</h1>
          <p className="text-[11px] text-gray-500">Chat with your clients</p>
        </div>
        {totalUnread > 0 && (
          <div className="ml-auto bg-[#a3e635] text-black text-[10px] font-extrabold rounded-full px-2.5 py-0.5">
            {totalUnread} new
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1c1c1e] rounded-2xl h-[72px] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-full bg-[#1c1c1e] flex items-center justify-center">
            <MessageCircle className="w-9 h-9 text-gray-600" />
          </div>
          <p className="text-[14px] font-bold text-white">No conversations yet</p>
          <p className="text-[12px] text-gray-500 text-center">
            Open a client&apos;s profile and tap the chat icon to start a conversation.
          </p>
        </div>
      )}

      {/* Room list */}
      {!loading && (
        <div className="space-y-3">
          {rooms.map((room, i) => {
            const unread = room.unreadTrainer ?? 0;
            const initial = room.clientName?.charAt(0).toUpperCase() ?? "?";
            return (
              <motion.button
                key={room.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/trainer/chat/${room.clientId}`)}
                className="w-full bg-[#1c1c1e] hover:bg-[#2a2a2c] rounded-2xl p-4 flex items-center gap-4 text-left transition-colors border border-white/5"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-[#a3e635] flex items-center justify-center text-black font-extrabold text-[17px]">
                    {initial}
                  </div>
                  {unread > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#a3e635] border-2 border-[#1c1c1e] flex items-center justify-center">
                      <span className="text-[8px] font-extrabold text-black">{unread > 9 ? "9+" : unread}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-[14px] font-bold leading-none ${unread > 0 ? "text-white" : "text-gray-300"}`}>
                      {room.clientName}
                    </p>
                    <span className="text-[10px] text-gray-600 shrink-0 ml-2">
                      {timeAgo(room.lastMessageAt)}
                    </span>
                  </div>
                  <p className={`text-[12px] truncate leading-tight ${unread > 0 ? "text-gray-300 font-medium" : "text-gray-500"}`}>
                    {room.lastMessage || "No messages yet"}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
