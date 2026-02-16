# @maxmind/device-tracking

A thin TypeScript loader that validates inputs,
dynamically imports a remote fingerprinting module from MaxMind's servers, and
returns a device tracking token. Runs in the browser.

## Commands

```sh
pnpm test              # Jest (ESM via --experimental-vm-modules)
pnpm test:watch        # Jest in watch mode
pnpm run lint          # ESLint + tsc --noEmit
pnpm run build         # Clean build to dist/
pnpm run prettier:ts   # Format src/**/*.ts
```

Run a single test file:

```sh
pnpm test -- src/loader.spec.ts
```

Jest prints an `ExperimentalWarning` about VM Modules on every run. This is
expected and harmless.

## Architecture

```
src/
  index.ts          # Public API: trackDevice() with input validation
  loader.ts         # Singleton module loader with caching and timeout
  dynamic-import.ts # Thin wrapper around import() for test mocking
  types.ts          # TrackDeviceOptions, TrackResult interfaces
  *.spec.ts         # Co-located test files
```

- `index.ts` is the only public entry point (`package.json` exports map).
- `loader.ts` caches module promises per-host; clears cache on failure for retry.
- `dynamic-import.ts` exists solely to make `import()` mockable in Jest.
- Tests use `jest.unstable_mockModule` (ESM-compatible mocking).

## Conventions

- **ESM only** — `"type": "module"` in package.json, `.js` extensions in imports.
- **Strict TypeScript** — `strict: true`, target ES2022, module Node16.
- **Prettier** — single quotes, trailing commas (es5).
- **Formatting separate from logic** — keep style-only changes in their own commits.
- **`fixup!` commits** — prefix fixup commits with `fixup! <original subject>` for autosquash.
- **Error messages include context** — URLs, received values, types.
- **`@internal` JSDoc tag** — marks exports that exist only for testing (e.g. `resetModuleCache`).

## Testing notes

- Test environment is jsdom (browser globals).
- Tests co-locate next to source files (`*.spec.ts`).
- The `moduleNameMapper` in jest.config.js strips `.js` extensions for ts-jest.
- Loader tests use real dynamic import (which fails in Node) to exercise error paths.
- Mocked-module tests use `jest.unstable_mockModule` + dynamic `import()` to get fresh modules.
- Fake timers are used for timeout tests — always call `jest.useRealTimers()` in `afterEach`.

## Releasing

- Run `dev-bin/release.sh` from a **non-main** branch.
- The script parses `CHANGELOG.md` for the version, date, and release notes.
- **CHANGELOG.md format**: `VERSION (YYYY-MM-DD)` header, `---` underline, then bulleted notes. Date must be today.
- The script bumps `package.json` version automatically via `pnpm version` — do **not** update it by hand.
- After confirmation it commits, pushes, and creates a GitHub release.
- The `release.yml` workflow triggers on the GitHub release event and publishes to npm.

## Tooling

- **mise** manages Node, pnpm, and precious versions (see `mise.toml`).
- **precious** is the code-quality runner (config: `.precious.toml`).
- **Git hooks** live in `.githooks/`. Enable with: `git config core.hooksPath .githooks`
- GitHub Actions: test, lint, CodeQL, zizmor, release workflows.
