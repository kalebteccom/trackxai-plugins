/**
 * The slice of Pi's extension API this package calls, written from the Pi
 * extension docs at the pinned version. Pi supplies the real objects at load,
 * so no Pi package is imported and none is a dependency.
 */

export type PiLevel = "info" | "warning" | "error";

export type PiContext = {
  readonly cwd: string;
  readonly hasUI: boolean;
  readonly ui: { readonly notify: (message: string, level?: PiLevel) => void };
};

export type PiToolResult = {
  readonly content: readonly { readonly type: "text"; readonly text: string }[];
  readonly details: unknown;
};

export type PiToolDefinition = {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly promptSnippet: string;
  /** A JSON Schema object. Pi validates a call's arguments against it. */
  readonly parameters: Readonly<Record<string, unknown>>;
  /** Throws to report a failed call. */
  readonly execute: (
    toolCallId: string,
    params: Readonly<Record<string, unknown>>,
    signal: AbortSignal | undefined,
  ) => Promise<PiToolResult>;
};

export type PiApi = {
  readonly registerTool: (tool: PiToolDefinition) => void;
  readonly on: {
    (event: "session_start", handler: (event: unknown, ctx: PiContext) => Promise<void> | void): unknown;
    (event: "session_shutdown", handler: (event: unknown, ctx: PiContext) => Promise<void> | void): unknown;
    (
      event: "before_agent_start",
      handler: (event: { readonly systemPrompt: string }) => { readonly systemPrompt: string } | undefined,
    ): unknown;
  };
};
