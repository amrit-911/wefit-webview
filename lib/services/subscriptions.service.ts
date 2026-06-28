import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getLocalDateString } from "@/lib/utils";

export interface Subscription {
  id: string;
  memberId?: string;
  member: string;
  plan: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: "Active" | "Expired" | "Pending";
  createdAt?: Timestamp;
}

const COL = "subscriptions";

export async function getSubscriptions(): Promise<Subscription[]> {
  if (!db) return [];
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription));
}

export async function addSubscription(data: Omit<Subscription, "id" | "createdAt">): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateSubscription(id: string, data: Partial<Subscription>): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, COL, id), { ...data });
}

export async function deleteSubscription(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, COL, id));
}

export async function getActiveSubscriptionByMemberId(memberId: string): Promise<Subscription | null> {
  if (!db) return null;
  const q = query(collection(db, COL), where("memberId", "==", memberId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Subscription;
}

/** Plan price map — used in the subscriptions UI */
export const PLAN_PRICES: Record<string, { price: string; amount: number; features: string[] }> = {
  Basic:   { price: "₹999/mo",   amount: 999,  features: ["Gym Access", "Basic Plan", "Locker"] },
  Premium: { price: "₹2,999/mo", amount: 2999, features: ["Gym Access", "All Plans", "Personal Trainer (2/mo)", "Locker"] },
  Elite:   { price: "₹4,999/mo", amount: 4999, features: ["Gym Access", "All Plans", "Unlimited PT", "Nutrition Coaching", "Locker"] },
};

export interface WeFitPlan {
  id: string;
  name: string;
  duration: string;
  days: number;
  price: number | null;
  tag?: string;
}

export const WEFIT_PLANS: WeFitPlan[] = [
  { id: "7 Day Free Trial",     name: "7 Day Free Trial",     duration: "7 days",   days: 7,   price: null, tag: "Free Trial" },
  { id: "14 Day Free Trial",    name: "14 Day Free Trial",    duration: "14 days",  days: 14,  price: null, tag: "Free Trial" },
  { id: "WeFit Signature Plan", name: "WeFit Signature Plan", duration: "30 days",  days: 30,  price: 2999 },
  { id: "WeFit Pro",            name: "WeFit Pro",            duration: "90 days",  days: 90,  price: 7999 },
  { id: "WeFit Elite",          name: "WeFit Elite",          duration: "180 days", days: 180, price: 13999 },
];

export const WEFIT_PAID_PLANS = WEFIT_PLANS.filter((p) => !p.tag?.includes("Trial"));

/** Returns ISO date string (YYYY-MM-DD) for when the plan expires from today */
export function computeMembershipEnd(planId: string): string {
  const plan = WEFIT_PLANS.find((p) => p.id === planId);
  if (!plan) return "N/A";
  const d = new Date();
  d.setDate(d.getDate() + plan.days);
  return getLocalDateString(d);
}

/**
 * Parses membershipEnd stored in either ISO (YYYY-MM-DD) or legacy DD/MM/YYYY format.
 * Returns a Date at midnight local time, or null if unparseable.
 */
export function parseMembershipEnd(value: string): Date | null {
  if (!value || value === "N/A") return null;
  // ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + "T00:00:00");
  }
  // Legacy DD/MM/YYYY
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
  return null;
}

/** Days remaining from today. Negative = expired. */
export function daysUntilExpiry(membershipEnd: string): number | null {
  const end = parseMembershipEnd(membershipEnd);
  if (!end) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
