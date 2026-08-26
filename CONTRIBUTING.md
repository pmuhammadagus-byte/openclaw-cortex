# Contributing to Cortex

Thanks for helping make OpenClaw smarter.

## Development
- Node.js ≥ 18, OpenClaw plugin SDK (2026.7.1+).
- Install deps: `npm install`
- Build: `node ./node_modules/typescript/bin/tsc`
- Inspect before publishing: `clawhub package inspect .`

## Rules
1. **Public API only.** Register hooks with a `name` (`api.registerHook(events, handler, { name, description })`); the loader rejects unnamed hooks. CLI uses `ctx.program.command(...)`, not `registrar.registerCommand`.
2. **Hook handlers return `void`.** Do not return `{ action: "revise" }` / `{ appendContext }` — those formats are from older OpenClaw versions and will fail to load.
3. **No hardcoded secrets.** Keep cognitive prompts and configs free of tokens/keys.
4. **TypeScript strict.** `tsc` must pass with zero errors before a PR is merged.

## Reporting issues
Open an issue with: OpenClaw version, plugin version, and the exact tool/command you ran.
