# Shigure Sites：AI 项目上下文

> 文档类型：面向 AI 编程助手的项目事实说明  
> 最后核对：2026-08-11  
> 适用范围：本仓库当前代码与 Cloudflare 部署配置

## 1. 阅读规则

- 先读本文件，再根据任务进入对应源码。
- 当文档与代码不一致时，以当前源码、`package.json`、`wrangler.jsonc` 和 `.openai/hosting.json` 为准。
- 根目录 `README.md` 仍包含较多 vinext starter 的旧描述，例如“未使用 `wrangler.jsonc`”和“`db/schema.ts` 为空”；这些描述不代表当前项目状态。
- 不要编辑生成目录：`.next/`、`.vinext/`、`.wrangler/`、`build/`、`dist/`、`node_modules/`、`outputs/`、`work/`。
- `examples/d1/` 是未接入当前应用路由的示例，不是生产功能。

## 2. 项目概述

Shigure Sites 是一个中文的《魔兽世界》JSON 模块分享站。用户可以上传、检索、预览和下载 Shigure/Fuyutsui 相关 JSON；注册用户还能在个人中心管理自己的长期分享。

核心业务规则：

- 所有人都可以浏览、预览、下载和上传 JSON。
- 匿名上传保存 90 天；登录用户上传默认长期保存。
- 登录用户只能删除自己的分享；管理员可以删除任意分享。
- JSON 必须能识别有效的职业与专精，否则拒绝上传。
- 文件正文存 R2，文件元数据、用户和会话存 D1。

## 3. 技术栈与运行模型

| 层 | 实现 |
| --- | --- |
| UI / 路由 | Next.js 16 App Router、React 19、TypeScript |
| Cloudflare 适配 | vinext + Vite + `@cloudflare/vite-plugin` |
| 边缘入口 | Cloudflare Worker：`worker/index.ts` |
| 关系数据 | Cloudflare D1，直接使用 D1 prepared statements；Drizzle 主要用于声明 schema 和生成迁移 |
| 文件存储 | Cloudflare R2 |
| 图片处理 | Cloudflare Images，经 `/_vinext/image` 进入自定义 Worker 分支 |
| 样式 | `app/globals.css` + Tailwind PostCSS 插件；页面主要使用项目自定义类名 |
| 测试 | Node.js 内置 test runner；`npm test` 会先构建再执行测试 |

最低 Node.js 版本为 `22.13.0`。项目使用 npm，并提交 `package-lock.json`。

### 请求路径

```text
浏览器
  -> Cloudflare Worker (`worker/index.ts`)
     -> `/_vinext/image`：ASSETS + IMAGES 图片优化
     -> 其他请求：vinext App Router handler
        -> 页面与 API Routes
           -> D1 (`DB`)：用户、会话、分享元数据
           -> R2 (`FILES`)：JSON 文件正文
```

### Cloudflare bindings

| Binding | 类型 | 用途 | 声明位置 |
| --- | --- | --- | --- |
| `DB` | D1Database | 用户、会话、分享元数据 | `wrangler.jsonc`、`.openai/hosting.json` |
| `FILES` | R2Bucket | 上传后的 JSON 正文 | `wrangler.jsonc`、`.openai/hosting.json` |
| `IMAGES` | Images binding | vinext 图片转换 | `wrangler.jsonc` |
| `ASSETS` | Fetcher | Worker 读取构建后的静态资源 | Worker 运行环境注入 |

`wrangler.jsonc` 是当前有效配置：Worker 名称为 `shigure-sites`，入口为 `worker/index.ts`，开启 `nodejs_compat` 和 observability。不要把真实资源 ID 复制到新文档、测试夹具或客户端代码。

`.openai/hosting.json` 把 Sites 项目映射到逻辑 binding `DB` 和 `FILES`。仓库没有 `deploy` npm script；发布流程由 Sites/外部控制面或另行确认的 Wrangler 流程负责，不要自行假设部署命令。

## 4. 目录与职责

| 路径 | 职责 |
| --- | --- |
| `app/page.tsx` | 首页客户端应用：分享列表、筛选、搜索、预览、上传、管理员删除、主题切换 |
| `app/layout.tsx` | 全局元数据、字体、主题初始化脚本 |
| `app/globals.css` | 全站视觉样式与响应式布局 |
| `app/auth-form.tsx` | 登录/注册共用的客户端表单 |
| `app/login/`、`app/register/` | 登录和注册页面 |
| `app/profile/` | 登录用户的个人分享列表与删除交互 |
| `app/api/auth/` | 注册、登录、退出、当前会话接口 |
| `app/api/shares/` | 分享列表、上传、读取、下载和删除接口 |
| `lib/auth.ts` | 账号校验、密码派生、会话 cookie、登录锁定与权限身份 |
| `lib/shares.ts` | D1/R2 binding、运行时建表/补列、过期清理和分享查询 |
| `lib/module-json.ts` | JSON 解析和必需顶层字段校验 |
| `lib/module-metadata.ts` | 从 JSON 解析作者、版本、职业、专精、队伍类型和英雄天赋 |
| `lib/wow-taxonomy.ts` | 首页职业/专精筛选表与组合校验 |
| `lib/built-in-samples.ts` | 历史内置样例 ID 的安全匹配规则 |
| `db/schema.ts` | Drizzle schema 声明 |
| `db/index.ts` | Drizzle D1 helper；当前生产业务没有引用 |
| `drizzle/` | 已生成的 D1 SQL 迁移 |
| `worker/index.ts` | Cloudflare Worker 入口和图片优化分流 |
| `tests/` | 源码形态、元数据解析、内置样例边界测试 |
| `public/` | 品牌图标、职业图标、favicon 和社交预览图片 |

## 5. 页面与用户流程

### `/`

`app/page.tsx` 是一个大型 client component。加载后并行请求：

- `GET /api/shares` 获取最多 100 条最新分享；
- `GET /api/auth/session` 获取登录和管理员状态。

用户在客户端按职业、专精或关键词过滤。选择分享后，请求 `GET /api/shares/:id` 并格式化展示完整 JSON。若 JSON 含非空字符串 `RecommendedTalent`，页面提供复制按钮。

主题有 `system`、`light`、`dark` 三档，保存在浏览器 `localStorage` 的 `shigure-theme`，并由 `app/layout.tsx` 中的内联脚本在 React hydration 前应用。

### `/login` 与 `/register`

使用 Shigure 自有账号密码，不使用 README 中提到的 ChatGPT 身份头。表单成功后跳转 `/profile`。

### `/profile`

强制动态渲染。未登录用户通过 `requireCurrentUser()` 重定向到 `/login?next=%2Fprofile`。页面仅加载当前用户的分享，并允许删除。当前登录表单没有消费 `next` 参数，登录成功固定跳转 `/profile`。

## 6. API 契约

所有认证和分享路由都按请求动态执行，不应添加跨用户缓存。

| 方法与路径 | 身份要求 | 行为 |
| --- | --- | --- |
| `GET /api/shares` | 无 | 返回按创建时间倒序的最多 100 条分享；隐藏 `r2Key` 和 `ownerUserId` |
| `POST /api/shares` | 无 | 接收 `multipart/form-data`：`file`、`description`；校验后写 R2 和 D1 |
| `GET /api/shares/:id` | 无 | 从 R2 读取并解析 JSON，返回 `{ content }` |
| `GET /api/shares/:id/download` | 无 | 流式返回 JSON 附件 |
| `DELETE /api/shares/:id` | 登录 | 所有者可删自己的分享，管理员可删任意分享；同时删除 D1 记录和 R2 对象 |
| `POST /api/auth/register` | 无 | JSON body：`username`、`password`；创建账号和会话 |
| `POST /api/auth/login` | 无 | JSON body：`username`、`password`；创建会话 |
| `POST /api/auth/logout` | 登录可选 | 删除服务端会话并清空 cookie；HTML 请求 303 回首页，JSON 请求返回状态 |
| `GET /api/auth/session` | 无 | 返回 `authenticated`、`isAdmin`、`username`、`displayName`，响应禁止缓存 |

### 上传限制

- 扩展名必须是 `.json`。
- 文件不能为空且不能超过 200 KiB。
- `description` 必填，最多 240 个字符。
- 文件名只保留英文字母、数字、点、下划线、连字符和常用中日韩统一表意文字，最长 100 个字符。
- 匿名分享的 `expiresAt = createdAt + 90 天`；登录用户为 `null`。
- 客户端校验只用于即时反馈；服务端 `POST /api/shares` 的校验才是安全边界。

## 7. JSON 模块格式

`lib/module-json.ts` 只要求 JSON 顶层是对象，并且存在以下键；当前不限制这些键的值类型：

```json
{
  "Id": "module-id",
  "Name": "module-name",
  "Enabled": true,
  "Author": "optional",
  "Version": "optional",
  "Match": {
    "ClassId": 1,
    "SpecId": 3,
    "PartyType": 46,
    "HeroTalent": 1
  },
  "RecommendedTalent": "optional import string"
}
```

服务端上传还要求：

- `Match` 必须是对象；
- `Match.ClassId` 和 `Match.SpecId` 必须是整数或纯数字字符串；
- 职业 ID 与专精 ID 的组合必须存在于 `lib/module-metadata.ts` 的映射中。

可选元数据的回退行为：

- 缺失或空的 `Author`、`Version` 显示为“未知”；
- `PartyType` 可来自 `Match.PartyType`，否则回退到顶层 `PartyType`；1–30 映射为“团队”，46 映射为“队伍”，其他为“未知”；
- `HeroTalent` 可来自 `Match.HeroTalent`，否则回退到顶层 `HeroTalent`；无法映射时为“未知”；
- `RecommendedTalent` 仅在预览阶段读取，不进入 D1 元数据。

若要新增或修改游戏分类，同时检查 `lib/module-metadata.ts`、`lib/wow-taxonomy.ts`、首页图标映射和相关测试，避免解析结果与筛选项不一致。

## 8. 数据模型与生命周期

### `users`

- 主键：`id`（UUID）
- 唯一字段：`email`、`username`
- 当前本地账号使用合成 email：`local:<normalized username>`
- 其他字段：`display_name`、密码哈希/盐、失败次数、锁定截止时间、管理员标记、创建时间

### `sessions`

- 主键：`id`（UUID）
- `user_id` 外键指向 `users`，删除用户时级联删除会话
- 只保存 session token 的 SHA-256 哈希
- 保存过期时间和创建时间

### `shares`

- 主键：`id`（UUID）
- 保存文件名、作者、版本、职业、专精、描述、字节数、R2 key 和创建时间
- `owner_user_id` 可空；匿名分享为空
- `expires_at` 可空；登录用户分享通常为空

### `app_metadata`

由 `lib/shares.ts` 在运行时创建，当前不在 `db/schema.ts` 中。用于记录 `seed_version`，以一次性清理历史内置样例。

### 重要实现细节

`ensureStorage()` 会在多数数据读取和认证操作前执行。它会：

1. 使用 `CREATE TABLE/INDEX IF NOT EXISTS` 补齐基础结构；
2. 通过 `PRAGMA table_info` 对旧数据库增量补列；
3. 根据 seed 版本删除 ID 以 `starter-` 或 `sample-` 开头的历史内置样例及其 R2 对象；
4. 删除已过期匿名分享及其 R2 对象。

因此当前项目同时存在两套 schema 演进机制：`drizzle/` 迁移和 `ensureStorage()` 的运行时兼容逻辑。修改数据模型时必须同步考虑二者，不能只改 `db/schema.ts`。

D1 与 R2 之间没有跨服务事务：上传时先写 R2，再写 D1，D1 失败会尝试删除 R2；删除时先删 D1，再删 R2。修改这些流程时要显式处理部分失败和孤儿对象。

## 9. 认证与权限

- 用户名会 trim 并转小写，允许 Unicode 字母、数字、下划线和连字符，长度 3–24。
- 密码长度 8–128。
- 密码使用 PBKDF2-SHA-256、随机 16 字节盐和 100,000 次迭代，数据库不保存明文。
- 连续失败达到 5 次后锁定 10 分钟；随后失败计数重置为 0。
- session 原始 token 为随机 32 字节值，仅通过 `shigure_session` cookie 发送；数据库保存其 SHA-256 哈希。
- session 有效期 30 天；cookie 为 `HttpOnly`、`SameSite=Lax`、`Path=/`，非 localhost 环境使用 `Secure`。
- 写认证状态的路由调用 `assertSameOrigin()`；存在 `Origin` 请求头时，要求其 host 与请求 URL host 相同。
- 删除分享的真正授权检查位于服务端 `DELETE /api/shares/:id`，不要只依赖首页是否显示管理员按钮。

## 10. 开发与验证

```bash
npm install
npm run dev
npm run build
npm test
npm run lint
npm run db:generate
```

- `npm run dev`：vinext + Vite 本地开发。
- `npm run build`：生成 Cloudflare Worker 兼容构建。
- `npm test`：先执行完整 build，再运行 Node 测试。
- `npm run lint`：ESLint，忽略 `dist` 和 `.next`。
- `npm run db:generate`：根据 `db/schema.ts` 生成新 Drizzle 迁移；生成后必须人工审查 SQL。

当前测试覆盖范围有限：

- 首页关键文案和元数据仍接入；
- 职业、专精、队伍类型和英雄天赋解析；
- 历史内置样例清理不会根据文件名误删用户上传。

当前没有 D1/R2 集成测试、API 契约测试、认证流程测试或浏览器端交互测试。修改上传、删除、过期清理或权限逻辑时，不能只依赖现有测试通过。

## 11. 常见修改路线

### 修改 JSON 元数据解析

1. 修改 `lib/module-json.ts` 或 `lib/module-metadata.ts`；
2. 同步首页上传预览和已选文件预览；
3. 若字段需要持久化，更新 `db/schema.ts`、生成迁移，并补充 `ensureStorage()` 的旧库兼容；
4. 扩充 `tests/module-metadata.test.mjs`；
5. 运行 `npm test` 和 `npm run lint`。

### 修改数据库结构

1. 修改 `db/schema.ts`；
2. 运行 `npm run db:generate` 并审查新 SQL；
3. 决定是否需要在 `ensureStorage()` 增加幂等建表/补列逻辑；
4. 更新直接写 SQL 的查询、类型和本文档；
5. 在本地 D1 上验证旧库升级和新库初始化两条路径。

### 修改 Cloudflare binding

同时核对：

- `wrangler.jsonc`；
- `.openai/hosting.json`（Sites 管理的 D1/R2 逻辑 binding）；
- `worker/index.ts` 中的 `Env`；
- `lib/shares.ts` 或其他读取 `cloudflare:workers` env 的代码；
- `vite.config.ts` 的本地 Cloudflare 环境。

不要在 React 客户端组件中直接访问 binding。

### 修改上传或删除

重点验证：文件限制、服务端 JSON 校验、匿名/登录保留期、所有者/管理员授权、D1 与 R2 部分失败、过期清理，以及 API 错误状态码。

## 12. 已知上下文陷阱

- `README.md` 是旧 starter 说明，不足以描述当前产品。
- `db/index.ts` 的 Drizzle helper 当前没有生产调用；主要业务直接使用 D1 SQL。
- `db/schema.ts` 没有声明运行时使用的 `app_metadata` 表。
- 运行时 `ensureStorage()` 承担了迁移、seed 清理和过期数据清理，不只是“确保表存在”。
- `GET /api/shares/:id` 会 `JSON.parse` R2 内容；若 R2 中存在损坏对象，会返回 500。
- 首页是大型 client component。拆分时需保留筛选、所选项、文件加载取消、上传模态框、管理员删除和主题初始化之间的状态关系。
- 页面中的品牌文案包含 “Arasaka Corporation”，外部链接指向 `waynebian01/Fuyutsui` 和 `waynebian01/Shigure`；修改品牌或项目归属前先确认产品意图。

## 13. AI 完成任务前检查

- 是否只修改了任务涉及的生产路径，而不是 `examples/d1/` 或生成目录？
- 是否把客户端校验同步到了服务端安全边界？
- 数据模型变化是否同步了 Drizzle schema、SQL 迁移和 `ensureStorage()`？
- 是否保持 `DB`、`FILES`、`IMAGES`、`ASSETS` 的 binding 名称一致？
- 是否考虑匿名分享 90 天保留、登录分享长期保留和管理员删除权限？
- 是否运行了与改动风险相称的 build、test、lint 或集成验证？
- 若项目行为发生变化，是否同步更新本文件？
