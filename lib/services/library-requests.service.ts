import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  query, where, serverTimestamp, Timestamp, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addSupplement } from "./supplements.service";
import { addNutritionItem } from "./nutrition.service";

export type LibraryRequestType = "supplement" | "nutrition";
export type LibraryRequestStatus = "pending" | "approved" | "rejected";

export interface LibraryRequest {
  id?: string;
  type: LibraryRequestType;
  status: LibraryRequestStatus;
  trainerId: string;
  trainerName: string;
  submittedAt?: Timestamp;

  // Common
  name: string;
  description: string;

  // Supplement-specific
  category?: string;
  usageTiming?: string;
  usageTimingNote?: string;
  supplementType?: string;
  dosage?: string;
  frequency?: string;
  brand?: string;
  benefits?: string;
  precautions?: string;

  // Nutrition-specific
  calories?: string;
  protein?: string;
  carbs?: string;
  fats?: string;
  ingredients?: string;
  preparationInstructions?: string;
}

const COL = "library_requests";

/** Trainer submits a new supplement or nutrition item for admin review */
export async function submitLibraryRequest(
  trainerId: string,
  trainerName: string,
  data: Omit<LibraryRequest, "id" | "status" | "trainerId" | "trainerName" | "submittedAt">
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await addDoc(collection(db, COL), {
    ...data,
    trainerId,
    trainerName,
    status: "pending",
    submittedAt: serverTimestamp(),
  });
}

/** Admin: get all pending requests (optionally filtered by type) */
export async function getPendingLibraryRequests(
  type?: LibraryRequestType
): Promise<LibraryRequest[]> {
  if (!db) return [];
  const constraints: any[] = [where("status", "==", "pending"), orderBy("submittedAt", "desc")];
  if (type) constraints.splice(1, 0, where("type", "==", type));
  try {
    const q = query(collection(db, COL), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LibraryRequest));
  } catch {
    // Fallback without orderBy if index missing
    const q2 = type
      ? query(collection(db, COL), where("status", "==", "pending"), where("type", "==", type))
      : query(collection(db, COL), where("status", "==", "pending"));
    const snap = await getDocs(q2);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LibraryRequest));
  }
}

/**
 * Admin approves a request:
 * 1. Adds the item to the live supplements/nutrition_items collection
 * 2. Marks the request as approved
 */
export async function approveLibraryRequest(request: LibraryRequest): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  if (!request.id) throw new Error("Request ID missing");

  if (request.type === "supplement") {
    await addSupplement({
      name: request.name,
      description: request.description,
      brand: request.brand ?? "",
      comment: request.precautions ?? "",
      category: request.category ?? "",
      usageTiming: request.usageTiming ?? "",
      usageTimingNote: request.usageTimingNote ?? "",
      supplementType: request.supplementType ?? "",
      dosage: request.dosage ?? "",
      frequency: request.frequency ?? "",
      benefits: request.benefits ?? "",
      precautions: request.precautions ?? "",
    });
  } else {
    await addNutritionItem({
      name: request.name,
      description: request.description,
      quantity: 0,
      measurement: "g",
      calories: request.calories ?? "0",
      protein: request.protein ?? "0",
      carbs: request.carbs ?? "0",
      fats: request.fats ?? "0",
      ingredients: request.ingredients ?? "",
      preparationInstructions: request.preparationInstructions ?? "",
    });
  }

  await updateDoc(doc(db, COL, request.id), {
    status: "approved",
    approvedAt: serverTimestamp(),
  });
}

/** Admin rejects a request (marks rejected, does NOT delete) */
export async function rejectLibraryRequest(requestId: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, COL, requestId), {
    status: "rejected",
    rejectedAt: serverTimestamp(),
  });
}
