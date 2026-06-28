import {
  collection, addDoc, getDocs, updateDoc,
  doc, query, where, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ContactRequestType = "plan_upgrade" | "support";
export type ContactRequestStatus = "pending" | "seen";

export interface ContactRequest {
  id: string;
  type: ContactRequestType;
  fromId: string;
  fromName: string;
  fromRole: "user" | "trainer";
  toRole: "trainer" | "admin";
  toId?: string;
  plan?: string;
  message: string;
  status: ContactRequestStatus;
  createdAt: Timestamp;
}

const COL = "contact_requests";

export async function submitContactRequest(
  data: Omit<ContactRequest, "id" | "createdAt" | "status">
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = await addDoc(collection(db, COL), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getRequestsForTrainer(trainerId: string): Promise<ContactRequest[]> {
  if (!db) return [];
  const q = query(
    collection(db, COL),
    where("toId", "==", trainerId),
    where("toRole", "==", "trainer"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContactRequest));
}

export async function getRequestsForAdmin(): Promise<ContactRequest[]> {
  if (!db) return [];
  const q = query(
    collection(db, COL),
    where("toRole", "==", "admin"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContactRequest));
}

export async function markRequestSeen(id: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COL, id), { status: "seen" });
}
