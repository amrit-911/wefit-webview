import {
  doc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PersonalGoal {
  title: string;
  reason: string;
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  targetDate: string; // "YYYY-MM-DD"
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const DOC_PATH = (clientId: string) => `users/${clientId}/personal_goal/current`;

export async function getPersonalGoal(clientId: string): Promise<PersonalGoal | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, DOC_PATH(clientId)));
  if (!snap.exists()) return null;
  return snap.data() as PersonalGoal;
}

export async function savePersonalGoal(
  clientId: string,
  data: Omit<PersonalGoal, "createdAt" | "updatedAt">,
  isNew: boolean,
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = doc(db, DOC_PATH(clientId));
  await setDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
  }, { merge: true });
}

export async function deletePersonalGoal(clientId: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, DOC_PATH(clientId)));
}

/** Compute countdown from now to targetDate */
export function computeCountdown(targetDate: string): { weeks: number; days: number; hours: number } {
  const now = new Date();
  const target = new Date(targetDate);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return { weeks: 0, days: 0, hours: 0 };
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const weeks = Math.floor(totalHours / (7 * 24));
  const remainingAfterWeeks = totalHours - weeks * 7 * 24;
  const days = Math.floor(remainingAfterWeeks / 24);
  const hours = remainingAfterWeeks % 24;
  return { weeks, days, hours };
}
