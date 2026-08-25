import type { User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "./firebase";
import { logError } from "./log-error";

export function upsertUserProfile(user: User) {
  if (!user.email) return;

  setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email.toLowerCase(),
      displayName: user.displayName ?? "",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ).catch((err) => logError(err, { source: "upsertUserProfile", uid: user.uid }));
}
