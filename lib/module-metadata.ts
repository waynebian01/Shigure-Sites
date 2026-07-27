const UNKNOWN = "未知";

const classNames: Record<number, string> = {
  1: "战士",
  2: "圣骑士",
  3: "猎人",
  4: "潜行者",
  5: "牧师",
  6: "死亡骑士",
  7: "萨满祭司",
  8: "法师",
  9: "术士",
  10: "武僧",
  11: "德鲁伊",
  12: "恶魔猎手",
  13: "唤魔师",
};

const specializationNames: Record<number, Record<number, string>> = {
  1: { 1: "武器", 2: "狂怒", 3: "防护" },
  2: { 1: "神圣", 2: "防护", 3: "惩戒" },
  3: { 1: "野兽控制", 2: "射击", 3: "生存" },
  4: { 1: "奇袭", 2: "狂徒", 3: "敏锐" },
  5: { 1: "戒律", 2: "神圣", 3: "暗影" },
  6: { 1: "鲜血", 2: "冰霜", 3: "邪恶" },
  7: { 1: "元素", 2: "增强", 3: "恢复" },
  8: { 1: "奥术", 2: "火焰", 3: "冰霜" },
  9: { 1: "痛苦", 2: "恶魔学识", 3: "毁灭" },
  10: { 1: "酒仙", 2: "织雾", 3: "踏风" },
  11: { 1: "平衡", 2: "野性", 3: "守护", 4: "恢复" },
  12: { 1: "浩劫", 2: "复仇", 3: "噬灭" },
  13: { 1: "湮灭", 2: "恩护", 3: "增辉" },
};

export type ModuleMetadata = {
  author: string;
  version: string;
  profession: string;
  specialization: string;
  hasClassSpecialization: boolean;
};

function textOrUnknown(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : UNKNOWN;
}

function numberOrNull(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) ? number : null;
}

export function getModuleMetadata(content: Record<string, unknown>): ModuleMetadata {
  const match = content.Match;
  const matchRecord = match && typeof match === "object" && !Array.isArray(match)
    ? match as Record<string, unknown>
    : null;
  const classId = numberOrNull(matchRecord?.ClassId);
  const specId = numberOrNull(matchRecord?.SpecId);
  const profession = classId === null ? undefined : classNames[classId];
  const specialization = classId === null || specId === null ? undefined : specializationNames[classId]?.[specId];

  return {
    author: textOrUnknown(content.Author),
    version: textOrUnknown(content.Version),
    profession: profession ?? UNKNOWN,
    specialization: specialization ?? UNKNOWN,
    hasClassSpecialization: Boolean(profession && specialization),
  };
}
