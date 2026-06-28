import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  orderBy, query, serverTimestamp, setDoc, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAuthAccount } from "@/lib/firebase-secondary";

export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  status: string;
  clients: number;
  address: string;
  dob: string;
  language: string;
  country: string;
  height: number;
  weight: number;
  periodOfAccess: string;
  plan?: string;
  proofId: string;
  ptInsurance: string;
  avatar: string;
  certificate: string;
  gender?: string;
  createdAt?: Timestamp;
}

export interface TrainerPlan {
  id: string;
  name: string;
  months: number;
  days: number;
}

export const TRAINER_PLANS: TrainerPlan[] = [
  { id: "1 Month",  name: "WeFit Signature Plan (1 Month)",  months: 1,  days: 30  },
  { id: "3 Months", name: "WeFit Pro (3 Months)",            months: 3,  days: 90  },
  { id: "6 Months", name: "WeFit Elite (6 Months)",          months: 6,  days: 180 },
  { id: "1 Year",   name: "WeFit Master Plan (1 Year)",      months: 12, days: 365 },
];

/** Returns DD/MM/YYYY expiry date string for a trainer plan starting from today */
export function computeTrainerPlanEnd(planId: string): string {
  const plan = TRAINER_PLANS.find((p) => p.id === planId);
  if (!plan) return "";
  const d = new Date();
  d.setDate(d.getDate() + plan.days);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Days remaining until trainer plan expires. Negative = expired. */
export function daysUntilTrainerExpiry(periodOfAccess: string): number | null {
  if (!periodOfAccess) return null;
  let end: Date | null = null;
  // DD/MM/YYYY
  const m = periodOfAccess.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) end = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
  // ISO YYYY-MM-DD
  if (!end && /^\d{4}-\d{2}-\d{2}$/.test(periodOfAccess)) end = new Date(periodOfAccess + "T00:00:00");
  if (!end) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const COL = "trainers";

export async function getTrainers(): Promise<Trainer[]> {
  if (!db) return [];
  // No orderBy — avoids Firestore silently dropping docs that lack a createdAt field.
  const snap = await getDocs(collection(db, COL));
  const trainers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trainer));
  return trainers.sort((a, b) => {
    const aTime = (a.createdAt as any)?.seconds ?? 0;
    const bTime = (b.createdAt as any)?.seconds ?? 0;
    return bTime - aTime;
  });
}

export async function getTrainerById(id: string): Promise<Trainer | null> {
  if (!db) return null;
  const d = await import("firebase/firestore").then((m) => m.getDoc(m.doc(db as any, COL, id)));
  if (d.exists()) {
    return { id: d.id, ...d.data() } as Trainer;
  }
  return null;
}

/**
 * Admin adds a trainer WITH Firebase Auth account.
 * Creates:
 *  - trainers/{uid} (trainer profile)
 *  - users/{uid} (with role: "trainer" so they can log in and be routed correctly)
 */
export async function addTrainerWithAuth(
  data: Omit<Trainer, "id" | "createdAt">,
  tempPassword: string
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");

  // 1. Create Firebase Auth account
  const uid = await createAuthAccount(data.email, tempPassword, data.name);

  // 2. Trainer profile doc
  await setDoc(doc(db, COL, uid), {
    ...data,
    uid,
    status: "Active",
    clients: 0,
    createdAt: serverTimestamp(),
  });

  // 3. Users doc with role "trainer" for auth routing
  if (db) {
    await setDoc(doc(db, "users", uid), {
      uid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: "trainer",
      createdAt: serverTimestamp(),
    });
  }

  return uid;
}

export async function updateTrainer(id: string, data: Partial<Trainer>): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTrainer(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");

  // Call API to delete auth user
  const res = await fetch("/api/admin/auth/delete-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: id }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Failed to delete auth trainer:", errorData);
  }

  await deleteDoc(doc(db, COL, id));
}
