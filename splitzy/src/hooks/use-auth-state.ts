import { onAuthStateChanged, type User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";

import { auth } from "@/lib/firebase";
import { upsertUserProfile } from "@/lib/users";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
      if (nextUser) {
        upsertUserProfile(nextUser);
      }
    });
    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    // `reload()` mutates auth.currentUser in place, so we need a new object
    // reference here or React won't know anything changed and won't re-render.
    setUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null);
  }, []);

  return { user, initializing, refresh };
}
