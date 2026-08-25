import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ActivityEntry } from "@/lib/activity";
import { db } from "@/lib/firebase";
import { logError } from "@/lib/log-error";

const PAGE_SIZE = 10;

function mapActivityDoc(docSnap: QueryDocumentSnapshot): ActivityEntry {
  const data = docSnap.data();
  const base = {
    id: docSnap.id,
    actorUid: data.actorUid,
    actorName: data.actorName,
    createdAt: data.createdAt ? data.createdAt.toDate() : null,
  };

  switch (data.type) {
    case "friend_added":
      return {
        ...base,
        type: "friend_added",
        friendUid: data.friendUid,
        friendName: data.friendName,
      };
    case "group_created":
      return {
        ...base,
        type: "group_created",
        groupId: data.groupId,
        groupName: data.groupName,
      };
    case "expense_added":
      return {
        ...base,
        type: "expense_added",
        expenseId: data.expenseId,
        description: data.description,
        amountCents: data.amountCents,
        groupId: data.groupId ?? null,
        groupName: data.groupName ?? null,
      };
    case "expense_edited":
      return {
        ...base,
        type: "expense_edited",
        expenseId: data.expenseId,
        description: data.description,
        amountCents: data.amountCents,
        groupId: data.groupId ?? null,
        groupName: data.groupName ?? null,
      };
    case "signed_up":
    default:
      return { ...base, type: "signed_up" };
  }
}

export function useActivity(uid: string | undefined) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

  const loadFirstPage = useCallback(async () => {
    if (!uid) {
      setEntries([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const firstPageQuery = query(
        collection(db, "activity"),
        where("participants", "array-contains", uid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE),
      );
      const snapshot = await getDocs(firstPageQuery);
      setEntries(snapshot.docs.map(mapActivityDoc));
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null;
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      logError(err, { source: "useActivity", uid });
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!uid || !lastDocRef.current || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPageQuery = query(
        collection(db, "activity"),
        where("participants", "array-contains", uid),
        orderBy("createdAt", "desc"),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE),
      );
      const snapshot = await getDocs(nextPageQuery);
      setEntries((prev) => [...prev, ...snapshot.docs.map(mapActivityDoc)]);
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? lastDocRef.current;
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      logError(err, { source: "useActivity.loadMore", uid });
    } finally {
      setLoadingMore(false);
    }
  }, [uid, loadingMore, hasMore]);

  return { entries, loading, loadingMore, hasMore, loadMore, refresh: loadFirstPage };
}
