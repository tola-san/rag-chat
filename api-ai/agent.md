# AGENTS.md — Operational Policy & Codebase Specification

This repository is a containerized REST API that lets frontend applications consume Google Gemini through a TypeScript and Express backend.

---

## 1. Stack & System Manifest

| Layer | Technology | Specification / Version |
| :--- | :--- | :--- |
| **Runtime** | Node.js | v20.x or v22.x LTS (Alpine Linux in container) |
| **Language** | TypeScript | 5.x (`strict: true`, `target: ES2022`, `module: NodeNext`) |
| **Server Framework** | Express | 5.x (Native ES Modules via `"type": "module"`) |
| **AI SDK** | Google Gen AI SDK | `@google/genai` |
| **Model** | Google Gemini | Configured with `GEMINI_MODEL` |
| **Dev Runner** | `tsx` | Direct TypeScript execution with live reload |
| **Container** | Docker | Multi-stage builder (`node:22-alpine`) + Compose |
| **Hosting Target** | Render | Web Service (Free Tier, 512 MB memory constraint) |

---

## 2. Agent Executable Commands

Run these exact commands to build, verify, and test changes. Never guess CLI flags.

### Verification & Testing
```bash
# Type check without emitting build artifacts (Must return exit code 0)
npx tsc --noEmit

# Full production compile check
npm run build

# Verify health check endpoint locally
curl -I http://localhost:5051/healthz

# Verify the versioned Gemini chat endpoint locally
curl -X POST http://localhost:5051/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is an API?", "history": []}'
```
