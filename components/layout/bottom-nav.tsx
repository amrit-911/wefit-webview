"use client";

import { Home, Dumbbell, Apple, TrendingUp, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { user: _user } = useAuth();

  const navItems = [
    { icon: Home,      label: "Home",      href: "/main",      active: pathname === "/main" || pathname === "/" },
    { icon: Dumbbell,  label: "Workouts",  href: "/workouts",  active: pathname.startsWith("/workouts") },
    { icon: Apple,     label: "Nutrition", href: "/nutrition", active: pathname.startsWith("/nutrition") },
    { icon: TrendingUp,label: "Progress",  href: "/stats",     active: pathname === "/stats" },
    { icon: User,      label: "Profile",   href: "/profile",   active: pathname === "/profile" },
  ];

  return (
    <div className="fixed bottom-4 left-0 w-[90%] right-0 rounded-xl bg-[#1c1c1e] border-t border-[#2c2c2e] px-2 py-3 flex justify-between items-center z-50 max-w-md mx-auto">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Link
            key={index}
            href={item.href}
            prefetch={true}
            className="flex flex-col items-center justify-center gap-1 w-[20%]"
          >
            <Icon
              className={`w-6 h-6 transition-colors ${item.active ? "text-[#a3e635]" : "text-gray-500"}`}
              strokeWidth={item.active ? 2.5 : 2}
            />
            <span className={`text-[10px] font-medium transition-colors ${item.active ? "text-[#a3e635]" : "text-gray-500"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
