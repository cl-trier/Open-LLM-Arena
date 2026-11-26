import { atom, computed } from "nanostores";

import type { Message, ConversationStore, ConversationStatus, ModelConversation } from "types";

import { streamChat, describeError, type StreamResult } from "@services/inference";

import { settingsStore } from "@stores/settings";
import { selectionStore } from "@stores/selection";
import { persistentJSON, devLogger } from "@stores/persistent";

import { PERSONAS } from "@assets/personas";

export const ACTIVE_STATUSES: ReadonlySet<ConversationStatus> = new Set(["loading", "streaming"]);

const emptyConversation = (): ModelConversation => ({ messages: [], status: "idle" });

/** Repairs malformed entries; a generation cannot survive a page reload, so never restore an in-flight status. */
function normalizeConversations(convs: ConversationStore): ConversationStore {
  return Object.fromEntries(
    Object.entries(convs ?? {}).map(([url, conv]) => {
      if (!Array.isArray(conv?.messages)) return [url, emptyConversation()];
      return [url, ACTIVE_STATUSES.has(conv.status) ? { ...conv, status: "idle" } : conv];
    })
  );
}

export const conversationsStore = persistentJSON<ConversationStore>(
  "conversations:",
  {},
  normalizeConversations
);

/** In-flight responses. Kept out of the persistent store so streaming does not hit localStorage per token. */
export const draftsStore = atom<Record<string, Message>>({});

export const isGeneratingStore = computed(conversationsStore, (convs) =>
  Object.values(convs).some((conv) => ACTIVE_STATUSES.has(conv.status))
);

export const hasMessagesStore = computed(conversationsStore, (convs) =>
  Object.values(convs).some((conv) => conv.messages.length > 0)
);

devLogger({ conversationsStore });

/** One conversation per selected model, in selection order. */
function syncWithSelection(models: string[], keepHistory: boolean): void {
  const current = conversationsStore.get();
  conversationsStore.set(
    Object.fromEntries(models.map((url) => [url, (keepHistory && current[url]) || emptyConversation()]))
  );
}

selectionStore.subscribe(({ models }) => syncWithSelection(models, true));

export function clearMessages(): void {
  syncWithSelection(selectionStore.get().models, false);
}

function updateConversation(
  url: string,
  update: (conv: ModelConversation) => Partial<ModelConversation>
): void {
  const convs = conversationsStore.get();
  const conv = convs[url];
  if (!conv) return; // model was deselected meanwhile
  conversationsStore.set({ ...convs, [url]: { ...conv, ...update(conv) } });
}

function toAssistantMessage({ content, reasoning, truncated }: StreamResult): Message {
  return {
    role: "assistant",
    content: content.trim(),
    ...(reasoning.trim() && { reasoning: reasoning.trim() }),
    ...(truncated && { truncated }),
  };
}

function setDraft(url: string, draft: Message | null): void {
  const { [url]: _, ...others } = draftsStore.get();
  draftsStore.set(draft ? { ...others, [url]: draft } : others);
}

let abortController: AbortController | null = null;

async function generateFor(url: string, accessToken: string, systemInstruction: string, signal: AbortSignal) {
  const history = conversationsStore.get()[url]?.messages;
  if (!history) return;

  updateConversation(url, () => ({ status: "loading", error: undefined }));
  let partial: StreamResult = { content: "", reasoning: "", truncated: false };

  try {
    partial = await streamChat(accessToken, url, history, systemInstruction, (update) => {
      partial = update;
      setDraft(url, toAssistantMessage(update));
      if (conversationsStore.get()[url]?.status === "loading") {
        updateConversation(url, () => ({ status: "streaming" }));
      }
    }, signal);
    updateConversation(url, (conv) => ({
      status: "idle",
      messages: [...conv.messages, toAssistantMessage(partial)],
    }));
  } catch (error) {
    const hasOutput = Boolean(partial.content.trim() || partial.reasoning.trim());
    // Keep whatever was generated before a stop or a mid-stream failure.
    updateConversation(url, (conv) => ({
      messages: hasOutput ? [...conv.messages, toAssistantMessage(partial)] : conv.messages,
      ...(signal.aborted
        ? { status: "idle" }
        : { status: "error", error: describeError(error) }),
    }));
    if (!signal.aborted) console.error(`Error with model ${url}:`, error);
  } finally {
    setDraft(url, null);
  }
}

async function generate(urls: string[]): Promise<void> {
  const { accessToken } = settingsStore.get();
  if (!accessToken) {
    urls.forEach((url) =>
      updateConversation(url, () => ({
        status: "error",
        error: "Please add your Hugging Face access token in the settings below.",
      }))
    );
    return;
  }

  const persona = PERSONAS.find((p) => p.name === selectionStore.get().persona);
  const controller = new AbortController();
  abortController = controller;

  await Promise.allSettled(
    urls.map((url) => generateFor(url, accessToken, persona?.instruction ?? "", controller.signal))
  );

  if (abortController === controller) abortController = null;
}

export async function sendMessage(content: string): Promise<void> {
  const text = content.trim();
  if (!text || isGeneratingStore.get()) return;

  const userMessage: Message = { role: "user", content: text };
  const urls = Object.keys(conversationsStore.get());
  urls.forEach((url) => updateConversation(url, (conv) => ({ messages: [...conv.messages, userMessage] })));

  await generate(urls);
}

/** Regenerates a model's answer to the latest user message, discarding any reply after it. */
export async function retryModel(url: string): Promise<void> {
  const conv = conversationsStore.get()[url];
  if (!conv || isGeneratingStore.get()) return;

  const lastUserIndex = conv.messages.findLastIndex((m) => m.role === "user");
  if (lastUserIndex === -1) return;

  updateConversation(url, () => ({ messages: conv.messages.slice(0, lastUserIndex + 1) }));
  await generate([url]);
}

export function stopGeneration(): void {
  abortController?.abort();
}

export function exportConversation(): string {
  return JSON.stringify(conversationsStore.get(), null, 2);
}
