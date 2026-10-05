/** The MCP server, the plugin and the skill all carry this name, so rendered tool names stay short. */
export declare const SERVER_NAME = "trackxai";
export declare const DEFAULT_MCP_URL = "https://trackxai.kalebtec.com/mcp";
/** Overrides the URL for a local or self-hosted server. `scripts/mcp-call.sh` reads the same name. */
export declare const MCP_URL_ENV_VAR = "TRACKXAI_MCP_URL";
export declare const TOKEN_ENV_VAR = "TRACKXAI_TOKEN";
/** Some model APIs refuse a tool name longer than this. */
export declare const MAX_TOOL_NAME_LENGTH = 64;
/** The sidecar every artefact carries: the hash of the guidance source it was compiled from. */
export declare const GUIDANCE_HASH_FILE = "guidance.sha256";
/** A harness id names a directory under `dist/`. The compiler's own output sits under an id no harness can have. */
export declare const HARNESS_ID_PATTERN: RegExp;
/** Published plugin artefacts carry MIT. The trackxai source stays proprietary and is not covered by it. */
export declare const PLUGIN_LICENSE = "MIT";
export declare const LICENSE_FILE = "LICENSE";
/** The npm scope. The scope is owned, and no package under it is published yet. */
export declare const NPM_SCOPE = "@trackxai";
/** The public repository the release pipeline will publish the artefacts to. */
export declare const PLUGINS_REPO_URL = "git+https://github.com/kalebteccom/trackxai-plugins.git";
export declare const PLUGINS_REPO_HOMEPAGE = "https://github.com/kalebteccom/trackxai-plugins";
