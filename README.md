# Open LLM Arena

Compare open-weight large language models side by side. Pick models and a persona, send one prompt, and watch every model stream its answer in parallel — including the reasoning of thinking models.

**Live:** https://simon-muenker.github.io/Open-LLM-Arena

## How it works

- Runs entirely in the browser (static Astro site with Svelte islands, deployed to GitHub Pages).
- Requests go directly from the browser to [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) using your own access token — create one with the *Make calls to Inference Providers* permission at https://huggingface.co/settings/tokens.
- Token, selection, and conversations are stored only in your browser's `localStorage`.
- On load, the app checks which configured models are currently served by a provider and flags unavailable ones.

## Development

```sh
npm install
npm run dev      # http://localhost:4321/Open-LLM-Arena
npm run check    # type-check Astro, Svelte and TypeScript
npm run build    # production build in ./dist
npm run preview  # serve the production build
```

## Project structure

```text
src/
├── assets/      # models, personas, example prompts (plain data)
├── components/  # Svelte islands: ChatSetup, ChatMessages, ChatControl, Settings
├── layouts/     # page shell, header, footer
├── services/    # Hugging Face API access, sanitized markdown rendering
├── stores/      # nanostores state (persisted to localStorage)
└── types.ts
```

### Adding or replacing a model

Edit [`src/assets/models.ts`](src/assets/models.ts). A model must be listed with a live provider at https://router.huggingface.co/v1/models, otherwise it is shown as *currently unavailable*. Selections of removed models are dropped automatically on the next visit.
