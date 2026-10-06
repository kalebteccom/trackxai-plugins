# Changelog

Release notes for the trackxai plugins. This file is the source of the public repository's
`CHANGELOG.md`, which the export copies as it is. A release adds its section here first, headed
`## <version>`: the export fails when the section for the version being released is missing.

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
  packages `@trackxai/opencode`, `@trackxai/pi` and `@trackxai/agent-plugins` are not published yet,
  so install none of those from the registry.
- MIT licensed.
