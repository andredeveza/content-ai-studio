# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Content AI Studio: a SaaS that takes a **theme** typed by the user and produces a
full Instagram carousel — structure, per-slide copy, images, caption, hashtags,
CTA, and final PNGs (1080×1350 or 1080×1080) dressed in the client's Brand Kit.
Pilot client: AD Tráfego Digital (seeded in `supabase/seed.sql`).

The authoritative product/architecture spec lives in
`design_handoff_content_ai_studio/README.md` (Portuguese). It is the source of
truth this codebase was built against — read it before making non-trivial
changes to the pipeline, blueprints, AI gateway, or data model. The `.dc.html`
files under `design_handoff_content_ai_studio/design/` are executable design
references (not production code); two of them — `Acervo Inteligente.dc.html`
and `Biblioteca de Blueprints.dc.html` — encode algorithms (asset scoring,
blueprint geometry) that were ported near-literally into `src/`.

`design_handoff_content_ai_studio/COLOCAR-NO-AR.md` and
`PASSO-A-PASSO-CLAUDE-CODE.md` are onboarding docs for the non-technical
client, not engineering docs — skip them unless asked about deployment
account setup.

## Commands

```bash
npm run dev            # Next.js dev server
npm run build           # production build
npm run lint            # eslint (next/core-web-vitals + next/typescript)
npm test                # vitest run — all tests, once
npx vitest run <path>    # single test file
npx vitest run -t "<name>"  # single test by name
npx tsc --noEmit         # type-check (strict mode, no dedicated script)
npm run render:server    # standalone Puppeteer render service (see below)
```

Tests are colocated as `*.test.ts` next to the code they cover (e.g.
`src/core/application/services/layout.service.test.ts`), not under a separate
`test/` tree. `vitest.config.ts` aliases `server-only` to
`test/stubs/server-only.ts` so server-only modules can be unit-tested outside
Next.js.

## Architecture

Clean Architecture, dependencies point inward. `core/domain` knows nothing
about Next.js, Supabase, or any AI provider.

```
src/
├── app/            routes, server actions, route handlers (App Router)
├── core/
│   ├── domain/      entities, value objects — client/ brandkit/ template/
│   │                project/ slide/ publication/ asset/, plus ports/
│   │                (AIProvider, *Repository, Publisher, Storage, Queue, Render)
│   └── application/
│       ├── use-cases/   one file = one use case
│       ├── services/    Research, Copy, Prompt, Image, Render, Retrieval, Layout, PipelineWorker
│       └── dto/          Zod schemas for input/output
├── infra/
│   ├── ai/          gateway.ts · registry.ts · fallback.ts · logger.ts · rate-limiter.ts
│   │                providers/  openrouter/ kimi/ gemini/ hf/ replicate/ fal/
│   ├── publishing/  channels/  export/ postiz/ instagram/
│   ├── render/      Puppeteer runner + standalone HTTP render service
│   ├── db/          Supabase client + repositories (one per domain port)
│   ├── queue/        adapter: inline | trigger.dev
│   └── storage/
├── templates/        blueprint geometry (8 archetypes), no visual identity
├── design-system/    tokens, shadcn primitives, compositions
├── config/           ai.ts · publishing.ts · queue.ts · features.ts · env.ts
└── shared/           Result<T,E>, AppError hierarchy, logger
```

### Non-negotiable rules (from the spec)

1. **Template ≠ Brand Kit.** A blueprint (`core/domain/template/blueprint.ts`)
   only describes geometry (grid, slots, scale) via `ColorRole`/`FontRole`
   references. The Brand Kit supplies the actual color/font/logo at render
   time as CSS custom properties. Never hardcode a color or font in a
   blueprint.
2. **No component talks to an AI API directly.** Everything goes through
   `AIGateway` (`src/infra/ai/gateway.ts`), obtained via
   `getAIGateway()` (`src/infra/ai/bootstrap.ts`), which is a per-process
   singleton (circuit breaker needs state across calls).
3. **Rendering is HTML.** Slides are real DOM + CSS vars, screenshotted with
   Puppeteer. Zero `<canvas>` drawing for slide content.
4. **Every AI response is validated by a Zod schema** before it touches the
   domain — see `AIGateway.generateStructured()`.
5. **Free tier first.** New providers are registered but disabled via
   `config/features.ts` until explicitly turned on; paid is fallback, never
   default.

### Result / error conventions

Application and infra code returns `Result<T, AppError>` (`src/shared/result.ts`)
instead of throwing for expected failure modes — use `ok()`/`err()`, check
with `result.ok`. `AppError` subclasses (`src/shared/errors.ts`:
`ValidationError`, `NotFoundError`, `AuthError`, `ConflictError`,
`ExternalServiceError`, `RateLimitError`, `AllProvidersFailedError`) each carry
a stable `code`. Use cases validate their DTO with a Zod schema first and
return `ValidationError` on failure before touching a repository.

### AI Gateway

`AIGateway` (`infra/ai/gateway.ts`) wraps `ProviderRegistry` (which providers
are enabled per `Capability`: `text | image | vision | embed`),
`FallbackPolicy` (per-provider circuit breaker), `AILogger` (writes to
`ai_logs`), and `RateLimiter` (budgets in `config/ai.ts`, three scopes:
user/org/provider). On failure it tries the next enabled provider in
`config/ai.ts`'s `fallbackOrder` and returns `AllProvidersFailedError` with
per-provider attempt details if all fail. Only OpenRouter is required for the
MVP; other providers are registered in `bootstrap.ts` but stay off via
`featureFlags` until a real key/decision turns them on.

### Pipeline

`PipelineWorker` (`core/application/services/pipeline-worker.service.ts`) runs
seven idempotent, checkpointed steps against a `Job`
(`core/domain/pipeline/job.ts`): research → copy → prompt → image → render →
publish → completed. Each step's output is written into `job.payload` before
`job.step` advances, so a crash mid-pipeline resumes from the failed step, not
from scratch. `SelectLayout` (`core/application/services/layout.service.ts`)
runs inside the `copy` step, before prompt/image, so archetype selection
happens before deciding which slides even need a generated image. The queue
adapter (`config/queue.ts`: `inline` | `trigger`) is swappable without
touching `PipelineWorker` or the use case that enqueues it — only `inline` is
implemented today (`infra/queue/inline-queue.ts`); `trigger.dev` throws
"not implemented" if selected.

### Blueprints (slide layout system)

8 archetypes under `src/templates/blueprints/` (`cover-centro`, `numerada`,
`citacao`, `dado`, `foto-total`, `lista-icone`, `evento`, `fecho`), each
exporting a `Blueprint` whose `slots(canvas)` returns geometry as a function of
canvas height — **never an absolute position** — so the same blueprint
reflows correctly at both 1080×1350 and 1080×1080. Shared geometry helpers
live in `templates/geometry.ts` (`band()`, `mid()`, `MARGIN = 80`). Every text
slot must be clamped via `templates/clamp.ts`'s `computeClamp()`, deriving
`maxLines` from `box.h / lineHeight` — this guards against AI-generated text
of unpredictable length overflowing into the chrome band; it was a real bug
twice during prototyping, so never rely on prompting to bound text length
instead.

### Rendering

`RenderService`/`RenderSlideUseCase` build a slide's HTML (blueprint + Brand
Kit as CSS vars + content), then Puppeteer (waiting on `document.fonts.ready`)
screenshots it to PNG, uploaded to Supabase Storage. This runs as a **separate
process** from the Next.js app because Vercel doesn't support headless
Chromium: `src/infra/render/server.ts` is a standalone HTTP service (see
`render:server` script and `Dockerfile.render`/`render.yaml`, deployed to
Render.com), invoked from the Next.js app via
`infra/render/http-render-slide-client.ts`
(`RENDER_SERVICE_URL`/`RENDER_SERVICE_TOKEN` in `config/env.ts`). The
Dockerfile runs it with `tsx --conditions=react-server` because shared infra
modules import `"server-only"`, which only resolves as a no-op outside
Next.js's webpack under that condition.

### Config module pattern

`src/config/*.ts` are the only place call sites should branch on
environment/flags — e.g. flip `featureFlags.aiProviderGemini` from `false` to
`true` in `config/features.ts` rather than special-casing a call site.
`config/env.ts` validates `process.env` through Zod (`serverSchema` /
`clientSchema`) at import time and throws with a readable Portuguese message
listing every missing/invalid var; `env` only runs server-side (`clientEnv`
runs everywhere, and only contains `NEXT_PUBLIC_*` values).

### Current implementation state

Git history implements the spec's "Ordem de implementação" blocks 1–6 (foundation,
AI Gateway, Client+Brand Kit, template engine, render service, pipeline). Blocks
7–10 (Acervo/RAG ingestion, slide editor, export channel, editorial calendar)
are not built yet — their domain folders exist only as `.gitkeep` placeholders
(`core/domain/asset`, `core/domain/publication`, `design-system`,
`infra/publishing/channels/*`). `src/app` currently only has the `(auth)` route
group (login/signup/callback) plus a root page — there is no dashboard UI yet.
Check `design_handoff_content_ai_studio/README.md`'s "Ordem de implementação"
table before assuming a feature exists.

### Data model

Postgres via Supabase, multi-tenant by `org_id` with Row Level Security on
every table (see `supabase/migrations/`). Never put API keys in the database.
Full table list and columns are documented in
`design_handoff_content_ai_studio/README.md` ("Modelo de dados").
