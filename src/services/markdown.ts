import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Renders untrusted markdown (user input and model output) to sanitized HTML.
 * Sanitizing is mandatory: the page stores the user's access token, so any
 * injected script could exfiltrate it.
 */
export function renderMarkdown(text: string): string {
  const html = marked.parse(text, { async: false, gfm: true, breaks: true });
  return DOMPurify.sanitize(html);
}
