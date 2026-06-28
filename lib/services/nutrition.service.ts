import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface NutritionItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  measurement?: string;
  calories: string;
  carbs: string;
  protein: string;
  fats: string;
  ingredients?: string;
  preparationInstructions?: string;
  createdAt?: Timestamp;
}

const COL = "nutrition_items";

export async function getNutritionItems(): Promise<NutritionItem[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NutritionItem));
}

export async function addNutritionItem(data: Omit<NutritionItem, "id" | "createdAt">): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateNutritionItem(id: string, data: Partial<NutritionItem>): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, COL, id), { ...data });
}

export async function deleteNutritionItem(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, COL, id));
}
