import { atom, onMount } from "nanostores";

import { fetchLiveModelIds } from "@services/inference";

/**
 * IDs of models currently served by an inference provider.
 * `null` while unknown (loading, offline, or request failed): treat every model as available.
 */
export const liveModelsStore = atom<Set<string> | null>(null);

onMount(liveModelsStore, () => {
  if (import.meta.env.SSR || liveModelsStore.get()) return;
  fetchLiveModelIds()
    .then((ids) => liveModelsStore.set(ids))
    .catch((error) => console.warn("Could not check model availability:", error));
});
