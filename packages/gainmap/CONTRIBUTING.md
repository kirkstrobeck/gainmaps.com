# Contributing to gainmap

Contributions are welcome.

Repository: https://github.com/kirkstrobeck/gainmaps.com

This package is the `gainmap` CLI (`packages/gainmap`). Issues and pull requests are appreciated — small, focused changes are easiest to review.

## Develop

```sh
git clone https://github.com/kirkstrobeck/gainmaps.com.git
cd gainmaps.com
pnpm install
pnpm --filter gainmap test
pnpm --filter gainmap build
```

Tests must stay at 100% coverage.

## Style

- No `let`. No control-flow mutation. No `else` — prefer early returns and small functions.
- Import via `#src/...`, not relative paths.
- `export default` functions are named `Base`.
