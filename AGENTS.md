# Project Conventions

## Formatting

This project uses **Prettier** for consistent code formatting.

- **Format all files**: `bun run format`
- **Check formatting**: `bun run format:check`
- **Auto-format on commit**: A pre-commit hook (`./git/hooks/pre-commit`) formats staged files with prettier before each commit. Bypass with `PRETTIER_SKIP_HOOK=1 git commit`.
- **Convenience script**: `./scripts/format.sh`

After making any changes, always run `bun run format` before committing.
