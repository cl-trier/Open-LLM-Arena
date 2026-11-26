import {
  InferenceClient,
  InferenceClientHubApiError,
  InferenceClientProviderApiError,
} from '@huggingface/inference';
import type { Message } from 'types';

const MAX_TOKENS = 4096;
const ROUTER_MODELS_URL = 'https://router.huggingface.co/v1/models';
const WHOAMI_URL = 'https://huggingface.co/api/whoami-v2';

type ChatMessage = Pick<Message, 'role' | 'content'>;

export interface StreamResult {
  content: string;
  reasoning: string;
  truncated: boolean;
}

/**
 * Providers expect plain, alternating `{role, content}` messages: drop display-only
 * fields and empty turns, and merge consecutive turns of the same role (e.g. a user
 * message whose answer failed, followed by a new user message).
 */
function toRequestMessages(messages: Message[], systemInstruction: string): ChatMessage[] {
  const turns = systemInstruction
    ? [{ role: 'system' as const, content: systemInstruction }, ...messages]
    : messages;

  return turns.reduce<ChatMessage[]>((acc, { role, content }) => {
    if (!content.trim()) return acc;
    const previous = acc.at(-1);
    if (previous?.role === role) {
      previous.content += `\n\n${content}`;
    } else {
      acc.push({ role, content });
    }
    return acc;
  }, []);
}

/** Streams a chat completion, reporting the accumulated output after every chunk. */
export async function streamChat(
  accessToken: string,
  model: string,
  messages: Message[],
  systemInstruction: string,
  onUpdate: (partial: StreamResult) => void,
  signal: AbortSignal,
): Promise<StreamResult> {
  const result: StreamResult = { content: '', reasoning: '', truncated: false };
  const stream = new InferenceClient(accessToken).chatCompletionStream(
    { model, messages: toRequestMessages(messages, systemInstruction), max_tokens: MAX_TOKENS },
    { signal },
  );

  for await (const chunk of stream) {
    const choice = chunk.choices?.[0];
    if (!choice) continue;

    const { content, reasoning_content, reasoning } = choice.delta;
    result.content += typeof content === 'string' ? content : '';
    result.reasoning += [reasoning_content, reasoning].find((r) => typeof r === 'string') ?? '';
    result.truncated ||= choice.finish_reason === 'length';
    onUpdate({ ...result });
  }

  return result;
}

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Invalid access token. Please check your Hugging Face token in the settings.',
  402: 'Your Hugging Face inference credits are exhausted.',
  403: 'Access denied. The model may be gated, or your token lacks the "Make calls to Inference Providers" permission.',
  404: 'Model not found.',
  429: 'Rate limit exceeded. Please wait a moment and retry.',
};

export function describeError(error: unknown): string {
  if (error instanceof InferenceClientProviderApiError || error instanceof InferenceClientHubApiError) {
    const message = STATUS_MESSAGES[error.httpResponse.status];
    if (message) return message;
  }
  return error instanceof Error ? error.message : String(error);
}

/** IDs of all chat models currently served by at least one live inference provider. */
export async function fetchLiveModelIds(): Promise<Set<string>> {
  const response = await fetch(ROUTER_MODELS_URL);
  if (!response.ok) throw new Error(`Model list request failed (${response.status})`);

  const { data } = (await response.json()) as {
    data: Array<{ id: string; providers?: Array<{ status: string }> }>;
  };
  return new Set(
    data.filter((model) => model.providers?.some((p) => p.status === 'live')).map((model) => model.id),
  );
}

/** Resolves to the account name the token belongs to; rejects if the token is invalid. */
export async function verifyToken(accessToken: string): Promise<string> {
  const response = await fetch(WHOAMI_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(STATUS_MESSAGES[response.status] ?? `Token check failed (${response.status})`);
  return ((await response.json()) as { name: string }).name;
}
