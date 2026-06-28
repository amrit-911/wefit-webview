import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface WorkoutPlan {
  id: string;
  name: string;
  duration: string;
  days: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  goal: string;
  members: number;
  trainer: string;
  createdAt?: Timestamp;
}

const COL = "workout_plans";

export async function getWorkoutPlans(): Promise<WorkoutPlan[]> {
  if (!db) return [];
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutPlan));
}

export async function addWorkoutPlan(data: Omit<WorkoutPlan, "id" | "createdAt">): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = await addDoc(collection(db, COL), {
    ...data,
    members: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateWorkoutPlan(id: string, data: Partial<WorkoutPlan>): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, COL, id), { ...data });
}

export async function deleteWorkoutPlan(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, COL, id));
}
