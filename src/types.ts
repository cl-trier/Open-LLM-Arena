export type Role = "user" | "assistant" | "system";

export interface Message {
  role: Role;
  content: string;
  /** Chain-of-thought emitted by reasoning models; displayed but never sent back. */
  reasoning?: string;
  /** Set when generation stopped at the token limit. */
  truncated?: boolean;
}

export type ConversationStatus = 'idle' | 'loading' | 'streaming' | 'error';

export interface ModelConversation {
  messages: Message[];
  status: ConversationStatus;
  error?: string;
}

export interface Model {
  name: string;
  url: string;
  size: number;
  description?: string;
}

export interface Persona {
  name: string;
  icon: string;
  instruction: string;
  description?: string;
}

export interface Selection {
  models: string[];
  persona: string;
}

// A type alias (not an interface) so it satisfies persistentMap's string-record constraint.
export type Settings = {
  accessToken: string;
};

export type ConversationStore = Record<string, ModelConversation>;
