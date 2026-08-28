import { arrayRemove, arrayUnion, collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";

import { addGroupCreatedActivity, addGroupMemberAddedActivity, addGroupMemberRemovedActivity } from "./activity";
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

// Any current member can add/remove any other member — deliberately no
// approval step, matching how adding a friend or creating a group already
// works instantly in this app. Removing someone only drops them from the
// active `members` array; their `memberProfiles` entry is left alone so
// past expenses they were part of still resolve a name correctly.
export async function addGroupMember(
  group: Group,
  actor: UserProfile,
  member: UserProfile,
): Promise<void> {
  const batch = writeBatch(db);
  const groupRef = doc(db, "groups", group.id);
  batch.update(groupRef, {
    members: arrayUnion(member.uid),
    [`memberProfiles.${member.uid}`]: { email: member.email, displayName: member.displayName },
  });

  addGroupMemberAddedActivity(batch, actor, {
    groupId: group.id,
    groupName: group.name,
    memberUid: member.uid,
    memberName: member.displayName || member.email,
    participants: [...group.members, member.uid],
  });

  await batch.commit();
}

export async function removeGroupMember(
  group: Group,
  actor: UserProfile,
  memberUid: string,
  memberName: string,
): Promise<void> {
  const batch = writeBatch(db);
  const groupRef = doc(db, "groups", group.id);
  batch.update(groupRef, {
    members: arrayRemove(memberUid),
  });

  addGroupMemberRemovedActivity(batch, actor, {
    groupId: group.id,
    groupName: group.name,
    memberUid,
    memberName,
    participants: group.members,
  });

  await batch.commit();
}
