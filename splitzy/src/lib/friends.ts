import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";

import { addFriendAddedActivity } from "./activity";
import { db } from "./firebase";
import type { UserProfile } from "./types";

export type { UserProfile } from "./types";

export function friendshipId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join("_");
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const normalized = email.trim().toLowerCase();
  const usersQuery = query(collection(db, "users"), where("email", "==", normalized), limit(1));
  const snapshot = await getDocs(usersQuery);
  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  return {
    uid: docSnap.id,
    email: data.email,
    displayName: data.displayName ?? "",
  };
}

export async function isAlreadyFriend(currentUid: string, friendUid: string): Promise<boolean> {
  const ref = doc(db, "friendships", friendshipId(currentUid, friendUid));
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function addFriend(currentUser: UserProfile, friend: UserProfile) {
  const batch = writeBatch(db);

  const friendshipRef = doc(db, "friendships", friendshipId(currentUser.uid, friend.uid));
  batch.set(friendshipRef, {
    participants: [currentUser.uid, friend.uid],
    profiles: {
      [currentUser.uid]: { email: currentUser.email, displayName: currentUser.displayName },
      [friend.uid]: { email: friend.email, displayName: friend.displayName },
    },
    createdAt: serverTimestamp(),
  });

  addFriendAddedActivity(batch, currentUser, friend);

  await batch.commit();
}
