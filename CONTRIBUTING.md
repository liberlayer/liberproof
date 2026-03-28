# Contributing to LiberProof

Thank you for your interest in contributing. LiberProof is AGPL v3 — all contributions must be compatible with this license.

## Getting Started

```bash
git clone https://github.com/liberlayer/liberproof.git
cd liberproof
pnpm install
pnpm build
pnpm --filter @liberproof/core test
```

## Project Structure

```
packages/core      — Cryptographic primitives, types, attestations, notarization
packages/zk        — ZK proof circuits and generation
packages/anchors   — Chain anchoring adapters
packages/sdk       — Unified consumer API

apps/api           — Hono REST API (Node.js + SQLite)
apps/verify        — Public proof verification viewer (React/Vite)
apps/app           — Dashboard UI (React/Vite)

infra/             — NGINX, PM2, Docker configs
```

## Development Workflow

```bash
# Run API in dev mode
pnpm dev:api

# Run verify app in dev mode
pnpm dev:verify

# Run dashboard in dev mode
pnpm dev:app

# Run all tests
pnpm test

# Type check everything
pnpm typecheck
```

## Contribution Areas

### High Priority
- **EVM anchor verification** — implement `EvmAnchorAdapter.verify()` using a subgraph or direct tx fetch
- **Liberland anchor verification** — implement `LiberlandAnchorAdapter.verify()` using the txHash
- **ZK circuits** — additional circuits beyond `ageProof.circom` (e.g. membershipProof, balanceRangeProof)
- **On-chain anchoring in the API** — wire up `POST /notarizations/:id/anchor` route
- **LiberVault signing integration** — full SDK signing from the browser extension via `window.liberProof`

### Good First Issues
- Add pagination to `/notarizations` and `/attestations` list endpoints
- Add `expiresAt` filter to attestations query
- Add dark/light mode toggle to verify and app UIs
- Write integration tests for the API routes

## Code Standards

- **TypeScript strict mode** — all code must pass `tsc --strict`
- **Noble crypto only** — use `@noble/hashes` and `@noble/curves` for all crypto, no Web Crypto API in packages
- **No external HTTP calls** in `@liberproof/core` — it must work fully offline
- **AGPL v3 header** in all new source files:

```ts
/**
 * LiberProof — [filename]
 * Copyright (C) 2025 LiberLayer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
```

## Pull Request Process

1. Branch from `develop` (not `main`)
2. Keep PRs focused — one feature or fix per PR
3. Add/update tests for any changed behavior
4. Ensure `pnpm typecheck` and `pnpm test` pass
5. Update `CHANGELOG.md` if applicable
6. Request review from a maintainer

## Security

Found a vulnerability? Please **do not open a public issue**. Email `security@liberlayer.com` with details.

## License

By contributing, you agree that your contributions will be licensed under AGPL v3, consistent with the project's license.
