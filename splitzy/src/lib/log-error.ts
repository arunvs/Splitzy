import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "./firebase";

export function logError(error: unknown, context: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  if (__DEV__) {
    console.error("[logError]", message, context, error);
  }

  addDoc(collection(db, "errorLogs"), {
    message,
    stack: stack ?? null,
    context,
    createdAt: serverTimestamp(),
  }).catch(() => {
    // Best-effort logging only — a failure here must never crash the caller.
  });
}
