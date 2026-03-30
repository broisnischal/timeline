# Workflow

## Build Commands

- `bun run build`: Only for build/bundler issues or verifying production output
- `bun run lint`: Type-checking & type-aware linting
- `bun run dev` runs indefinitely in watch mode
- `bun run db` for Drizzle Kit commands (e.g. `bun run db generate` to generate a migration)

Don't build after every change. If lint & type checks pass; assume changes work.

## TanStack CLI

Use `bun run tanstack` (which is aliased to `bunx @tanstack/cli@latest` in `package.json`) to look up TanStack documentation. Always pass `--json` for machine-readable output.

```bash
# List TanStack libraries (optionally filter by --group state|headlessUI|performance|tooling)
bun run tanstack libraries --json

# Fetch a specific doc page
bun run tanstack doc router framework/react/guide/data-loading --json
bun run tanstack doc query framework/react/overview --docs-version v5 --json

# Search docs (optionally filter by --library, --framework, --limit)
bun run tanstack search-docs "server functions" --library start --json
bun run tanstack search-docs "loaders" --library router --framework react --json
```

## Testing

No testing framework is currently set up. Prefer lint checks for now.

## Formatting

Oxfmt is configured for consistent code formatting via `bun run format`. It runs automatically on commit via Husky pre-commit hooks, so manual formatting is not necessary.
