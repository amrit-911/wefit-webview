import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Category {
  id: string;
  name: string;
  products: number;
  status: "Active" | "Inactive";
  createdAt?: Timestamp;
}

const COL = "categories";

export async function getCategories(): Promise<Category[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COL));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
  return items.sort((a, b) => {
    const aTime = (a.createdAt as any)?.seconds ?? 0;
    const bTime = (b.createdAt as any)?.seconds ?? 0;
    return bTime - aTime;
  });
}

export async function addCategory(data: Omit<Category, "id" | "createdAt">): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCategory(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, COL, id));
}
