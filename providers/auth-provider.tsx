"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";

export type UserRole = "admin" | "trainer" | "pending_trainer" | "rejected_trainer" | "user" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  displayName: string;
  trainerId: string | null;
  avatarUrl: string;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  displayName: "",
  trainerId: null,
  avatarUrl: "",
  logout: async () => {},
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Routes that don't require a logged-in user
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/intro",
  "/join",
  "/trainer-registration",
  "/trainer-success",
  "/pending-approval",
  "/admin-login",
];

// Onboarding routes — accessible only to logged-in users who haven't completed onboarding
const ONBOARDING_ROUTES = [
  "/onboarding-goal",
  "/onboarding-about",
  "/onboarding-fitness",
];

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isOnboarding(pathname: string) {
  return ONBOARDING_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function homeForRole(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "trainer") return "/trainer";
  if (role === "pending_trainer" || role === "rejected_trainer") return "/pending-approval";
  return "/main";
}

function resolveOnboardingComplete(data: Record<string, any>): boolean {
  if (data.onboardingComplete === true) return true;

  // Backward-compatible fallback for older user docs that only stored nested onboarding data.
  const onboarding = data.onboarding;
  if (!onboarding || typeof onboarding !== "object") return false;
  return Boolean(onboarding.completedAt || onboarding.fitnessLevel || onboarding.goal);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = async () => {
    if (auth) await signOut(auth);
    router.replace("/intro");
  };

  const refreshUserData = async () => {
    const currentUser = auth?.currentUser;
    if (!currentUser || !db) return;
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setRole((data.role as UserRole) ?? "user");
        setOnboardingComplete(resolveOnboardingComplete(data));
        setDisplayName(data.name ?? currentUser.displayName ?? "");
        setTrainerId(data.trainer ?? null);
        setAvatarUrl(data.avatar ?? "");
      }
    } catch (e) {
      console.error("Failed to refresh user data:", e);
    }
  };

  // Step 1: Listen for auth state changes and fetch role from Firestore
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch the user document from Firestore to get their role
        try {
          if (db) {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setRole((data.role as UserRole) ?? "user");
              setOnboardingComplete(resolveOnboardingComplete(data));
              setDisplayName(data.name ?? currentUser.displayName ?? "");
              setTrainerId(data.trainer ?? null);
              setAvatarUrl(data.avatar ?? "");
            } else {
              // No document found — default to user
              setRole("user");
              setOnboardingComplete(false);
            }
          }
        } catch (e) {
          console.error("Failed to fetch user role:", e);
          setRole("user");
          // Don't set onboardingComplete(false) on network errors — that would
          // falsely redirect users to /onboarding-goal when connectivity is restored.
          // Keep existing state (null on first load, or the previously fetched value).
        }
        setUser(currentUser);

        // Save FCM token — Flutter holds it; we ask via JS bridge and write to Firestore
        if (typeof window !== 'undefined' && (window as any).flutter_inappwebview && db) {
          (window as any).flutter_inappwebview
            .callHandler('FlutterBridge', 'getFcmToken')
            .then((token: string) => {
              if (token && db) {
                setDoc(doc(db, 'users', currentUser.uid), { fcmToken: token }, { merge: true })
                  .catch(() => {});
              }
            })
            .catch(() => {});
        }
      } else {
        setUser(null);
        setRole(null);
        setOnboardingComplete(null);
        setDisplayName("");
        setTrainerId(null);
        setAvatarUrl("");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Step 2: React to auth/role state and redirect accordingly
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not logged in → redirect to login unless on a public route
      if (!isPublic(pathname)) {
        // Admin routes → admin login page, everything else → intro
        if (pathname.startsWith("/admin")) {
          router.replace("/admin-login");
        } else {
          router.replace("/intro");
        }
      }
      return;
    }

    // Logged in user on a public route → send them home (or onboarding)
    if (isPublic(pathname)) {
      // Let an admin stay on /admin-login to avoid redirect loops — push to /admin
      if (pathname === "/admin-login") {
        if (role === "admin") router.replace("/admin");
        // non-admin on admin-login: sign them out and stay (handled below)
        return;
      }
      if (role === "user" && onboardingComplete === false) {
        router.replace("/onboarding-goal");
      } else {
        router.replace(homeForRole(role));
      }
      return;
    }

    // Logged in user on an onboarding route
    if (isOnboarding(pathname)) {
      // If they already completed onboarding, send them home
      if (onboardingComplete === true) {
        router.replace(homeForRole(role));
      }
      // Otherwise let them stay on the onboarding flow
      return;
    }

    // Regular logged-in user who hasn't completed onboarding → force onboarding
    if (role === "user" && onboardingComplete === false) {
      router.replace("/onboarding-goal");
      return;
    }

    // Protect admin routes from non-admins
    if (pathname.startsWith("/admin") && role !== "admin") {
      router.replace("/admin-login");
      return;
    }

    // Protect trainer routes from non-trainers (and non-admins)
    if (pathname.startsWith("/trainer") && role !== "trainer" && role !== "admin") {
      router.replace(homeForRole(role));
      return;
    }
  }, [user, role, onboardingComplete, loading, pathname, router]);

  // Show spinner while resolving auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#a3e635] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render children when a redirect will happen to avoid flickers
  if (!user && !isPublic(pathname)) return null;
  if (user && isPublic(pathname)) return null;
  if (user && isOnboarding(pathname) && onboardingComplete === true) return null;
  if (user && !isPublic(pathname) && !isOnboarding(pathname) && role === "user" && onboardingComplete === false) return null;

  return (
    <AuthContext.Provider value={{ user, role, loading, displayName, trainerId, avatarUrl, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
