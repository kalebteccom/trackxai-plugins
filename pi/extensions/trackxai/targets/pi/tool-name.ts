import { TOOL_NAME_PREFIX } from "./limits.js";

/** `workspace.list` becomes `trackxai_workspace_list`: model APIs reject a dot in a tool name. */
export const piToolName = (tool: string): string => `${TOOL_NAME_PREFIX}${tool.replaceAll(".", "_")}`;
