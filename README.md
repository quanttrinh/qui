# qui workspace

Monorepo for the `qui` Material Design 3 web components.

| Package                                           | Purpose                                                   |
| ------------------------------------------------- | --------------------------------------------------------- |
| [`@quanttrinh/qui`](./packages/qui)               | Web components, SSR, runtime, theme and component CSS     |
| [`@quanttrinh/qui-unplugin`](./packages/unplugin) | Bundler plugin for auto-registration and stylesheet setup |

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

Run `bun run build` before hydrate-based suites. Plugin tests do not require a prior build.

See [`packages/qui/README.md`](./packages/qui/README.md) for installation,
components, styling, SSG/SSR, and Panda integration.
