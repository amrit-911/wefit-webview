import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp, orderBy, query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SupplementItem {
  id: string;
  name: string;
  description: string;
  brand: string;
  comment: string; // kept for backwards compat (maps to precautions)
  imageUrl?: string;
  // New fields (from trainer form)
  category?: string;
  usageTiming?: string;
  usageTimingNote?: string;
  supplementType?: string;
  dosage?: string;
  frequency?: string;
  benefits?: string;
  precautions?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const COL = "supplements";

export async function getSupplements(): Promise<SupplementItem[]> {
  if (!db) return [];
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupplementItem));
}

export async function addSupplement(
  data: Omit<SupplementItem, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSupplement(
  id: string,
  data: Partial<Omit<SupplementItem, "id" | "createdAt">>
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSupplement(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, COL, id));
}
