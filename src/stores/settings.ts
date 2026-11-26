import { persistentMap } from "@nanostores/persistent";

import type { Settings } from "types";

// Intentionally not passed to devLogger: it holds the access token.
export const settingsStore = persistentMap<Settings>("settings:", {
  accessToken: "",
});

export function setAccessToken(token: string): void {
  settingsStore.setKey("accessToken", token.trim());
}
