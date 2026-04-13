# Linearis

CLI tool for [Linear.app](https://linear.app) optimized for AI agents. JSON output, smart ID resolution, token-efficient usage commands, and a discover-then-act workflow that keeps agent context small. Works just as well for humans who prefer structured data on the command line.

## Why?

The official Linear MCP works fine, but it eats up ~13k tokens just by being connected -- before the agent does anything. Linearis takes a different approach: instead of exposing the full API surface upfront, agents discover what they need through a two-tier usage system. `linearis usage` gives an overview in ~200 tokens, then `linearis <domain> usage` provides the full reference for one area in ~300-500 tokens. A typical agent interaction costs ~500-700 tokens of context, not ~13k.

The trade-off is coverage. An MCP exposes the entire Linear API; Linearis covers the operations that matter for day-to-day work with issues, comments, cycles, documents, and files. If you need to manage custom workflows, integrations, or workspace settings, the MCP is the better choice.

**This project scratches my own itches,** and satisfies my own usage patterns of working with Linear: I **do** work with tickets/issues and comments on the command line; I **do not** manage projects or workspaces etc. there. YMMV.

## Installation

This is a private fork of [linearis-oss/linearis](https://github.com/linearis-oss/linearis). Install it directly from GitHub:

```bash
# If a previous version is installed globally, remove it first
npm uninstall -g linearis

# Install this fork globally
npm install -g github:pwen-ventures/linearis

# Verify
which linearis && linearis --version
```

Pin to a specific branch/tag/commit by appending `#<ref>`:

```bash
npm install -g github:pwen-ventures/linearis#main
```

Requires Node.js >= 22 and SSH access to the (private) fork repository.

> **Note for this fork:** Unlike the upstream project, this fork commits generated artifacts (`dist/`, `src/gql/`, `USAGE.md`) to git. This keeps `npm install -g github:...` reliable — no codegen or TypeScript build runs during install. The cost is that you must regenerate and rebuild before committing changes. See **Updating after code changes** below.

### Updating after code changes

Because the fork ships prebuilt artifacts, changes to `src/` are **not** reflected in the global `linearis` until you rebuild and commit the new `dist/`. The workflow:

```bash
cd /path/to/linearis

# 1. Pull or make your changes
git pull                                              # from your fork (origin)
# or: git fetch upstream && git merge upstream/main   # from linearis-oss

# 2. If dependencies changed (package.json / package-lock.json)
npm install

# 3. If GraphQL schema/operations changed (graphql/**/*.graphql)
npm run generate

# 4. Rebuild (this also runs generate and generate:usage via prebuild)
npm run build

# 5. Commit the regenerated artifacts alongside your source changes
git add src/gql dist USAGE.md
git commit -m "chore: rebuild dist"
git push

# 6. Reinstall globally to pick up the new build
npm install -g github:pwen-ventures/linearis
```

**Tip:** If you forget to rebuild before pushing, the installed CLI will run stale code even though the source in git is up to date. Consider adding a pre-push hook or a release checklist.

### First-time dev setup (for contributors to this fork)

After cloning for local development, run:

```bash
npm install
npm run dev:setup    # runs codegen + installs lefthook git hooks
```

(The upstream project used a `prepare` hook for this, but we removed it so that `npm install -g github:...` doesn't try to run dev tools.)

## Authentication

Linearis authenticates against the Linear GraphQL API using an **OAuth application developer token**. Create one in Linear, then log in:

### 1. Create an OAuth application in Linear

1. Open Linear and go to **Settings → API → OAuth Applications**.
2. Click **Create new** and fill in the required fields (name, icon, callback URL — any valid URL works if you won't complete an OAuth flow).
3. After saving, open the application and **copy the developer token**. This token authenticates as the application itself and is all the CLI needs — no full OAuth redirect flow required.

> The developer token shown on the OAuth application page is scoped to your workspace and acts like a long-lived API token for the app. Treat it as a secret.

### 2. Log in to the CLI

```bash
linearis auth login
```

This prompts for the token, encrypts it, and stores it in `~/.linearis/token`.

Alternatively, provide the token directly:

```bash
# Via CLI flag
linearis --api-token <token> issues list

# Via environment variable
LINEAR_API_TOKEN=<token> linearis issues list
```

Token resolution order: `--api-token` flag > `LINEAR_API_TOKEN` env > `~/.linearis/token` > `~/.linear_api_token` (deprecated).

### OAuth Actor Authorization (optional)

If the OAuth application was authorized with `actor=app`, created issues/comments are attributed to the application itself rather than a user. You can attach a display name and avatar (rendered as _Name (via Application)_ in Linear) by setting:

- `LINEAR_CREATE_AS_USER` — display name for the acting user
- `LINEAR_DISPLAY_ICON_URL` — URL of the avatar image

These are applied automatically to `issues create`, `comments create`, and `comments reply`. They have no effect when authenticating with a personal API token. Explicit input values in the mutation override the env defaults.

## Usage

All output is JSON. Pipe through `jq` or similar for formatting.

```bash
# Discovery
linearis usage                # overview of all domains
linearis issues usage         # detailed usage for one domain
```

### Quick Start

```bash
# Discover available commands
linearis usage

# Drill into a domain
linearis issues usage

# List recent issues
linearis issues list --limit 10

# Search for issues
linearis issues search "authentication bug"

# Create an issue
linearis issues create "Fix login flow" --team Platform --priority 2

# Add a comment
linearis comments create ENG-42 --body "Investigating this now"
```

For the full reference of every command and flag, run:

```bash
linearis <domain> usage
```

## AI Agent Integration

### How agents use Linearis

The CLI is structured around a discover-then-act pattern that matches how agents work:

1. **Discover** -- `linearis usage` returns a compact overview of all domains (~200 tokens). The agent reads this once to understand what's available.
2. **Drill down** -- `linearis <domain> usage` gives the full command reference for one domain (~300-500 tokens). The agent only loads what it needs.
3. **Execute** -- All commands return structured JSON. No parsing of human-readable tables or prose.

This means the agent never loads the full API surface into context. It pays for what it uses, one domain at a time.

### Linearis vs. MCP

| | Linearis | Linear MCP |
|---|---|---|
| Context cost | ~500-700 tokens per interaction | ~13k tokens on connect |
| Coverage | Common operations (issues, comments, cycles, docs, files) | Full Linear API |
| Output | JSON via stdout | Tool call responses |
| Setup | `npm install -g linearis` + bash tool | MCP server connection |

Use Linearis when token efficiency matters and you work primarily with issues and related data. Use the MCP when you need full API coverage or tight tool-call integration.

### Example prompt

```markdown
## Linear (project management)

Tool: `linearis` CLI via Bash. All output is JSON.

Discovery: Run `linearis usage` once to see available domains. Run `linearis <domain> usage` for full command reference of a specific domain. Do NOT guess flags or subcommands -- check usage first.

Ticket format: "ABC-123". Always reference tickets by their identifier.

Workflow rules:
- When creating a ticket, ask the user which project to assign it to if unclear.
- For subtasks, inherit the parent ticket's project by default.
- When a task in a ticket description changes status, update the description.
- For progress beyond simple checkbox changes, add a comment instead of editing the description.

File handling: `issues read` returns an `embeds` array with signed download URLs and expiration timestamps. Use `files download` to retrieve them. Use `files upload` to attach new files, then reference the returned URL in comments or descriptions.
```

Add this (or a version adapted to your workflow) to your `AGENTS.md` or `CLAUDE.md` so every agent session has it in context automatically.

## Contributing

Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md).

## Creator

Carlo Zottmann -- [c.zottmann.dev](https://c.zottmann.dev) | [github.com/czottmann](https://github.com/czottmann)

Carlo created Linearis and drove its early development. As interest in the project grew, he handed maintenance over to [Fabian Jocks](https://github.com/iamfj) ([in/fabianjocks](https://linkedin.com/in/fabianjocks)).

This project is neither affiliated with nor endorsed by Linear.

### Sponsoring Carlo's work

Carlo doesn't accept sponsoring in the "GitHub sponsorship" sense[^1] but [next to his own apps, he also sells "Tokens of Appreciation"](https://actions.work/store/?ref=github). Any support is appreciated!

[^1]: Apparently, the German revenue service is still having some fits over "money for nothing??".

> [!TIP]
> Carlo makes Shortcuts-related macOS & iOS productivity apps like [Actions For Obsidian](https://actions.work/actions-for-obsidian), [Browser Actions](https://actions.work/browser-actions) (which adds Shortcuts support for several major browsers), and [BarCuts](https://actions.work/barcuts) (a surprisingly useful contextual Shortcuts launcher). Check them out!

## Contributors

<a href="https://github.com/linearis-oss/linearis/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=linearis-oss/linearis" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## License

MIT. See [LICENSE.md](LICENSE.md).
