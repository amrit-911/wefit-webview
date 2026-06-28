"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}


export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <motion.div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div>
        <h1 className="text-xl font-semibold text-[#636578]">{title}</h1>
        {description && (
          <p className="text-sm text-[#b9b9c3] mt-0.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Active: "bg-[#28c76f]/10 text-[#28c76f]",
    Inactive: "bg-[#82868b]/10 text-[#82868b]",
    Expired: "bg-[#ea5455]/10 text-[#ea5455]",
    Pending: "bg-[#ff9f43]/10 text-[#ff9f43]",
    Paid: "bg-[#28c76f]/10 text-[#28c76f]",
    Overdue: "bg-[#ea5455]/10 text-[#ea5455]",
    Beginner: "bg-[#00cfe8]/10 text-[#00cfe8]",
    Intermediate: "bg-[#7367f0]/10 text-[#7367f0]",
    Advanced: "bg-[#ff9f43]/10 text-[#ff9f43]",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase",
      colors[status] ?? "bg-gray-100 text-gray-500"
    )}>
      {status}
    </span>
  );
}
