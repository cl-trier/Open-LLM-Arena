import type { Selection } from "types";

import { MODELS } from "@assets/models";
import { PERSONAS } from "@assets/personas";

import { persistentJSON, devLogger } from "@stores/persistent";

const DEFAULT_PERSONA = PERSONAS[0].name;

/** Drops models and personas that no longer exist (e.g. after the model list changed). */
function normalizeSelection({ models, persona }: Selection): Selection {
  return {
    models: MODELS.map((m) => m.url).filter((url) => Array.isArray(models) && models.includes(url)),
    persona: PERSONAS.some((p) => p.name === persona) ? persona : DEFAULT_PERSONA,
  };
}

export const selectionStore = persistentJSON<Selection>(
  "selections:",
  { models: [], persona: DEFAULT_PERSONA },
  normalizeSelection
);

devLogger({ selectionStore });

export function toggleModel(modelUrl: string): void {
  const current = selectionStore.get();
  const models = current.models.includes(modelUrl)
    ? current.models.filter((m) => m !== modelUrl)
    : [...current.models, modelUrl];

  selectionStore.set(normalizeSelection({ ...current, models }));
}

export function setPersona(personaName: string): void {
  selectionStore.set(normalizeSelection({ ...selectionStore.get(), persona: personaName }));
}
