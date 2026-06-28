import {
  collection, doc, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, Timestamp, getDocs,
  limit, updateDoc, where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Timestamp | null;
  read: boolean;
}

export interface ChatRoom {
  id?: string;
  trainerId: string;
  clientId: string;
  trainerName: string;
  clientName: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp | null;
  lastSenderId?: string;
  unreadTrainer?: number;  // unread count for trainer
  unreadClient?: number;   // unread count for client
  updatedAt?: Timestamp | null;
}

const ROOMS_COL = "chat_rooms";
const MESSAGES_SUB = "messages";

/** Build a deterministic room ID from two user IDs */
export function buildRoomId(trainerId: string, clientId: string): string {
  return `${trainerId}_${clientId}`;
}

/**
 * Get or create a chat room between a trainer and client.
 * Returns the room document ID.
 */
export async function getOrCreateChatRoom(
  trainerId: string,
  trainerName: string,
  clientId: string,
  clientName: string,
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const roomId = buildRoomId(trainerId, clientId);
  const roomRef = doc(db, ROOMS_COL, roomId);
  const { getDoc, setDoc } = await import("firebase/firestore");
  const snap = await getDoc(roomRef);
  if (!snap.exists()) {
    await setDoc(roomRef, {
      trainerId, trainerName, clientId, clientName,
      lastMessage: "", lastMessageAt: null,
      unreadTrainer: 0, unreadClient: 0,
      updatedAt: serverTimestamp(),
    });
  }
  return roomId;
}

/** Send a message in a chat room */
export async function sendMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  text: string,
  receiverRole: "trainer" | "client",
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const msgRef = collection(db, ROOMS_COL, roomId, MESSAGES_SUB);
  await addDoc(msgRef, {
    senderId, senderName, text: text.trim(),
    createdAt: serverTimestamp(), read: false,
  });
  // Update room metadata
  const roomRef = doc(db, ROOMS_COL, roomId);
  const unreadField = receiverRole === "trainer" ? "unreadTrainer" : "unreadClient";
  const { increment } = await import("firebase/firestore");
  await updateDoc(roomRef, {
    lastMessage: text.trim(),
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
    updatedAt: serverTimestamp(),
    [unreadField]: increment(1),
  });
}

/** Subscribe to messages in a room (real-time) */
export function subscribeToMessages(
  roomId: string,
  callback: (messages: ChatMessage[]) => void,
): () => void {
  if (!db) return () => {};
  const q = query(
    collection(db, ROOMS_COL, roomId, MESSAGES_SUB),
    orderBy("createdAt", "asc"),
    limit(200),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
  });
}

/** Subscribe to all chat rooms for a trainer */
export function subscribeToTrainerRooms(
  trainerId: string,
  callback: (rooms: ChatRoom[]) => void,
): () => void {
  if (!db) return () => {};
  const q = query(
    collection(db, ROOMS_COL),
    where("trainerId", "==", trainerId),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatRoom)));
  });
}

/** Mark all messages in a room as read for a given reader role */
export async function markRoomRead(
  roomId: string,
  readerRole: "trainer" | "client",
): Promise<void> {
  if (!db) return;
  const roomRef = doc(db, ROOMS_COL, roomId);
  const unreadField = readerRole === "trainer" ? "unreadTrainer" : "unreadClient";
  await updateDoc(roomRef, { [unreadField]: 0 });
}

/** Get total unread count for trainer across all rooms */
export async function getTrainerUnreadTotal(trainerId: string): Promise<number> {
  if (!db) return 0;
  const q = query(collection(db, ROOMS_COL), where("trainerId", "==", trainerId));
  const snap = await getDocs(q);
  return snap.docs.reduce((sum, d) => sum + ((d.data().unreadTrainer as number) || 0), 0);
}

/** Get or subscribe to the single chat room for a client (they have exactly one trainer) */
export function subscribeToClientRoom(
  clientId: string,
  callback: (room: ChatRoom | null) => void,
): () => void {
  if (!db) return () => {};
  const q = query(collection(db, ROOMS_COL), where("clientId", "==", clientId));
  return onSnapshot(q, (snap) => {
    if (snap.empty) { callback(null); return; }
    const d = snap.docs[0];
    callback({ id: d.id, ...d.data() } as ChatRoom);
  });
}

/** Get unread count for a client (messages they haven't read) */
export async function getClientUnreadCount(clientId: string): Promise<number> {
  if (!db) return 0;
  const q = query(collection(db, ROOMS_COL), where("clientId", "==", clientId));
  const snap = await getDocs(q);
  return snap.docs.reduce((sum, d) => sum + ((d.data().unreadClient as number) || 0), 0);
}
