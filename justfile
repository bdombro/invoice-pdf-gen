# A justfile task runner, see https://just.systems

# List recipes (default)
_:
    @just --list

# Build all binaries and bundle to dist/
build: build-bin build-bundle

# Produce a standalone binaries under dist/
build-bin: dependencies
    # bun build ./src/index.tsx --compile --outfile=dist/invoice-pdf-gen
    bun build --compile --target=bun-linux-x64 ./src/index.tsx --outfile dist/invoice-pdf-gen-linux
    bun build --compile --target=bun-darwin-arm64 ./src/index.tsx --outfile dist/invoice-pdf-gen-macos
    @rm -f .*.bun-build

# Produce a bundled JS file
build-bundle: dependencies
    mkdir -p dist
    bun build ./src/index.tsx --target=bun --outfile=dist/invoice-pdf-gen.js

# Install dependencies
dependencies:
    bun install

# format the codebase
format:
    bun x biome format ./src ./scripts --write

# lint the codebase
lint:
    bun x biome check ./src ./scripts

# Bump version, build, commit, tag, and publish a GitHub release
release bump: build
    bun scripts/release.ts {{bump}}

# Run the unbundled JS file (forward args after `--`, e.g. `just run -- -o invoice.pdf`)
run *args:
    bun src/index.tsx {{args}}

# Run the bundled JS file
run-bundled *args: build-bundle
    bun dist/invoice-pdf-gen.js {{args}}

# Run the standalone binary
run-binary *args: build-bin
    bun dist/invoice-pdf-gen-macos {{args}}

# Run tests
test: typecheck lint
    bun test ./src

# Typecheck without emitting (uses tsconfig.json)
typecheck:
    bun x tsc --noEmit