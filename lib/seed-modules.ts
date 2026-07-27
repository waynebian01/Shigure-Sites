import officialOneButton from "../db/seeds/官方一键.json";
import officialVengeanceDemonHunter from "../db/seeds/官方一键-DH-复仇.json";
import officialFrostDeathKnight from "../db/seeds/官方一键-冰DK.json";
import officialProtectionWarrior from "../db/seeds/官方一键-防战.json";

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
];
