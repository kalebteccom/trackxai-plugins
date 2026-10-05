import { MAX_RESULT_CHARS } from "./limits.js";
import type { McpCallResult, McpTool } from "./mcp-client.js";
import type { PiToolDefinition, PiToolResult } from "./pi-types.js";
import { piToolName } from "./tool-name.js";

export type CallTool = (
  name: string,
  args: Readonly<Record<string, unknown>>,
  signal?: AbortSignal,
) => Promise<McpCallResult>;

const firstSentence = (text: string): string => {
  const end = text.search(/[.!?](\s|$)/);
  return (end === -1 ? text : text.slice(0, end + 1)).trim();
};

/** A model-facing text: text blocks as they are, any other block named by its type, cut at the ceiling. */
export const resultText = (result: McpCallResult): string => {
  const text = result.content
    .map((block) => (block.type === "text" ? (block.text ?? "") : `[${block.type} content omitted]`))
    .join("\n");
  return text.length <= MAX_RESULT_CHARS
    ? text
    : `${text.slice(0, MAX_RESULT_CHARS)}\n[truncated at ${MAX_RESULT_CHARS} characters]`;
};

const parametersOf = (schema: McpTool["inputSchema"]): Record<string, unknown> => {
  const { $schema: _dropped, ...rest } = schema;
  return rest["type"] === "object" ? rest : { type: "object", properties: {}, ...rest };
};

/** One server tool as a Pi tool. A tool-level error from the server becomes a thrown error, which Pi shows as a failed call. */
export const toPiTool = (tool: McpTool, call: CallTool): PiToolDefinition => {
  const name = piToolName(tool.name);
  const description = tool.description ?? tool.title ?? tool.name;
  return {
    name,
    label: tool.title ?? tool.name,
    description,
    promptSnippet: `${name}: ${firstSentence(description)}`,
    parameters: parametersOf(tool.inputSchema),
    execute: async (_toolCallId, params, signal): Promise<PiToolResult> => {
      const result = await call(tool.name, params, signal);
      const text = resultText(result);
      if (result.isError) throw new Error(text === "" ? `${tool.name} failed.` : text);
      return { content: [{ type: "text", text }], details: { tool: tool.name } };
    },
  };
};
