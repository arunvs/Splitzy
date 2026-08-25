import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import type { Group } from "@/lib/groups";
import { logError } from "@/lib/log-error";

export function useGroups(uid: string | undefined) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const groupsQuery = query(collection(db, "groups"), where("members", "array-contains", uid));

    const unsubscribe = onSnapshot(
      groupsQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name,
              description: data.description ?? "",
              members: data.members ?? [],
              memberProfiles: data.memberProfiles ?? {},
              createdBy: data.createdBy,
              createdAt: data.createdAt ? data.createdAt.toDate() : null,
            } as Group;
          })
          .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
        setGroups(next);
        setLoading(false);
      },
      (err) => {
        logError(err, { source: "useGroups", uid });
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  return { groups, loading };
}
