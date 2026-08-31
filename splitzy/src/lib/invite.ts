import { Platform, Share } from "react-native";

const STORE_LINKS = {
  android:
    "https://play.google.com/store/apps/details?id=oryn.online.splitzy&hl=en-US&ah=34ZCAeHn7fbRNSu4WUXUYzED3cM",
  // No iOS link yet — not released there.
  web: "https://splitzy.oryn.online",
};

function buildInviteMessage() {
  return [
    "Join me on Splitzy to split expenses easily!",
    "",
    `Android: ${STORE_LINKS.android}`,
    `Web: ${STORE_LINKS.web}`,
  ].join("\n");
}

export async function shareInvite(): Promise<"shared" | "copied" | "dismissed"> {
  const message = buildInviteMessage();

  if (Platform.OS === "web") {
    const nav = typeof navigator !== "undefined" ? (navigator as Navigator & {
      share?: (data: { title?: string; text?: string }) => Promise<void>;
      clipboard?: { writeText: (text: string) => Promise<void> };
    }) : undefined;

    if (nav?.share) {
      try {
        await nav.share({ title: "Join me on Splitzy", text: message });
        return "shared";
      } catch {
        return "dismissed";
      }
    }
    if (nav?.clipboard) {
      await nav.clipboard.writeText(message);
      return "copied";
    }
    return "dismissed";
  }

  const result = await Share.share({ message });
  return result.action === Share.sharedAction ? "shared" : "dismissed";
}
