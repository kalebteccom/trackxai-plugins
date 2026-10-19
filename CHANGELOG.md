# Changelog

Release notes for the trackxai plugins. This file is the source of the public repository's
`CHANGELOG.md`, which the export copies as it is. A release adds its section here first, headed
`## <version>`: the export fails when the section for the version being released is missing.

## 0.1.2

- The Claude Code plugin folder carries `.claude-plugin/icon.png`, a square 1024 px PNG, and the
  manifest names its privacy policy in `privacyPolicyUrl`. The Claude plugin directory asked for
  both. The README shows the icon under its title.

## 0.1.1

- The Claude Code plugin folder carries a `README.md` with the install commands, what the plugin
  sends, the privacy notice and the support address, which the Claude plugin directory reads from a
  submitted plugin.
- The skill guidance covers task priority: a task stays at no priority unless a person names one,
  and `task.create`, `task.update` and `task.list` take it.
- The guidance explains `task.list` paging: a call answers at most 200 tasks, an answer cut short
  says `truncated: true` and carries `nextCursor`, and the next call passes it back as `cursor` with
  the same filters.
- The guidance tells an agent to put what it will do unanswered in `proposedDefault` and when in
  `proceedsAt` when it raises a question.
- The guidance names the answered-gap line an agent reads once a person answers its gap, and where
  `gap.get`, `inbox.read` and `changes.since` catch up on it.
- The generated OpenCode README says `@trackxai/opencode` is published on npm.

## 0.1.0

First release. Claude Code and Codex install from this repository.

- Claude Code plugin: the trackxai MCP server, the tracking skill and a `url` option for a
  self-hosted server. Install it with `claude plugin marketplace add kalebteccom/trackxai-plugins`
  and `claude plugin install trackxai@trackxai`.
- Codex plugin: the same server and skill. Install it with
  `codex plugin marketplace add kalebteccom/trackxai-plugins` and
  `codex plugin add trackxai@trackxai`.
- Both sign in through the harness's own MCP sign-in, in your browser. The plugin files hold no
  token.
- OpenCode, Pi and Hermes Agent plugins and the `trackxai login` command are in the tree. The npm
  packages `@trackxai/opencode`, `@trackxai/pi` and `@trackxai/agent-plugins` are published; install
  OpenCode and Pi by package name, and use `trackxai login` for sign-in.
- MIT licensed.
