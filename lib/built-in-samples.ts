export const BUILT_IN_SAMPLE_ID_PATTERNS = ["starter-%", "sample-%"] as const;

export const BUILT_IN_SAMPLE_WHERE = BUILT_IN_SAMPLE_ID_PATTERNS
  .map(() => "id LIKE ?")
  .join(" OR ");

export function isBuiltInSampleId(id: string) {
  return BUILT_IN_SAMPLE_ID_PATTERNS.some((pattern) =>
    id.startsWith(pattern.slice(0, -1)),
  );
}
