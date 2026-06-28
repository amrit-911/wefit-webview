import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Assumes db is exported from here
import { Firestore } from "firebase/firestore";

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  status: boolean;
  sequence: number;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "faqs";

// Fetch all FAQs ordered by sequence
export async function getFAQs(): Promise<FAQ[]> {
  try {
    const q = query(collection(db as Firestore, COLLECTION_NAME), orderBy("sequence", "asc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FAQ[];
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    throw new Error("Failed to load FAQs.");
  }
}

// Add a new FAQ
export async function addFAQ(faqData: Omit<FAQ, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db as Firestore, COLLECTION_NAME), {
      ...faqData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding FAQ:", error);
    throw new Error("Failed to add FAQ.");
  }
}

// Update an existing FAQ
export async function updateFAQ(id: string, updates: Partial<Omit<FAQ, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  try {
    const docRef = doc(db as Firestore, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    throw new Error("Failed to update FAQ.");
  }
}

// Delete an FAQ
export async function deleteFAQ(id: string): Promise<void> {
  try {
    const docRef = doc(db as Firestore, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    throw new Error("Failed to delete FAQ.");
  }
}
