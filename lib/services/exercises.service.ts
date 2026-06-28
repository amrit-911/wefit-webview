import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle: string;
  equipment: string;
  difficulty?: string;
  sets?: number | string;
  reps?: string | number;
  description?: string;
  videoUrl?: string;       // uploaded video or YouTube/external URL
  thumbnailUrl?: string;   // optional thumbnail image
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const COL = "exercises";

export async function getExercises(): Promise<Exercise[]> {
  if (!db) return [];
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Exercise));
}

export async function addExercise(data: Omit<Exercise, "id" | "createdAt" | "updatedAt">): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateExercise(id: string, data: Partial<Omit<Exercise, "id" | "createdAt">>): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteExercise(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, COL, id));
}
