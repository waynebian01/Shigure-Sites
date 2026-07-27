import assert from "node:assert/strict";
import test from "node:test";

import { getModuleMetadata } from "../lib/module-metadata.ts";

test("reads class, specialization, party type, and hero talent metadata", () => {
  const metadata = getModuleMetadata({
    Author: "Shigure",
    Version: "2.0",
    Match: {
      ClassId: "1",
      SpecId: 3,
      PartyType: 46,
      HeroTalent: 1,
    },
  });

  assert.deepEqual(metadata, {
    author: "Shigure",
    version: "2.0",
    profession: "战士",
    specialization: "防护",
    partyType: "队伍",
    heroTalent: "巨神兵",
    hasClassSpecialization: true,
    classSpecializationError: null,
  });
});

test("reports missing and mismatched class metadata", () => {
  const missingMatch = getModuleMetadata({});
  assert.equal(
    missingMatch.classSpecializationError,
    "JSON 缺少 Match 对象，无法识别职业和专精",
  );

  const mismatched = getModuleMetadata({
    Match: { ClassId: 1, SpecId: 4 },
  });
  assert.equal(mismatched.hasClassSpecialization, false);
  assert.match(mismatched.classSpecializationError ?? "", /专精不存在/);
});
