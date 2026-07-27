import assert from "node:assert/strict";
import test from "node:test";

import {
  BUILT_IN_SAMPLE_ID_PATTERNS,
  BUILT_IN_SAMPLE_WHERE,
  isBuiltInSampleId,
} from "../lib/built-in-samples.ts";

test("limits sample cleanup to generated built-in IDs", () => {
  assert.deepEqual(
    [...BUILT_IN_SAMPLE_ID_PATTERNS],
    ["starter-%", "sample-%"],
  );
  assert.equal(BUILT_IN_SAMPLE_WHERE, "id LIKE ? OR id LIKE ?");
  assert.doesNotMatch(BUILT_IN_SAMPLE_WHERE, /filename/i);

  assert.equal(isBuiltInSampleId("starter-welcome"), true);
  assert.equal(isBuiltInSampleId("sample-official-protection-warrior"), true);
  assert.equal(isBuiltInSampleId("6e35ed2a-a460-42c5-b63b-b0cd7af8c943"), false);
  assert.equal(isBuiltInSampleId("user-upload-官方一键.json"), false);
});
