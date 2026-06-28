"use client";

import { Home, Users, LineChart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TrainerBottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/trainer/chat")) return null;

  const navItems = [
    { href: "/trainer", icon: Home, label: "Home", active: pathname === "/trainer" },
    { href: "/trainer/clients", icon: Users, label: "Clients", active: pathname.startsWith("/trainer/clients") },
    { href: "/trainer/plans", icon: LineChart, label: "Plans", active: pathname.startsWith("/trainer/plans") },
    { href: "/trainer/profile", icon: User, label: "Profile", active: pathname.startsWith("/trainer/profile") },
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
            className="flex flex-col items-center justify-center gap-1 w-[25%]"
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
