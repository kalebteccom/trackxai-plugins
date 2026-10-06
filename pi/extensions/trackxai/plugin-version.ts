/** The prefix of the brief's minimum-version line. A test holds it equal to the guidance package's. */
export const MINIMUM_VERSION_LINE_PREFIX = "Minimum plugin version: ";

const VERSION_SHAPE = /^\d+\.\d+\.\d+$/;

/** The version after the first `Minimum plugin version:` line in `text`, or undefined when none carries a well-formed one. */
export const minimumVersionIn = (text: string): string | undefined => {
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith(MINIMUM_VERSION_LINE_PREFIX)) continue;
    const version = line.slice(MINIMUM_VERSION_LINE_PREFIX.length).trim();
    return VERSION_SHAPE.test(version) ? version : undefined;
  }
  return undefined;
};

const partsOf = (version: string): readonly number[] => version.split(".").map(Number);

/** True when `version` sorts below `minimum`, comparing major, minor and patch as integers. Anything malformed is not older. */
export const isOlderVersion = (version: string, minimum: string): boolean => {
  if (!VERSION_SHAPE.test(version) || !VERSION_SHAPE.test(minimum)) return false;
  const have = partsOf(version);
  const want = partsOf(minimum);
  for (let index = 0; index < 3; index += 1) {
    const difference = (have[index] ?? 0) - (want[index] ?? 0);
    if (difference !== 0) return difference < 0;
  }
  return false;
};

/** The one line a code-bearing plugin shows when the server asks for a newer plugin. */
export const outdatedNotice = (harness: string, version: string, minimum: string): string =>
  `trackxai: this plugin is ${version} and the server asks for ${minimum} or later. Update it and restart ${harness}.`;
