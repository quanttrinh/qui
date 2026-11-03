# qui workspace

Monorepo for the `qui` Material Design 3 web components.

| Package                                           | Purpose                                                   |
| ------------------------------------------------- | --------------------------------------------------------- |
| [`@quanttrinh/qui`](./packages/qui)               | Web components, SSR, runtime, theme and component CSS     |
| [`@quanttrinh/qui-unplugin`](./packages/unplugin) | Bundler plugin for auto-registration and stylesheet setup |

## Commit messages

This repository uses [Conventional Commits](https://www.conventionalcommits.org/)
for every change that lands on `main`:

```
<type>(<optional scope>): <description>
```

Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`,
`refactor`, `revert`, `style`, `test`.

Examples:

```
feat(qui): add button variant
fix: prevent duplicate registration
chore(deps): update dependency oxlint to v1.89.0
```

Because pull requests are squash-merged, the PR title becomes the commit
message. The `Commit Message / PR title` check validates it, and the local
`commit-msg` hook validates individual commits before they are created.

Keep the repository's merge settings on **Squash and merge** only, with the
squash commit message defaulting to the **pull request title**. Bots follow the
same format: Renovate is configured with semantic commits, the Changesets
release PR is titled `chore: version packages`, and the AI PR description
workflow generates a Conventional Commit title.

## Development

```sh
bun install

bun run build       # build both packages
bun run test:unit   # run both unit suites
bun run lint
bun run fmt:check
```

Package-specific commands:

```sh
bun run --cwd packages/qui dev
bun run --cwd packages/qui build
bun run --cwd packages/unplugin build
```

Run `bun run build` before hydrate-based suites. Plugin tests do not require a prior build. The framework type check reads the built declarations, so run `bun run build` before `bun run test` as well.

See [`packages/qui/README.md`](./packages/qui/README.md) for installation,
components, styling, SSG/SSR, and Panda integration.
