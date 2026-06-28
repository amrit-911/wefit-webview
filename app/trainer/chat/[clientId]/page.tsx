"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/auth-provider";
import { getMemberById } from "@/lib/services/members.service";
import {
  getOrCreateChatRoom,
  sendMessage,
  subscribeToMessages,
  markRoomRead,
  type ChatMessage,
} from "@/lib/services/chat.service";
import { Timestamp } from "firebase/firestore";

function formatTime(ts: Timestamp | null | undefined): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts as unknown as number);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDate(messages: ChatMessage[]): { date: string; msgs: ChatMessage[] }[] {
  const groups: Record<string, ChatMessage[]> = {};
  for (const m of messages) {
    const ts = m.createdAt;
    let label = "Today";
    if (ts) {
      const d = ts.toDate ? ts.toDate() : new Date(ts as unknown as number);
      const now = new Date();
      if (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        label = "Today";
      } else {
        label = d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
      }
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(m);
  }
  return Object.entries(groups).map(([date, msgs]) => ({ date, msgs }));
}

export default function TrainerChatPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.clientId as string;
  const { user, displayName } = useAuth();

  const [clientName, setClientName] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch client name + create/get room
  useEffect(() => {
    if (!user || !clientId) return;
    getMemberById(clientId)
      .then(async (member) => {
        const name = member?.name ?? "Client";
        setClientName(name);
        const rid = await getOrCreateChatRoom(
          user.uid,
          displayName || "Trainer",
          clientId,
          name,
        );
        setRoomId(rid);
        await markRoomRead(rid, "trainer");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, clientId, displayName]);

  // Subscribe to messages
  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToMessages(roomId, (msgs) => {
      setMessages(msgs);
      // auto-scroll
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    return unsub;
  }, [roomId]);

  // Mark read when room opens
  useEffect(() => {
    if (!roomId) return;
    markRoomRead(roomId, "trainer");
  }, [roomId, messages.length]);

  const handleSend = useCallback(async () => {
    if (!roomId || !user || !text.trim() || sending) return;
    const msg = text.trim();
    setText("");
    setSending(true);
    try {
      await sendMessage(roomId, user.uid, displayName || "Trainer", msg, "client");
    } catch (e) {
      console.error(e);
      setText(msg); // restore on error
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [roomId, user, text, sending, displayName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped = groupByDate(messages);
  const initial = clientName.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col h-dvh bg-[#121212] font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-white/5 bg-[#121212] shrink-0">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-[#a3e635] flex items-center justify-center text-black font-extrabold text-[15px] shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-extrabold text-white leading-tight truncate">
            {loading ? "Loading..." : clientName}
          </p>
          <p className="text-[10px] text-[#a3e635] font-medium">Active</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
            <div className="w-16 h-16 rounded-full bg-[#1c1c1e] flex items-center justify-center">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-[13px] font-bold text-white">No messages yet</p>
            <p className="text-[11px] text-gray-500">Send a message to start the conversation</p>
          </div>
        )}
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            {/* Date Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase shrink-0">{date}</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>
            {/* Bubbles */}
            <div className="space-y-2">
              {msgs.map((m, i) => {
                const isMine = m.senderId === user?.uid;
                return (
                  <motion.div
                    key={m.id ?? i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full bg-[#2a2a2c] flex items-center justify-center text-[11px] font-bold text-white shrink-0 mr-2 mt-auto">
                        {initial}
                      </div>
                    )}
                    <div className="max-w-[75%]">
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed ${isMine
                            ? "bg-[#a3e635] text-black rounded-br-sm"
                            : "bg-[#1e1e20] text-white rounded-bl-sm border border-white/5"
                          }`}
                      >
                        {m.text}
                      </div>
                      <p
                        className={`text-[9px] text-gray-600 mt-1 ${isMine ? "text-right" : "text-left"
                          }`}
                      >
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="shrink-0 px-4 pb-8 pt-3 bg-[#121212] border-t border-white/5">
        <div className="flex items-end gap-3 bg-[#1e1e20] border border-white/10 rounded-2xl px-4 py-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type Message..."
            rows={1}
            style={{ resize: "none" }}
            className="flex-1 bg-transparent text-[13px] text-white placeholder:text-gray-600 focus:outline-none leading-relaxed max-h-[120px] overflow-y-auto"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-9 h-9 rounded-full bg-[#a3e635] disabled:opacity-40 flex items-center justify-center shrink-0 transition-all hover:bg-[#b5f745] active:scale-95"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
