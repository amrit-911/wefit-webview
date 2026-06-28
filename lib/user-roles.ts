import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserRole } from "@/providers/auth-provider";

/**
 * Assign a role to a user in Firestore.
 * Call this from the Admin panel when promoting a user to trainer or admin.
 *
 * @param uid    - The Firebase Auth UID of the target user
 * @param role   - "admin" | "trainer" | "user"
 */
export async function assignRole(uid: string, role: UserRole): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    await updateDoc(userRef, { role });
  } else {
    // Create the document if it doesn't exist yet (e.g. for manually invited trainers)
    await setDoc(userRef, { uid, role });
  }
}

/**
 * Get the role of a user from Firestore.
 *
 * @param uid - The Firebase Auth UID of the user
 * @returns   The user's role, or null if the document doesn't exist
 */
export async function getUserRole(uid: string): Promise<UserRole | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return (snap.data().role as UserRole) ?? "user";
}
