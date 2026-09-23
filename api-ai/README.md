# Gemini Chat API

A TypeScript and Express REST API that lets frontend applications consume
Google Gemini without exposing the Gemini API key in browser code.

## Requirements

- Node.js 22
- A Google Gemini API key

The default model is `gemini-3.5-flash-lite`, selected for lower latency and
higher-throughput usage. Override it with `GEMINI_MODEL` in `.env`.

## Run locally

1. Copy `.env.example` to `.env` and set `GOOGLE_API_KEY`.
2. Install dependencies with `npm install`.
3. Start development mode with `npm run dev`.

The local API listens on `http://localhost:5051` by default.

## Endpoints

### API information

```http
GET /
```

### Health checks

```http
GET /healthz
GET /api/v1/health
```

### Ask a question

```http
POST /api/v1/chat
Content-Type: application/json

{
  "question": "What is an API?",
  "history": []
}
```

The original `POST /api/chat` endpoint remains available for backward
compatibility. The OpenAPI 3.1 definition is available at `GET /openapi.json`.

## Frontend integration

This browser-compatible `fetch` example works in React, Vue, Angular, Svelte,
Next.js client components, and plain JavaScript:

```js
const response = await fetch("http://localhost:5051/api/v1/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: "What is an API?",
    history: [],
  }),
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.error);
}

console.log(data.answer);
```

Questions are sent directly to Gemini as general-purpose chat requests. The
optional `history` array is forwarded as conversation context; there is no
hard-coded product knowledge base or vector-store restriction.

Configure browser origins as a comma-separated list in `.env`:

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

Add the deployed frontend origin before production deployment.

Successful response:

```json
{
  "success": true,
  "answer": "An API is an interface that allows software applications to communicate..."
}
```

## Verify

```bash
npm run typecheck
npm run build
```

## Docker

After creating `.env`, run:

```bash
docker compose up --build
```
