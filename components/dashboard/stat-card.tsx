"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  delay?: number;
}

export function StatCard({ title, value, change, positive, icon: Icon, iconColor, iconBg, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="bg-white rounded-[6px] p-5 shadow-[0_4px_24px_0_rgba(34,41,47,0.1)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-[#b9b9c3] font-medium mb-1">{title}</p>
          <motion.p
            className="text-[22px] font-bold text-[#636578]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.1, duration: 0.3 }}
          >
            {value}
          </motion.p>
          {change && (
            <p className={cn("text-xs mt-1 font-medium", positive ? "text-[#28c76f]" : "text-[#ea5455]")}>
              {positive ? "▲" : "▼"} {change}
            </p>
          )}
        </div>
        <div className={cn("w-[42px] h-[42px] rounded-[6px] flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
    </motion.div>
  );
}
