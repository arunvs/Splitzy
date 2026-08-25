import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/friends";
import { logError } from "@/lib/log-error";

export function useFriends(uid: string | undefined) {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setFriends([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const friendshipsQuery = query(
      collection(db, "friendships"),
      where("participants", "array-contains", uid),
    );

    const unsubscribe = onSnapshot(
      friendshipsQuery,
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const participants = data.participants as string[];
          const friendUid = participants.find((p) => p !== uid) ?? uid;
          const profile = data.profiles?.[friendUid] ?? { email: "", displayName: "" };
          return { uid: friendUid, email: profile.email, displayName: profile.displayName };
        });
        setFriends(next);
        setLoading(false);
      },
      (err) => {
        logError(err, { source: "useFriends", uid });
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  return { friends, loading };
}
