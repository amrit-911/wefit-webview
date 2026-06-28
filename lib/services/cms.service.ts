import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp, orderBy, query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const CMS_TYPES = [
  "Terms & Conditions",
  "Privacy Policy",
  "About Us",
  "FAQ",
  "Contact Us",
  "Refund Policy",
  "Other",
] as const;

export type CmsType = (typeof CMS_TYPES)[number];

export interface CmsItem {
  id: string;
  title: string;
  type: CmsType;
  pageLink: string;   // "NO-LINK" or an actual path
  content: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string;
  metaImageUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const COL = "cms_pages";

export async function getCmsItems(): Promise<CmsItem[]> {
  if (!db) return [];
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CmsItem));
}

export async function addCmsItem(
  data: Omit<CmsItem, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCmsItem(
  id: string,
  data: Partial<Omit<CmsItem, "id" | "createdAt">>
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCmsItem(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, COL, id));
}
