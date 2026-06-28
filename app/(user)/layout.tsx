"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== "user") {
      // Admins/trainers should not be in user routes
      router.replace(role === "admin" ? "/admin" : "/trainer");
    }
  }, [role, loading, router]);

  if (loading || role !== "user") {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#a3e635] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <main className="max-w-md mx-auto relative min-h-screen pb-20">
        {children}
      </main>
    </div>
  );
}
