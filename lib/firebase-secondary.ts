/**
 * lib/firebase-secondary.ts
 *
 * A secondary Firebase app instance used ONLY by admins to create user accounts
 * without signing out the currently logged-in admin.
 *
 * This is the standard Firebase client-side workaround for creating accounts
 * as an admin without an Admin SDK backend.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { firebaseConfig } from "@/lib/firebase";

const SECONDARY_APP_NAME = "adminCreation";

function getSecondaryApp() {
  const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  return existing ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
}

/**
 * Creates a Firebase Auth account on behalf of the admin.
 * The admin's own session is NOT affected.
 * Returns the new user's uid.
 */
export async function createAuthAccount(
  email: string,
  password: string,
  displayName?: string
): Promise<string> {
  const secondaryApp = getSecondaryApp();
  const secondaryAuth = getAuth(secondaryApp);

  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  // Sign out of the secondary instance immediately
  await signOut(secondaryAuth);

  return cred.user.uid;
}
