import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import type { Expense } from "@/lib/expenses";
import { logError } from "@/lib/log-error";

export function useMyExpenses(uid: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const expensesQuery = query(collection(db, "expenses"), where("participants", "array-contains", uid));

    const unsubscribe = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              description: data.description,
              amountCents: data.amountCents,
              paidBy: data.paidBy,
              splitType: data.splitType,
              participants: data.participants ?? [],
              splits: data.splits ?? {},
              groupId: data.groupId ?? null,
              createdBy: data.createdBy,
              createdAt: data.createdAt ? data.createdAt.toDate() : null,
              expenseDate: data.expenseDate ? data.expenseDate.toDate() : null,
              updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
              updatedBy: data.updatedBy ?? null,
            } as Expense;
          })
          .sort((a, b) => {
            const aTime = (a.expenseDate ?? a.createdAt)?.getTime() ?? 0;
            const bTime = (b.expenseDate ?? b.createdAt)?.getTime() ?? 0;
            return bTime - aTime;
          });
        setExpenses(next);
        setLoading(false);
      },
      (err) => {
        logError(err, { source: "useMyExpenses", uid });
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  return { expenses, loading };
}
