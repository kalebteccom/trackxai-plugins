# @trackxai/opencode

Track work in trackxai from OpenCode. Version 0.1.2.

The plugin adds the `trackxai` MCP server and the tracking guidance to OpenCode when it starts. It runs
no command. With `TRACKXAI_TOKEN` set it makes one request to the server it registered, to read the minimum
plugin version, and logs one warning when this plugin is older. Without a token it makes no request.

The `@trackxai` npm scope is owned. Version 0.1.0 of `@trackxai/opencode` is published on npm, and the
package is MIT licensed. The source manifest carries a private marker; the release pipeline removes it from
the published package. The Hermes Agent plugin is not published yet.

## Install

Add the package name to the `plugin` list in `opencode.json`:

```json
{ "plugin": ["@trackxai/opencode"] }
```

For a local checkout, list its built directory by path instead. The directory needs
`@trackxai/agent-plugins` resolvable from its `node_modules`.

## Sign in

Run `opencode mcp auth trackxai` and approve the page that opens. OpenCode registers itself with
trackxai, you pick a workspace on the consent page, and no token is pasted or written to a file. The plugin
adds the server with no header, so this is the default.

To use an Agent token instead, export `TRACKXAI_TOKEN` before OpenCode starts, with a token from the
trackxai Agent tokens page. The plugin then sends it as a bearer header and never writes it to a file.
OpenCode holds the resolved header in memory, and `opencode debug config` masks header values in current
releases. Check that before sharing its output from an older one.

## Without the plugin

Paste this under the top level of `opencode.json`. It holds no secret, and `opencode mcp auth trackxai`
signs in.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "trackxai": {
      "type": "remote",
      "url": "https://trackxai.kalebtec.com/mcp"
    }
  }
}
```

For a token instead, use this block. OpenCode fills `{env:TRACKXAI_TOKEN}` from the environment when it
reads the file, and `oauth: false` keeps it from opening a sign-in if the server rejects the token.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "trackxai": {
      "type": "remote",
      "url": "https://trackxai.kalebtec.com/mcp",
      "headers": {
        "Authorization": "Bearer {env:TRACKXAI_TOKEN}"
      },
      "oauth": false
    }
  }
}
```

The plugin skips itself when a `trackxai` server is already configured, from either block or from
anything else, and leaves that entry as it is.

## Self-hosted server

Set `TRACKXAI_MCP_URL` to your server's `/mcp` address. The plugin accepts `https` addresses, and plain
`http` only for localhost. Anything else registers nothing. In the block, change `url` instead.

## Update

Restart OpenCode after changing the package version in the `plugin` list. The guidance opens with a
`Plugin version:` line, and the block has nothing to update. When the server
asks for a newer plugin than this one, OpenCode's log carries one warning.

## Uninstall

1. Remove the plugin from the `plugin` list, and the `trackxai` entry from `mcp` if you added the block.
2. Run `opencode mcp logout trackxai` to clear a sign-in made through OAuth.
3. Unset `TRACKXAI_TOKEN`, and revoke the token on the Agent tokens page if you used one.
