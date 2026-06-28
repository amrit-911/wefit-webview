"use client";

import Link from "next/link";
import { 
  Video, 
  UserX, 
  Headphones, 
  Dumbbell, 
  ClipboardList, 
  LayoutGrid 
} from "lucide-react";

export default function SettingsPage() {
  // Metrics data derived from the user's screenshots
  const metrics = [
    {
      id: "hidden-videos",
      icon: Video,
      count: "0",
      actionLabel: "View all hide Videos",
      href: "/admin/exercises", 
    },
    {
      id: "suspended-users",
      icon: UserX,
      count: "1",
      actionLabel: "View all suspended users",
      href: "/admin/members",
    },
    {
      id: "suspended-trainers",
      icon: UserX,
      count: "0",
      actionLabel: "View all suspended trainers",
      href: "/admin/trainers",
    },
    {
      id: "rejected-customers",
      icon: UserX,
      count: "0",
      actionLabel: "View all rejected customer",
      href: "/admin/members",
    },
    {
      id: "rejected-trainers",
      icon: UserX,
      count: "0",
      actionLabel: "View all rejected trainer",
      href: "/admin/trainers",
    },
    {
      id: "audio",
      icon: Headphones,
      count: "Music",
      actionLabel: "See the Audio",
      href: "#",
    },
    {
      id: "workout",
      icon: Dumbbell,
      count: "0",
      actionLabel: "Workout",
      href: "/admin/workout-plans",
    },
    {
      id: "predesigned-plan",
      icon: ClipboardList,
      count: "0",
      actionLabel: "Predesigned Workout Plan",
      href: "/admin/workout-plans",
    },
    {
      id: "categories",
      icon: LayoutGrid,
      count: "0",
      actionLabel: "Categories",
      href: "/admin/categories",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#b9b9c3]">
        <Link href="/admin" className="text-[#7367f0] hover:underline font-medium">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/admin/profile" className="text-[#7367f0] hover:underline font-medium">My Profile</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">Settting</span>
      </div>

      <h2 className="text-2xl font-bold text-[#5e5873] mb-6">Settings</h2>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-8 flex flex-col items-center justify-center text-center h-[260px] border border-gray-50"
          >
            <div className="mb-4 text-[#5e5873]">
              <item.icon strokeWidth={1.5} className="w-14 h-14" />
            </div>
            
            <p className="text-xl font-bold text-[#5e5873] mb-6">{item.count}</p>
            
            <Link href={item.href}>
              <span className="inline-flex items-center justify-center px-4 py-1.5 bg-[#7367f0]/10 text-[#7367f0] text-sm font-semibold rounded-md hover:bg-[#7367f0]/20 transition-colors">
                {item.actionLabel}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
