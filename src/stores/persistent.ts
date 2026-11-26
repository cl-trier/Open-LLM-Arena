import { persistentAtom } from "@nanostores/persistent";
import { logger } from "@nanostores/logger";

/**
 * A localStorage-backed JSON atom. `normalize` runs on every value read from storage,
 * so stale or corrupted data from older app versions is repaired instead of trusted.
 */
export function persistentJSON<T>(key: string, initial: T, normalize: (value: T) => T = (v) => v) {
  return persistentAtom<T>(key, initial, {
    encode: JSON.stringify,
    decode: (raw) => {
      try {
        return normalize(JSON.parse(raw));
      } catch {
        return initial;
      }
    },
  });
}

/** Store logging for development builds only; never pass stores holding secrets. */
export function devLogger(stores: Parameters<typeof logger>[0]): void {
  if (import.meta.env.DEV) logger(stores);
}
