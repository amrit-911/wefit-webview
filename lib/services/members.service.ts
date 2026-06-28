import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, setDoc, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAuthAccount } from "@/lib/firebase-secondary";
import { createDefaultNutritionPlan } from "@/lib/services/client-nutrition.service";

import { getLocalDateString } from "@/lib/utils";

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  joinDate: string;
  avatar: string;
  goal: string;
  trainer: string;
  trainerSpec: string;
  progress: number;
  gender: string;
  dob: string;
  injuries: string;
  country: string;
  height: number;
  currentWeight: number;
  goalWeight: number;
  startWeight?: number;
  membershipEnd: string;
  purpose: string;
  createdAt?: Timestamp;
  dailyCheckinEnabled?: boolean;
  weeklyCheckinEnabled?: boolean;
  targetSteps?: number;
  stepsVisible?: boolean;
  currentWorkoutDay?: number;
  checkinPeriod?: "3days" | "7days" | "14days" | "1month";
}

const COL = "users";

/** Fetch all users with role = "user" */
export async function getMembers(): Promise<Member[]> {
  if (!db) return [];
  const q = query(
    collection(db, COL),
    where("role", "==", "user")
  );
  const snap = await getDocs(q);
  const members = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Member));
  // Sort client-side to avoid requiring a composite Firestore index
  return members.sort((a, b) => {
    const aTime = (a.createdAt as any)?.seconds ?? 0;
    const bTime = (b.createdAt as any)?.seconds ?? 0;
    return bTime - aTime;
  });
}

/** Fetch all members assigned to a specific trainer */
export async function getMembersByTrainer(trainerId: string): Promise<Member[]> {
  if (!db) return [];
  const q = query(
    collection(db, COL),
    where("role", "==", "user"),
    where("trainer", "==", trainerId)
  );
  const snap = await getDocs(q);
  const members = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Member));
  return members.sort((a, b) => {
    const aTime = (a.createdAt as any)?.seconds ?? 0;
    const bTime = (b.createdAt as any)?.seconds ?? 0;
    return bTime - aTime;
  });
}

/** Fetch a single member by ID */
export async function getMemberById(id: string): Promise<Member | null> {
  if (!db) return null;
  const d = await import("firebase/firestore").then((m) => m.getDoc(m.doc(db as any, COL, id)));
  if (d.exists()) {
    return { id: d.id, ...d.data() } as Member;
  }
  return null;
}

/**
 * Admin adds a member WITH a Firebase Auth account.
 * The client can immediately log in with the provided email + tempPassword.
 */
export async function addMemberWithAuth(
  data: Omit<Member, "id" | "createdAt">,
  tempPassword: string
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");

  // 1. Create Firebase Auth account via secondary app
  const uid = await createAuthAccount(data.email, tempPassword, data.name);

  // 2. Create Firestore doc using the new uid
  await setDoc(doc(db, COL, uid), {
    ...data,
    startWeight: data.startWeight ?? data.currentWeight ?? 0,
    uid,
    role: "user",
    status: "Active",
    progress: 0,
    onboardingComplete: true,
    joinDate: getLocalDateString(),
    createdAt: serverTimestamp(),
  });

  // 3. Seed default meal slots for the new client
  await createDefaultNutritionPlan(uid, data.trainer);

  return uid;
}

/** Update any field on a member doc */
export async function updateMember(id: string, data: Partial<Member>): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

/** Toggle member active/inactive status */
export async function updateMemberStatus(id: string, status: "Active" | "Inactive"): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, COL, id), { status, updatedAt: serverTimestamp() });
}

/** Delete a member doc and their Firebase Auth */
export async function deleteMember(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  
  // Call API to delete auth user
  const res = await fetch("/api/admin/auth/delete-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: id }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Failed to delete auth user:", errorData);
    // Depending on logic, we might throw or proceed to delete doc anyway
    // Let's proceed to delete doc even if auth deletion fails (e.g. user not found in auth)
  }

  await deleteDoc(doc(db, COL, id));
}
