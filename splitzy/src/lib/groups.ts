import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";

import { addGroupCreatedActivity } from "./activity";
import { db } from "./firebase";
import type { UserProfile } from "./types";

export type Group = {
  id: string;
  name: string;
  description: string;
  members: string[];
  memberProfiles: Record<string, { email: string; displayName: string }>;
  createdBy: string;
  createdAt: Date | null;
};

export async function createGroup(
  creator: UserProfile,
  name: string,
  description: string,
  members: UserProfile[],
): Promise<string> {
  const allMembers = [creator, ...members];
  const memberProfiles: Record<string, { email: string; displayName: string }> = {};
  for (const member of allMembers) {
    memberProfiles[member.uid] = { email: member.email, displayName: member.displayName };
  }

  const batch = writeBatch(db);
  const groupRef = doc(collection(db, "groups"));
  batch.set(groupRef, {
    name,
    description,
    members: allMembers.map((m) => m.uid),
    memberProfiles,
    createdBy: creator.uid,
    createdAt: serverTimestamp(),
  });

  addGroupCreatedActivity(
    batch,
    creator,
    groupRef.id,
    name,
    allMembers.map((m) => m.uid),
  );

  await batch.commit();
  return groupRef.id;
}
