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

const heroTalentNames: Record<string, string> = {
  "1:1:1": "巨神兵",
  "1:1:2": "屠戮者",
  "1:2:2": "屠戮者",
  "1:2:3": "山丘领主",
  "1:3:1": "巨神兵",
  "1:3:3": "山丘领主",
  "2:1:1": "烈日先驱",
  "2:1:2": "铸光者",
  "2:2:1": "铸光者",
  "2:2:3": "圣殿骑士",
  "2:3:1": "烈日先驱",
  "2:3:3": "圣殿骑士",
  "3:1:1": "黑暗游侠",
  "3:1:2": "猎群领袖",
  "3:2:1": "黑暗游侠",
  "3:2:3": "哨兵",
  "3:3:1": "猎群领袖",
  "3:3:3": "哨兵",
  "4:1:1": "死亡猎手",
  "4:1:2": "命缚者",
  "4:2:1": "命缚者",
  "4:2:3": "欺诈者",
  "4:3:1": "死亡猎手",
  "4:3:3": "欺诈者",
  "5:1:1": "神谕者",
  "5:1:2": "虚空编织者",
  "5:2:1": "神谕者",
  "5:2:3": "执政官",
  "5:3:2": "虚空编织者",
  "5:3:3": "执政官",
  "6:1:1": "死亡使者",
  "6:1:2": "萨莱因",
  "6:2:1": "死亡使者",
  "6:2:3": "天启骑士",
  "6:3:2": "萨莱因",
  "6:3:3": "天启骑士",
  "7:1:1": "先知",
  "7:1:2": "风暴使者",
  "7:2:2": "风暴使者",
  "7:2:3": "图腾祭祀",
  "7:3:1": "先知",
  "7:3:3": "图腾祭祀",
  "8:1:1": "疾咒师",
  "8:1:2": "日怒",
  "8:2:2": "日怒",
  "8:2:3": "霜火",
  "8:3:2": "疾咒师",
  "8:3:3": "霜火",
  "9:1:1": "地狱召唤者",
  "9:1:2": "灵魂收割者",
  "9:2:2": "灵魂收割者",
  "9:2:3": "恶魔使徒",
  "9:3:2": "地狱召唤者",
  "9:3:3": "恶魔使徒",
  "10:1:1": "祥和宗师",
  "10:1:2": "影踪派",
  "10:2:2": "祥和宗师",
  "10:2:3": "天神御师",
  "10:3:2": "影踪派",
  "10:3:3": "天神御师",
  "11:1:1": "艾露恩钦选者",
  "11:1:2": "丛林守护者",
  "11:2:3": "利爪德鲁伊",
  "11:2:4": "荒野追猎者",
  "11:3:2": "艾露恩钦选者",
  "11:3:3": "利爪德鲁伊",
  "11:4:2": "丛林守护者",
  "11:4:4": "荒野追猎者",
  "12:1:1": "奥达奇收割者",
  "12:1:2": "邪痕枭雄",
  "12:2:1": "奥达奇收割者",
  "12:2:3": "歼灭者",
  "12:3:2": "虚痕枭雄",
  "12:3:3": "歼灭者",
  "13:1:1": "塑焰者",
  "13:1:2": "鳞长",
  "13:2:2": "塑焰者",
  "13:2:3": "时空守卫",
  "13:3:2": "鳞长",
  "13:3:3": "时空守卫",
};

export type ModuleMetadata = {
  author: string;
  version: string;
  profession: string;
  specialization: string;
  partyType: string;
  heroTalent: string;
  hasClassSpecialization: boolean;
  classSpecializationError: string | null;
};

function textOrUnknown(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : UNKNOWN;
}

function numberOrNull(value: unknown) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : null;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
  }
  return null;
}

export function getModuleMetadata(content: Record<string, unknown>): ModuleMetadata {
  const match = content.Match;
  const matchRecord = match && typeof match === "object" && !Array.isArray(match)
    ? match as Record<string, unknown>
    : null;
  const classId = numberOrNull(matchRecord?.ClassId);
  const specId = numberOrNull(matchRecord?.SpecId);
  const partyTypeId = numberOrNull(matchRecord?.PartyType ?? content.PartyType);
  const heroTalentId = numberOrNull(matchRecord?.HeroTalent ?? content.HeroTalent);
  const profession = classId === null ? undefined : classNames[classId];
  const specialization = classId === null || specId === null ? undefined : specializationNames[classId]?.[specId];
  const partyType = partyTypeId !== null && partyTypeId >= 1 && partyTypeId <= 30
    ? "团队"
    : partyTypeId === 46
      ? "队伍"
      : UNKNOWN;
  const heroTalent = classId === null || specId === null || heroTalentId === null
    ? UNKNOWN
    : heroTalentNames[`${classId}:${specId}:${heroTalentId}`] ?? UNKNOWN;
  let classSpecializationError: string | null = null;

  if (!matchRecord) {
    classSpecializationError = "JSON 缺少 Match 对象，无法识别职业和专精";
  } else if (classId === null) {
    classSpecializationError = "JSON 缺少有效的职业字段 Match.ClassId";
  } else if (specId === null) {
    classSpecializationError = "JSON 缺少有效的专精字段 Match.SpecId";
  } else if (!profession) {
    classSpecializationError = `JSON 中的职业不存在（Match.ClassId: ${classId}）`;
  } else if (!specialization) {
    classSpecializationError = `JSON 中的专精不存在，或与职业“${profession}”不匹配（Match.SpecId: ${specId}）`;
  }

  return {
    author: textOrUnknown(content.Author),
    version: textOrUnknown(content.Version),
    profession: profession ?? UNKNOWN,
    specialization: specialization ?? UNKNOWN,
    partyType,
    heroTalent,
    hasClassSpecialization: classSpecializationError === null,
    classSpecializationError,
  };
}
