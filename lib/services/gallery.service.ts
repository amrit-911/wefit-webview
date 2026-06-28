import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { uploadFile, deleteFile } from "@/lib/services/storage.service";

export interface GalleryPhoto {
  id: string;
  userId: string;
  url: string;
  date: string; // YYYY-MM-DD
  storagePath: string;
  uploadedAt?: Date;
}

/**
 * Upload a photo to storage and save metadata to Firestore.
 */
export async function uploadGalleryPhoto(
  userId: string,
  file: File,
  date: string // YYYY-MM-DD
): Promise<GalleryPhoto> {
  if (!db) throw new Error("Firebase not initialized");

  const { url, publicId } = await uploadFile(file, `gallery/${userId}`);

  const docRef = await addDoc(collection(db, "gallery_photos"), {
    userId,
    url,
    date,
    storagePath: publicId,
    uploadedAt: serverTimestamp(),
  });

  return { id: docRef.id, userId, url, date, storagePath: publicId };
}

/**
 * Save an already-uploaded photo's metadata to the gallery (no re-upload).
 */
export async function addGalleryPhotoRecord(
  userId: string,
  url: string,
  storagePath: string,
  date: string // YYYY-MM-DD
): Promise<void> {
  if (!db) return;
  await addDoc(collection(db, "gallery_photos"), {
    userId,
    url,
    date,
    storagePath,
    uploadedAt: serverTimestamp(),
  });
}

/**
 * Fetch all gallery photos for a user, sorted newest-date first.
 */
export async function getGalleryPhotos(userId: string): Promise<GalleryPhoto[]> {
  if (!db) return [];
  const q = query(
    collection(db, "gallery_photos"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  const photos = snap.docs.map((d) => ({
    id: d.id,
    userId: d.data().userId,
    url: d.data().url,
    date: d.data().date,
    storagePath: d.data().storagePath,
    uploadedAt: (d.data().uploadedAt as Timestamp)?.toDate(),
  }));
  // Sort by date descending (client-side, avoids composite index requirement)
  return photos.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Delete a gallery photo from storage and Firestore.
 */
export async function deleteGalleryPhoto(
  photoId: string,
  storagePath: string
): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "gallery_photos", photoId));
  try {
    await deleteFile(storagePath);
  } catch {
    // Ignore if already deleted from storage
  }
}

/**
 * Group photos by date string, returning a sorted array of { date, photos }.
 */
export function groupPhotosByDate(
  photos: GalleryPhoto[]
): { date: string; label: string; photos: GalleryPhoto[] }[] {
  const map: Record<string, GalleryPhoto[]> = {};
  for (const p of photos) {
    if (!map[p.date]) map[p.date] = [];
    map[p.date].push(p);
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, photos]) => ({
      date,
      label: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      photos,
    }));
}
