export const wowClassSpecializations = {
  "战士": ["武器", "狂怒", "防护"],
  "圣骑士": ["神圣", "防护", "惩戒"],
  "猎人": ["野兽控制", "射击", "生存"],
  "潜行者": ["奇袭", "狂徒", "敏锐"],
  "牧师": ["戒律", "神圣", "暗影"],
  "死亡骑士": ["鲜血", "冰霜", "邪恶"],
  "萨满祭司": ["元素", "增强", "恢复"],
  "法师": ["奥术", "火焰", "冰霜"],
  "术士": ["痛苦", "恶魔学识", "毁灭"],
  "武僧": ["酒仙", "织雾", "踏风"],
  "德鲁伊": ["平衡", "野性", "守护", "恢复"],
  "恶魔猎手": ["噬灭", "浩劫", "复仇"],
  "唤魔师": ["湮灭", "恩护", "增辉"],
} as const;

export const wowClasses = Object.keys(wowClassSpecializations) as Array<keyof typeof wowClassSpecializations>;

export function isValidWowClassSpecialization(profession: string, specialization: string) {
  if (profession === "未知" || specialization === "未知") return false;
  if (!(profession in wowClassSpecializations)) return false;
  return (wowClassSpecializations[profession as keyof typeof wowClassSpecializations] as readonly string[]).includes(specialization);
}
