# @trackxai/agent-plugins

Version 0.1.2. The trackxai sign-in command and the registration helper the trackxai plugins for Pi and
OpenCode import. It runs no code at install time.

```
npx @trackxai/agent-plugins login --harness <name>
```

`login` asks the trackxai server for a code, prints and opens the page where you approve it, and writes the
resulting token to `trackxai.env` in the harness's profile directory with mode 0600. The token is never printed.
`--harness` takes the harness id: `claude-code`, `codex`, `hermes`, `opencode` or `pi`.

`@trackxai/agent-plugins/register-once` exports `registerOnce`, which leaves an existing `trackxai` server entry untouched.

MIT licensed. Generated from the trackxai release pipeline, so changes made here are overwritten.
