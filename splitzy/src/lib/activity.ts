import { addDoc, collection, doc, serverTimestamp, type WriteBatch } from "firebase/firestore";

import { db } from "./firebase";
import type { UserProfile } from "./types";

export type ActivityEntry =
  | {
      id: string;
      type: "friend_added";
      actorUid: string;
      actorName: string;
      friendUid: string;
      friendName: string;
      createdAt: Date | null;
    }
  | {
      id: string;
      type: "signed_up";
      actorUid: string;
      actorName: string;
      createdAt: Date | null;
    }
  | {
      id: string;
      type: "group_created";
      actorUid: string;
      actorName: string;
      groupId: string;
      groupName: string;
      createdAt: Date | null;
    }
  | {
      id: string;
      type: "expense_added";
      actorUid: string;
      actorName: string;
      expenseId: string;
      description: string;
      amountCents: number;
      groupId: string | null;
      groupName: string | null;
      createdAt: Date | null;
    }
  | {
      id: string;
      type: "expense_edited";
      actorUid: string;
      actorName: string;
      expenseId: string;
      description: string;
      amountCents: number;
      groupId: string | null;
      groupName: string | null;
      createdAt: Date | null;
    }
  | {
      id: string;
      type: "expense_deleted";
      actorUid: string;
      actorName: string;
      description: string;
      amountCents: number;
      groupId: string | null;
      groupName: string | null;
      createdAt: Date | null;
    }
  | {
      id: string;
      type: "group_member_added";
      actorUid: string;
      actorName: string;
      groupId: string;
      groupName: string;
      memberUid: string;
      memberName: string;
      createdAt: Date | null;
    }
  | {
      id: string;
      type: "group_member_removed";
      actorUid: string;
      actorName: string;
      groupId: string;
      groupName: string;
      memberUid: string;
      memberName: string;
      createdAt: Date | null;
    };

export function addFriendAddedActivity(batch: WriteBatch, actor: UserProfile, friend: UserProfile) {
  const ref = doc(collection(db, "activity"));
  batch.set(ref, {
    type: "friend_added",
    participants: [actor.uid, friend.uid],
    actorUid: actor.uid,
    actorName: actor.displayName || actor.email,
    friendUid: friend.uid,
    friendName: friend.displayName || friend.email,
    createdAt: serverTimestamp(),
  });
}

export function addGroupCreatedActivity(
  batch: WriteBatch,
  actor: UserProfile,
  groupId: string,
  groupName: string,
  memberUids: string[],
) {
  const ref = doc(collection(db, "activity"));
  batch.set(ref, {
    type: "group_created",
    participants: memberUids,
    actorUid: actor.uid,
    actorName: actor.displayName || actor.email,
    groupId,
    groupName,
    createdAt: serverTimestamp(),
  });
}

export function addExpenseAddedActivity(
  batch: WriteBatch,
  actor: UserProfile,
  expense: {
    expenseId: string;
    description: string;
    amountCents: number;
    participants: string[];
    groupId: string | null;
    groupName?: string;
  },
) {
  const ref = doc(collection(db, "activity"));
  batch.set(ref, {
    type: "expense_added",
    participants: expense.participants,
    actorUid: actor.uid,
    actorName: actor.displayName || actor.email,
    expenseId: expense.expenseId,
    description: expense.description,
    amountCents: expense.amountCents,
    groupId: expense.groupId,
    groupName: expense.groupName ?? null,
    createdAt: serverTimestamp(),
  });
}

export function addExpenseEditedActivity(
  batch: WriteBatch,
  actor: UserProfile,
  expense: {
    expenseId: string;
    description: string;
    amountCents: number;
    participants: string[];
    groupId: string | null;
    groupName?: string;
  },
) {
  const ref = doc(collection(db, "activity"));
  batch.set(ref, {
    type: "expense_edited",
    participants: expense.participants,
    actorUid: actor.uid,
    actorName: actor.displayName || actor.email,
    expenseId: expense.expenseId,
    description: expense.description,
    amountCents: expense.amountCents,
    groupId: expense.groupId,
    groupName: expense.groupName ?? null,
    createdAt: serverTimestamp(),
  });
}

export function addExpenseDeletedActivity(
  batch: WriteBatch,
  actor: UserProfile,
  expense: {
    description: string;
    amountCents: number;
    participants: string[];
    groupId: string | null;
    groupName?: string;
  },
) {
  const ref = doc(collection(db, "activity"));
  batch.set(ref, {
    type: "expense_deleted",
    participants: expense.participants,
    actorUid: actor.uid,
    actorName: actor.displayName || actor.email,
    description: expense.description,
    amountCents: expense.amountCents,
    groupId: expense.groupId,
    groupName: expense.groupName ?? null,
    createdAt: serverTimestamp(),
  });
}

export function addGroupMemberAddedActivity(
  batch: WriteBatch,
  actor: UserProfile,
  info: { groupId: string; groupName: string; memberUid: string; memberName: string; participants: string[] },
) {
  const ref = doc(collection(db, "activity"));
  batch.set(ref, {
    type: "group_member_added",
    participants: info.participants,
    actorUid: actor.uid,
    actorName: actor.displayName || actor.email,
    groupId: info.groupId,
    groupName: info.groupName,
    memberUid: info.memberUid,
    memberName: info.memberName,
    createdAt: serverTimestamp(),
  });
}

export function addGroupMemberRemovedActivity(
  batch: WriteBatch,
  actor: UserProfile,
  info: { groupId: string; groupName: string; memberUid: string; memberName: string; participants: string[] },
) {
  const ref = doc(collection(db, "activity"));
  batch.set(ref, {
    type: "group_member_removed",
    participants: info.participants,
    actorUid: actor.uid,
    actorName: actor.displayName || actor.email,
    groupId: info.groupId,
    groupName: info.groupName,
    memberUid: info.memberUid,
    memberName: info.memberName,
    createdAt: serverTimestamp(),
  });
}

export async function logSignedUpActivity(user: UserProfile) {
  await addDoc(collection(db, "activity"), {
    type: "signed_up",
    participants: [user.uid],
    actorUid: user.uid,
    actorName: user.displayName || user.email,
    createdAt: serverTimestamp(),
  });
}
