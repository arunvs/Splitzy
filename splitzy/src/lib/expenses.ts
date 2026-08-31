import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";

import { addExpenseAddedActivity, addExpenseDeletedActivity, addExpenseEditedActivity } from "./activity";
import { db } from "./firebase";
import type { SplitType } from "./money";
import type { UserProfile } from "./types";

export type Expense = {
  id: string;
  description: string;
  amountCents: number;
  paidBy: string;
  splitType: SplitType;
  participants: string[];
  splits: Record<string, number>;
  groupId: string | null;
  createdBy: string;
  createdAt: Date | null;
  // The date the expense/payment actually happened (user-chosen, can be in
  // the past for older bills) — distinct from createdAt, which is always
  // "when this record was written."
  expenseDate: Date | null;
  updatedAt: Date | null;
  updatedBy: string | null;
};

export async function createExpense(params: {
  description: string;
  amountCents: number;
  paidBy: string;
  splitType: SplitType;
  splits: Record<string, number>;
  // Defaults to Object.keys(splits) — pass explicitly when the payer isn't
  // a key in splits (e.g. a settlement, where the payer owes nothing back).
  participants?: string[];
  groupId: string | null;
  creator: UserProfile;
  groupName?: string;
  expenseDate: Date;
}): Promise<string> {
  const {
    description,
    amountCents,
    paidBy,
    splitType,
    splits,
    groupId,
    creator,
    groupName,
    expenseDate,
  } = params;
  const participants = params.participants ?? Object.keys(splits);

  const batch = writeBatch(db);
  const expenseRef = doc(collection(db, "expenses"));
  batch.set(expenseRef, {
    description,
    amountCents,
    paidBy,
    splitType,
    participants,
    splits,
    groupId,
    createdBy: creator.uid,
    createdAt: serverTimestamp(),
    expenseDate,
  });

  addExpenseAddedActivity(batch, creator, {
    expenseId: expenseRef.id,
    description,
    amountCents,
    participants,
    groupId,
    groupName,
  });

  await batch.commit();
  return expenseRef.id;
}

// A settlement is modeled as a regular expense: the payer covers the full
// amount and the recipient's split is the full amount too (they're the one
// whose balance improves) — the exact same balance math as a normal expense
// already handles this correctly, no special-casing needed there. 1-on-1
// only for now; settling a whole group (with suggested minimal-transaction
// payments) is a bigger feature for later.
export async function createSettlement(params: {
  payer: UserProfile;
  recipient: UserProfile;
  amountCents: number;
  expenseDate: Date;
  // The signed-in user actually performing this write — NOT necessarily the
  // payer (you can record "they paid me"). Firestore rules require
  // request.auth.uid === createdBy, and request.auth.uid is always the real
  // signed-in user, so `creator` must be them, never the other party.
  actor: UserProfile;
}): Promise<string> {
  const { payer, recipient, amountCents, expenseDate, actor } = params;
  return createExpense({
    description: "Settlement",
    amountCents,
    paidBy: payer.uid,
    splitType: "settlement",
    splits: { [recipient.uid]: amountCents },
    participants: [payer.uid, recipient.uid],
    groupId: null,
    creator: actor,
    expenseDate,
  });
}

export async function updateExpense(
  expenseId: string,
  params: {
    description: string;
    amountCents: number;
    paidBy: string;
    splitType: SplitType;
    splits: Record<string, number>;
    expenseDate: Date;
  },
  editor: UserProfile,
  groupId: string | null,
  groupName?: string,
): Promise<void> {
  const { description, amountCents, paidBy, splitType, splits, expenseDate } = params;
  const participants = Object.keys(splits);

  const batch = writeBatch(db);
  const expenseRef = doc(db, "expenses", expenseId);
  // groupId is intentionally not touched here — moving an expense between
  // groups isn't something this edit flow supports.
  batch.update(expenseRef, {
    description,
    amountCents,
    paidBy,
    splitType,
    participants,
    splits,
    expenseDate,
    updatedAt: serverTimestamp(),
    updatedBy: editor.uid,
  });

  addExpenseEditedActivity(batch, editor, {
    expenseId,
    description,
    amountCents,
    participants,
    groupId,
    groupName,
  });

  await batch.commit();
}

export async function deleteExpense(
  expense: Expense,
  actor: UserProfile,
  groupName?: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "expenses", expense.id));

  addExpenseDeletedActivity(batch, actor, {
    description: expense.description,
    amountCents: expense.amountCents,
    participants: expense.participants,
    groupId: expense.groupId,
    groupName,
  });

  await batch.commit();
}

/**
 * Net balance with every other person these expenses touch, from
 * currentUid's point of view. Positive cents = that person owes you;
 * negative = you owe them. Only counts an expense once per counterpart even
 * when it's a group expense involving several other people at once.
 */
export function computeBalancesByOtherUser(
  expenses: Expense[],
  currentUid: string,
): Record<string, number> {
  const balances: Record<string, number> = {};

  for (const expense of expenses) {
    if (expense.paidBy === currentUid) {
      for (const [uid, amount] of Object.entries(expense.splits)) {
        if (uid === currentUid) continue;
        balances[uid] = (balances[uid] ?? 0) + amount;
      }
    } else if (expense.participants.includes(currentUid)) {
      const mySplit = expense.splits[currentUid] ?? 0;
      balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) - mySplit;
    }
  }

  return balances;
}

export function sumBalances(balances: Record<string, number>): number {
  return Object.values(balances).reduce((sum, v) => sum + v, 0);
}
