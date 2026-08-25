import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";

import { addExpenseAddedActivity, addExpenseEditedActivity } from "./activity";
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
  const participants = Object.keys(splits);

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
