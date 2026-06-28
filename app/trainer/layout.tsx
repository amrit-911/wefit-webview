"use client";

import { usePathname } from "next/navigation";
import { TrainerBottomNav } from "@/components/layout/trainer-bottom-nav";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChat = pathname?.startsWith("/trainer/chat");

  return (
    <div className="min-h-screen bg-[#121212]">
      <main className={`max-w-md mx-auto relative min-h-screen ${isChat ? "" : "pb-20"}`}>
        {children}
      </main>
      <TrainerBottomNav />
    </div>
  );
}
