export const MODULE_HEADER_KEYS = ["Id", "Name", "Author", "Version", "Enabled"] as const;

export type ModuleHeader = {
  Id: unknown;
  Name: unknown;
  Author: unknown;
  Version: unknown;
  Enabled: unknown;
};

export type ModuleValidation =
  | { ok: true; content: Record<string, unknown>; header: ModuleHeader }
  | { ok: false; error: string };

export function validateModuleJson(text: string): ModuleValidation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "文件不是有效的 JSON 格式" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "JSON 顶层必须是一个对象" };
  }

  const content = parsed as Record<string, unknown>;
  const missingKeys = MODULE_HEADER_KEYS.filter((key) => !Object.prototype.hasOwnProperty.call(content, key));
  if (missingKeys.length > 0) {
    return { ok: false, error: `JSON 缺少必需字段：${missingKeys.join("、")}` };
  }

  return {
    ok: true,
    content,
    header: {
      Id: content.Id,
      Name: content.Name,
      Author: content.Author,
      Version: content.Version,
      Enabled: content.Enabled,
    },
  };
}
