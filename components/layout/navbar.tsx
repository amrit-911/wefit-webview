"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, UserCheck, Video, Blocks,
  Pill, Apple, Bell, Menu, X, CheckSquare, LogOut, Lock, Settings, HelpCircle, User, Image, Inbox, Ticket
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
  NOTIF_META,
  timeAgo,
} from "@/lib/services/notifications.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Client Management", icon: Users, href: "/admin/members" },
  { label: "Trainer Management", icon: UserCheck, href: "/admin/trainers" },
  { label: "Workout Video Management", icon: Video, href: "/admin/exercises" },
  { label: "CMS", icon: Blocks, href: "/admin/products" },
  { label: "Supplement List", icon: Pill, href: "/admin/supplements" },
  { label: "Nutrition List", icon: Apple, href: "/admin/nutrition-plans" },
  // { label: "Subscription Plan", icon: CreditCard, href: "/admin/subscriptions" },
  { label: "Approvals", icon: CheckSquare, href: "/admin/approvals" },
  { label: "Requests", icon: Inbox, href: "/admin/requests" },
  { label: "Banner", icon: Image, href: "/admin/banner" },
  { label: "Ticker", icon: Ticket, href: "/admin/ticker" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  // Admin logout → redirect to /admin-login
  const logout = async () => {
    if (auth) await signOut(auth);
    router.replace("/admin-login");
  };


  // ── Notification state ──────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setLoadingNotifs(true);
      try {
        const [notifs, count] = await Promise.all([
          getNotifications("admin"),
          import("@/lib/services/notifications.service").then((m) =>
            m.getUnreadCount("admin")
          ),
        ]);
        setNotifications(notifs);
        setUnreadCount(count);
      } catch (e) {
        console.error("Failed to load admin notifications", e);
      } finally {
        setLoadingNotifs(false);
      }
    }
    load();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  async function handleMarkAllRead() {
    await markAllNotificationsRead("admin");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function handleNotifClick(notif: AppNotification) {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setNotifOpen(false);
    if (notif.linkPath) router.push(notif.linkPath);
  }

  const badgeLabel = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <>
      {/* Top header bar */}
      <header className="bg-white sticky top-0 z-50 shadow-[0_4px_24px_0_rgba(34,41,47,0.04)]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                <span className="text-[10px] font-extrabold text-[#5e5873] leading-none">PTRB</span>
              </div>
              <span className="text-base font-bold tracking-wide text-[#5e5873] uppercase">
                PTRB FITNESS
              </span>
            </Link>

            {/* Right side: notifications + user + mobile toggle */}
            <div className="flex items-center gap-3">
              {/* Bell + notification dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative p-2 text-[#6e6b7b] hover:text-[#7367f0] transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-[22px] h-[22px] cursor-pointer" />
                  {badgeLabel && (
                    <Badge className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 p-0 flex items-center justify-center text-[10px] bg-[#7367f0] text-white rounded-full border-2 border-white">
                      {badgeLabel}
                    </Badge>
                  )}
                </button>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute -right-24 lg:right-0 top-[calc(100%+8px)] w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-[0_8px_30px_rgba(34,41,47,0.14)] border border-gray-100 z-50 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-[#5e5873]">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-[11px] font-medium bg-[#7367f0]/10 text-[#7367f0] rounded-full px-2 py-0.5">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[12px] text-[#7367f0] hover:underline font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-[380px] overflow-y-auto">
                        {loadingNotifs ? (
                          <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                            Loading…
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                            <Bell className="w-8 h-8 opacity-30" />
                            <span className="text-sm">No notifications yet</span>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const meta = NOTIF_META[notif.type] ?? { emoji: "🔔", color: "#7367f0" };
                            return (
                              <button
                                key={notif.id}
                                onClick={() => handleNotifClick(notif)}
                                className={cn(
                                  "w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0",
                                  !notif.read && "bg-[#7367f0]/[0.04]"
                                )}
                              >
                                {/* Emoji avatar */}
                                <div
                                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[18px] mt-0.5"
                                  style={{ background: meta.color + "20" }}
                                >
                                  {meta.emoji}
                                </div>
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={cn("text-[13px] leading-snug text-[#5e5873]", !notif.read && "font-semibold")}>
                                      {notif.title}
                                    </p>
                                    {!notif.read && (
                                      <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-[#7367f0]" />
                                    )}
                                  </div>
                                  {notif.body && (
                                    <p className="text-[12px] text-gray-400 mt-0.5 leading-snug line-clamp-2">
                                      {notif.body}
                                    </p>
                                  )}
                                  <p className="text-[11px] text-gray-300 mt-1">{timeAgo(notif.createdAt)}</p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="border-t border-gray-100 px-4 py-2.5 text-center">
                          <div
                            onClick={() => setNotifOpen(false)}
                            className="text-[12px] text-[#7367f0] hover:underline font-medium cursor-pointer"
                          >
                            Close

                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#7367f0] flex items-center justify-center text-white text-sm font-bold cursor-pointer outline-none hover:ring-2 hover:ring-[#7367f0]/50 transition-all border-2 border-white" title={user?.email ?? "Admin"}>
                    <span className="sr-only">Open user menu</span>
                    {user?.email ? user.email.charAt(0).toUpperCase() : "A"}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#28c76f] border-2 border-white rounded-full"></span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-0 rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(34,41,47,0.14)] border-gray-100">
                  <div className="flex items-center gap-3 p-4 bg-gray-50/50">
                    <div className="w-10 h-10 rounded-full bg-[#7367f0] flex items-center justify-center text-white font-bold text-lg">
                      {user?.email ? user.email.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#5e5873] truncate">PTRB</p>
                      <p className="text-xs text-gray-500 truncate">Admin</p>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="m-0 bg-gray-100" />

                  <div className="p-1.5">
                    <DropdownMenuItem asChild>
                      <Link href="/admin/profile" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#6e6b7b] hover:text-[#7367f0] hover:bg-gray-50 rounded-md cursor-pointer transition-colors focus:bg-gray-50 focus:text-[#7367f0]">
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/profile/password" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#6e6b7b] hover:text-[#7367f0] hover:bg-gray-50 rounded-md cursor-pointer transition-colors focus:bg-gray-50 focus:text-[#7367f0]">
                        <Lock className="w-4 h-4" />
                        <span>Change Password</span>
                      </Link>
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem asChild>
                      <Link href="/admin/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#6e6b7b] hover:text-[#7367f0] hover:bg-gray-50 rounded-md cursor-pointer transition-colors focus:bg-gray-50 focus:text-[#7367f0]">
                        <Settings className="w-4 h-4" />
                        <span>Setting</span>
                      </Link>
                    </DropdownMenuItem> */}
                  </div>

                  <DropdownMenuSeparator className="m-0 bg-gray-100" />

                  <div className="p-1.5">
                    <DropdownMenuItem asChild>
                      <Link href="/admin/faq" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#6e6b7b] hover:text-[#7367f0] hover:bg-gray-50 rounded-md cursor-pointer transition-colors focus:bg-gray-50 focus:text-[#7367f0]">
                        <HelpCircle className="w-4 h-4" />
                        <span>FAQ</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        logout();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#6e6b7b] hover:text-[#ea5455] hover:bg-red-50 rounded-md cursor-pointer transition-colors focus:bg-red-50 focus:text-[#ea5455] w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile toggle */}
              <button
                className="lg:hidden p-2 text-gray-500 hover:text-[#7367f0] ml-1"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Horizontal nav tabs */}
      <nav className="bg-white border-b border-gray-100 hidden lg:block">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
          <div className="flex flex-wrap items-center gap-1 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-[7px] rounded-md text-sm font-medium transition-all whitespace-nowrap",
                      isActive
                        ? "bg-[#7367f0] text-white shadow-[0_3px_10px_rgba(115,103,240,0.4)]"
                        : "text-[#6e6b7b] hover:text-[#7367f0]"
                    )}
                  >
                    <item.icon className="w-[15px] h-[15px]" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all",
                        isActive
                          ? "bg-[#7367f0] text-white"
                          : "text-[#6e6b7b] hover:text-[#7367f0] hover:bg-gray-50"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
