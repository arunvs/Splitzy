import { logError } from "./log-error";

const FRIENDLY_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "No account found with that email.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/email-already-in-use": "An account with that email already exists.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/missing-password": "Please enter a password.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/requires-recent-login": "Please log out and log back in, then try again.",
};

function getErrorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

export function getAuthErrorMessage(error: unknown, context: Record<string, unknown> = {}): string {
  const code = getErrorCode(error);
  const friendly = code ? FRIENDLY_MESSAGES[code] : undefined;

  if (friendly) {
    return friendly;
  }

  logError(error, { source: "auth", code, ...context });
  return "Something went wrong. Please try again.";
}
