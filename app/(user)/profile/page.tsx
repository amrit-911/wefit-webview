"use client";

import { motion } from "framer-motion";
import { ChevronRight, Settings, HelpCircle } from "lucide-react";
import Image from "next/image";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { getMemberById } from "@/lib/services/members.service";

export default function ProfilePage() {
  const router = useRouter();
  const { user, displayName, avatarUrl, logout } = useAuth();
  const [goal, setGoal] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    getMemberById(user.uid)
      .then((m) => { if (m?.purpose) setGoal(m.purpose); })
      .catch(console.error);
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col font-sans pb-24 text-white px-5 pt-12">

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center mb-8"
      >
        <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-[#2a2a2c] mb-4 border-2 border-[#a3e635]/30 relative flex items-center justify-center">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName || "User"} fill className="object-cover" />
          ) : (
            <span className="text-[30px] font-bold text-white">
              {displayName ? displayName.charAt(0).toUpperCase() : "U"}
            </span>
          )}
        </div>

        <h2 className="text-[20px] font-extrabold text-white mb-1">{displayName || "User"}</h2>
        <p className="text-[12px] font-medium text-gray-400 mb-2">{user?.email || ""}</p>

        {goal ? (
          <span className="text-[11px] font-bold text-[#a3e635] tracking-wide uppercase">
            {goal}
          </span>
        ) : (
          <span className="text-[11px] font-bold text-[#a3e635] tracking-wide uppercase">
            Member
          </span>
        )}
      </motion.div>

      {/* Menu Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1c1c1e] rounded-2xl overflow-hidden mb-4"
      >
        <MenuRow
          icon={Settings}
          label="Settings"
          onPress={() => router.push("/profile/settings")}
        />
        <div className="h-px bg-white/5 mx-4" />
        {/* Notifications row — commented out until feature is ready */}
        {/* <MenuRow icon={Bell} label="Notifications" onPress={() => {}} /> */}
        {/* <div className="h-px bg-white/5 mx-4" /> */}
        {/* <MenuRow
          icon={HelpCircle}
          label="Help & Support"
          isLast
        /> */}
      </motion.div>

      {/* Log Out Button */}
      <motion.button
        onClick={handleLogout}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full mt-2 border border-red-500/30 rounded-xl py-3.5 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors bg-transparent"
      >
        <span className="text-[13px] font-bold tracking-wider">LOG OUT</span>
      </motion.button>

      <BottomNav />
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
  isLast = false,
}: {
  icon: React.ElementType;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-[18px] h-[18px] text-gray-400" />
        <span className="text-[14px] font-bold text-white">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-500" />
    </button>
  );
}
