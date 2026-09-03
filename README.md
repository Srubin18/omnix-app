This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Multi-AI Question Tool

Visit [`/ask`](http://localhost:3000/ask) to ask one question and get answers from six AI providers side by side: Anthropic, OpenAI, Gemini, Perplexity, Kimi and Grok (xAI).

Each provider needs an API key set as an environment variable (locally in `.env.local`, or in your Vercel project settings). Providers without a key are simply greyed out — you can run with any subset.

| Provider | API key variable | Default model | Override model with |
| --- | --- | --- | --- |
| Anthropic | `ANTHROPIC_API_KEY` | `claude-opus-5` | `ANTHROPIC_MODEL` |
| OpenAI | `OPENAI_API_KEY` | `gpt-5.1` | `OPENAI_MODEL` |
| Gemini | `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) | `gemini-2.5-flash` | `GEMINI_MODEL` |
| Perplexity | `PERPLEXITY_API_KEY` | `sonar` | `PERPLEXITY_MODEL` |
| Kimi (Moonshot) | `KIMI_API_KEY` (or `MOONSHOT_API_KEY`) | `kimi-latest` | `KIMI_MODEL` |
| Grok (xAI) | `XAI_API_KEY` (or `GROK_API_KEY`) | `grok-4` | `XAI_MODEL` |

`kimi-latest` always points at Moonshot's newest Kimi model — set `KIMI_MODEL` to pin a specific version (e.g. a K3 model id once released). Get keys from each provider's console: [Anthropic](https://console.anthropic.com), [OpenAI](https://platform.openai.com), [Google AI Studio](https://aistudio.google.com), [Perplexity](https://www.perplexity.ai/settings/api), [Moonshot](https://platform.moonshot.ai), [xAI](https://console.x.ai).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
