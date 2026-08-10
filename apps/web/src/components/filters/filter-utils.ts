/**
 * Filter keys removed since the last apply must be sent as '' — consumers merge
 * updates into the existing URL params, so an omitted key would otherwise stick.
 */

export function withClearedKeys(
  previous: Record<string, string>,
  next: Record<string, string>
): Record<string, string> {
  const result = { ...next };
  for (const key of Object.keys(previous)) {
    if (!(key in result)) {
      result[key] = '';
    }
  }
  return result;
}
