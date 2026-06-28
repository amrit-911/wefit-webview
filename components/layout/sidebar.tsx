"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/providers/app-provider";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Dumbbell,
  Heart,
  ClipboardList,
  UtensilsCrossed,
  Apple,
  Pill,
  ShoppingBag,
  Tag,
  Ticket,
  Zap,
  CreditCard,
  FileText,
  Calendar,
  Settings,
  ChevronLeft,
  Activity,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "Members",
    icon: Users,
    href: "/dashboard/members",
  },
  {
    label: "Trainers",
    icon: UserCheck,
    href: "/dashboard/trainers",
  },
  {
    label: "FITNESS",
    type: "section",
  },
  {
    label: "Exercises",
    icon: Dumbbell,
    href: "/dashboard/exercises",
  },
  {
    label: "Cardio",
    icon: Heart,
    href: "/dashboard/cardio",
  },
  {
    label: "Workout Plans",
    icon: ClipboardList,
    href: "/dashboard/workout-plans",
  },
  {
    label: "NUTRITION",
    type: "section",
  },
  {
    label: "Meal Plans",
    icon: UtensilsCrossed,
    href: "/dashboard/meal-plans",
  },
  {
    label: "Nutrition Plans",
    icon: Apple,
    href: "/dashboard/nutrition-plans",
  },
  {
    label: "Supplements",
    icon: Pill,
    href: "/dashboard/supplements",
  },
  {
    label: "STORE",
    type: "section",
  },
  {
    label: "Products",
    icon: ShoppingBag,
    href: "/dashboard/products",
  },
  {
    label: "Categories",
    icon: Tag,
    href: "/dashboard/categories",
  },
  {
    label: "Coupons",
    icon: Ticket,
    href: "/dashboard/coupons",
  },
  {
    label: "Flash Deals",
    icon: Zap,
    href: "/dashboard/flash-deals",
  },
  {
    label: "BILLING",
    type: "section",
  },
  {
    label: "Subscriptions",
    icon: CreditCard,
    href: "/dashboard/subscriptions",
  },
  {
    label: "Invoices",
    icon: FileText,
    href: "/dashboard/invoices",
  },
  {
    label: "SCHEDULE",
    type: "section",
  },
  {
    label: "Calendar",
    icon: Calendar,
    href: "/dashboard/calendar",
  },
  {
    label: "SETTINGS",
    type: "section",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const pathname = usePathname();

  return (
    <>
      {/* Overlay on mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className="fixed left-0 top-0 z-30 h-screen flex flex-col bg-[#0f1117] border-r border-white/5 overflow-hidden"
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        initial={false}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-white font-bold text-sm leading-tight whitespace-nowrap">PTRB Fitness</p>
                  <p className="text-white/40 text-xs whitespace-nowrap">Admin Panel</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle button */}
          <motion.button
            className="ml-auto text-white/40 hover:text-white transition-colors shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            animate={{ rotate: sidebarOpen ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item, index) => {
            if (item.type === "section") {
              return (
                <AnimatePresence key={`section-${index}`}>
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pt-4 pb-1 px-2"
                    >
                      <p className="text-white/30 text-[10px] font-semibold tracking-widest uppercase">
                        {item.label}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            }

            const Icon = item.icon!;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href!}>
                <motion.div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer relative overflow-hidden transition-all duration-200",
                    isActive
                      ? "text-white"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  )}
                  whileHover={{ x: sidebarOpen ? 2 : 0 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-cyan-500/5 rounded-lg border border-white/10"
                      layoutId="activeNav"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-violet-500 to-cyan-400 rounded-full" />
                  )}
                  <Icon className={cn("w-4.5 h-4.5 shrink-0 relative z-10", isActive && "text-violet-400")} style={{width: 18, height: 18}} />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium whitespace-nowrap relative z-10"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <div className={cn("flex items-center gap-3 px-2 py-2 rounded-lg", sidebarOpen && "hover:bg-white/5 cursor-pointer transition-colors")}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shrink-0 text-white text-xs font-bold">
              A
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="overflow-hidden"
                >
                  <p className="text-white text-sm font-medium whitespace-nowrap">Admin User</p>
                  <p className="text-white/40 text-xs whitespace-nowrap">admin@ptrb.in</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
