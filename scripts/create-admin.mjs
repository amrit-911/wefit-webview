// One-off bootstrap script — creates a Firebase Auth account + users/{uid} doc with role: "admin".
// Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> "<name>"

import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const [, , email, password, name] = process.argv;

if (!email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> "<name>"');
  process.exit(1);
}

const userRecord = await admin.auth().createUser({
  email,
  password,
  displayName: name || "Admin",
});

await admin.firestore().collection("users").doc(userRecord.uid).set({
  uid: userRecord.uid,
  email,
  name: name || "Admin",
  role: "admin",
  status: "Active",
  createdAt: admin.firestore.Timestamp.now(),
  updatedAt: admin.firestore.Timestamp.now(),
});

console.log(`Admin created: ${email} (uid: ${userRecord.uid})`);
process.exit(0);
