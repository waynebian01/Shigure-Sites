import frostDeathKnightByPalasoyido from "../db/seeds/冰霜DK-by-帕拉索伊朵.json";
import retributionPaladin from "../db/seeds/惩戒骑.json";
import retributionPaladinByZyx1 from "../db/seeds/惩戒骑-By-zyx1.json";
import officialOneButton from "../db/seeds/官方一键.json";
import officialVengeanceDemonHunter from "../db/seeds/官方一键-DH-复仇.json";
import officialFrostDeathKnight from "../db/seeds/官方一键-冰DK.json";
import officialProtectionWarrior from "../db/seeds/官方一键-防战.json";
import disciplineOracle from "../db/seeds/戒律队伍神谕者.json";
import priestTestModule from "../db/seeds/牧师测试模块.json";
import holyPaladinMythicPlus from "../db/seeds/奶骑大秘境.json";
import restorationShamanPartyTotem from "../db/seeds/奶萨-队伍-图腾.json";
import restorationShamanPartyTotemByAbcdefg from "../db/seeds/奶萨-队伍-图腾-By-abcdefg.json";
import restorationShamanRaidTotem from "../db/seeds/奶萨-团队-图腾.json";
import restorationShamanRaidTotemByAbcdefg from "../db/seeds/奶萨-团队-图腾-By-abcdefg.json";
import unholyDeathKnight from "../db/seeds/邪DK.json";
import enhancementAuraDetection from "../db/seeds/增强-识别光环.json";

export type SeedModule = {
  id: string;
  filename: string;
  author: string;
  version: string;
  profession: string;
  specialization: string;
  description: string;
  content: Record<string, unknown>;
  createdAt: number;
};

export const seedModules: SeedModule[] = [
  {
    id: "sample-official-protection-warrior",
    filename: "官方一键-防战.json",
    author: "官方",
    version: "1.2.2.4",
    profession: "战士",
    specialization: "防护",
    description: "防护战士的一键辅助规则样本，包含职业与专精匹配及战斗规则配置。",
    content: officialProtectionWarrior,
    createdAt: Date.parse("2026-06-22T22:10:02+08:00"),
  },
  {
    id: "sample-restoration-shaman-party-totem",
    filename: "奶萨-队伍-图腾.json",
    author: "abcdefg",
    version: "1.1.0",
    profession: "萨满祭司",
    specialization: "恢复",
    description: "恢复萨满的队伍图腾规则样本，用于小队环境下的治疗与图腾判断。",
    content: restorationShamanPartyTotem,
    createdAt: Date.parse("2026-06-22T20:08:42+08:00"),
  },
  {
    id: "sample-holy-paladin-mythic-plus",
    filename: "奶骑大秘境.json",
    author: "Laoer",
    version: "1.1.0",
    profession: "圣骑士",
    specialization: "神圣",
    description: "神圣圣骑士的大秘境治疗模块样本，面向五人队伍场景。",
    content: holyPaladinMythicPlus,
    createdAt: Date.parse("2026-06-22T20:08:26+08:00"),
  },
  {
    id: "sample-discipline-oracle",
    filename: "戒律队伍神谕者.json",
    author: "Wayne",
    version: "1.1.0",
    profession: "牧师",
    specialization: "戒律",
    description: "戒律牧师的队伍神谕者模块样本，包含队伍治疗与光环判断。",
    content: disciplineOracle,
    createdAt: Date.parse("2026-06-22T20:07:35+08:00"),
  },
  {
    id: "sample-unholy-death-knight",
    filename: "邪DK.json",
    author: "Wayne",
    version: "1.1.0",
    profession: "死亡骑士",
    specialization: "邪恶",
    description: "邪恶死亡骑士模块样本，包含职业、专精及战斗条件配置。",
    content: unholyDeathKnight,
    createdAt: Date.parse("2026-06-21T21:53:37+08:00"),
  },
  {
    id: "sample-enhancement-aura-detection",
    filename: "增强-识别光环.json",
    author: "Wayne",
    version: "1.2.0.0",
    profession: "萨满祭司",
    specialization: "增强",
    description: "增强萨满的光环识别规则样本，用于验证状态匹配。",
    content: enhancementAuraDetection,
    createdAt: Date.parse("2026-06-20T10:45:05+08:00"),
  },
  {
    id: "sample-official-one-button",
    filename: "官方一键.json",
    author: "官方",
    version: "1.1.0",
    profession: "通用",
    specialization: "全职业",
    description: "适用于全职业的一键辅助基础规则样本。",
    content: officialOneButton,
    createdAt: Date.parse("2026-06-19T00:37:46+08:00"),
  },
  {
    id: "sample-official-vengeance-demon-hunter",
    filename: "官方一键-DH-复仇.json",
    author: "官方",
    version: "1.1.0",
    profession: "恶魔猎手",
    specialization: "复仇",
    description: "复仇恶魔猎手的一键辅助规则样本。",
    content: officialVengeanceDemonHunter,
    createdAt: Date.parse("2026-06-19T00:37:44+08:00"),
  },
  {
    id: "sample-restoration-shaman-raid-totem",
    filename: "奶萨-团队-图腾.json",
    author: "abcdefg",
    version: "1.1.0",
    profession: "萨满祭司",
    specialization: "恢复",
    description: "恢复萨满的团队图腾规则样本，用于团队副本环境。",
    content: restorationShamanRaidTotem,
    createdAt: Date.parse("2026-06-19T00:37:42+08:00"),
  },
  {
    id: "sample-official-frost-death-knight",
    filename: "官方一键-冰DK.json",
    author: "官方",
    version: "1.1.0",
    profession: "死亡骑士",
    specialization: "冰霜",
    description: "冰霜死亡骑士的一键辅助规则样本。",
    content: officialFrostDeathKnight,
    createdAt: Date.parse("2026-06-19T00:37:37+08:00"),
  },
  {
    id: "sample-priest-test-module",
    filename: "牧师测试模块.json",
    author: "未署名",
    version: "1.1.0",
    profession: "牧师",
    specialization: "戒律",
    description: "戒律牧师的轻量测试模块样本，用于验证基础匹配与规则结构。",
    content: priestTestModule,
    createdAt: Date.parse("2026-06-19T00:37:31+08:00"),
  },
  {
    id: "sample-restoration-shaman-party-totem-by-abcdefg",
    filename: "奶萨-队伍-图腾-By-abcdefg.json",
    author: "abcdefg",
    version: "未标注",
    profession: "萨满祭司",
    specialization: "恢复",
    description: "abcdefg 分享的恢复萨满队伍图腾规则样本。",
    content: restorationShamanPartyTotemByAbcdefg,
    createdAt: Date.parse("2026-06-19T00:34:04+08:00"),
  },
  {
    id: "sample-restoration-shaman-raid-totem-by-abcdefg",
    filename: "奶萨-团队-图腾-By-abcdefg.json",
    author: "abcdefg",
    version: "未标注",
    profession: "萨满祭司",
    specialization: "恢复",
    description: "abcdefg 分享的恢复萨满团队图腾规则样本。",
    content: restorationShamanRaidTotemByAbcdefg,
    createdAt: Date.parse("2026-06-18T23:39:13+08:00"),
  },
  {
    id: "sample-frost-death-knight-by-palasoyido",
    filename: "冰霜DK-by-帕拉索伊朵.json",
    author: "帕拉索伊朵",
    version: "未标注",
    profession: "死亡骑士",
    specialization: "冰霜",
    description: "帕拉索伊朵分享的冰霜死亡骑士模块样本。",
    content: frostDeathKnightByPalasoyido,
    createdAt: Date.parse("2026-06-18T14:02:55+08:00"),
  },
  {
    id: "sample-retribution-paladin",
    filename: "惩戒骑.json",
    author: "zyx1",
    version: "1.1.0",
    profession: "圣骑士",
    specialization: "惩戒",
    description: "惩戒圣骑士模块样本，包含职业、专精与战斗规则配置。",
    content: retributionPaladin,
    createdAt: Date.parse("2026-06-19T00:37:18+08:00"),
  },
  {
    id: "sample-retribution-paladin-by-zyx1",
    filename: "惩戒骑-By-zyx1.json",
    author: "zyx1",
    version: "未标注",
    profession: "圣骑士",
    specialization: "惩戒",
    description: "zyx1 分享的惩戒圣骑士模块样本。",
    content: retributionPaladinByZyx1,
    createdAt: Date.parse("2026-06-17T13:09:59+08:00"),
  },
];
