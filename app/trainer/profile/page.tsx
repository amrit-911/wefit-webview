"use client";

import { motion } from "framer-motion";
import { Settings, HelpCircle, ChevronRight, ClipboardList } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function TrainerProfilePage() {
  const router = useRouter();
  const { logout, displayName, avatarUrl, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-12 px-5 pb-24">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center mb-10"
      >
        <div className="w-22 h-22 rounded-full overflow-hidden bg-[#2a2a2c] mb-4 border-2 border-[#a3e635]/30 relative flex items-center justify-center">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName || "Trainer"} fill className="object-cover" />
          ) : (
            <span className="text-[30px] font-bold text-white">
              {displayName ? displayName.charAt(0).toUpperCase() : "T"}
            </span>
          )}
        </div>
        <h1 className="text-[20px] font-extrabold text-white mb-1">{displayName || "Trainer"}</h1>
        <p className="text-[12px] font-medium text-gray-400 mb-2">{user?.email || ""}</p>
        <span className="text-[11px] font-bold text-[#a3e635] tracking-wide uppercase">
          Certified Trainer
        </span>
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
          onPress={() => router.push("/trainer/profile/settings")}
        />
        <div className="h-px bg-white/5 mx-4" />
        <MenuRow
          icon={ClipboardList}
          label="Plan Requests"
          onPress={() => router.push("/trainer/plan-requests")}
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

      {/* Logout Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={handleLogout}
        className="w-full mt-2 border border-red-500/30 rounded-xl py-3.5 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all bg-transparent"
      >
        <span className="text-[13px] font-bold tracking-wider">LOG OUT</span>
      </motion.button>
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
        <Icon className="w-4.5 h-4.5 text-gray-400" />
        <span className="text-[14px] font-bold text-white">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-500" />
    </button>
  );
}
