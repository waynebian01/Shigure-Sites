"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ModuleHeader, validateModuleJson } from "../lib/module-json";
import { getModuleMetadata, ModuleMetadata } from "../lib/module-metadata";
import { wowClasses, wowClassSpecializations } from "../lib/wow-taxonomy";

type Share = {
  id: string;
  filename: string;
  sharer: string;
  author: string;
  version: string;
  profession: string;
  specialization: string;
  description: string;
  size: number;
  downloadCount: number;
  createdAt: string;
};

type SessionStatus = {
  authenticated: boolean;
  isAdmin: boolean;
  username: string | null;
  displayName: string | null;
};

type ThemePreference = "system" | "light" | "dark";

const themeOptions: Array<{ value: ThemePreference; label: string; symbol: string }> = [
  { value: "system", label: "系统", symbol: "◐" },
  { value: "light", label: "亮色", symbol: "☼" },
  { value: "dark", label: "暗色", symbol: "☾" },
];

function resolveTheme(preference: ThemePreference): Exclude<ThemePreference, "system"> {
  if (preference !== "system") return preference;
  try {
    return typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

const wowClassIcons: Record<string, string> = {
  "战士": "/class-icons/warrior.jpg",
  "圣骑士": "/class-icons/paladin.jpg",
  "猎人": "/class-icons/hunter.jpg",
  "潜行者": "/class-icons/rogue.jpg",
  "牧师": "/class-icons/priest.jpg",
  "死亡骑士": "/class-icons/deathknight.jpg",
  "萨满祭司": "/class-icons/shaman.jpg",
  "法师": "/class-icons/mage.jpg",
  "术士": "/class-icons/warlock.jpg",
  "武僧": "/class-icons/monk.jpg",
  "德鲁伊": "/class-icons/druid.jpg",
  "恶魔猎手": "/class-icons/demonhunter.jpg",
  "唤魔师": "/class-icons/evoker.jpg",
};

function formatSize(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getRecommendedTalent(content: unknown) {
  if (!content || typeof content !== "object") return null;
  const value = (content as Record<string, unknown>).RecommendedTalent;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default function Home() {
  const [shares, setShares] = useState<Share[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [recommendedTalent, setRecommendedTalent] = useState<string | null>(null);
  const [talentCopied, setTalentCopied] = useState(false);
  const [professionFilter, setProfessionFilter] = useState("全部");
  const [specializationFilter, setSpecializationFilter] = useState("全部专精");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isJsonLoading, setIsJsonLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Share | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileHeader, setFileHeader] = useState<ModuleHeader | null>(null);
  const [fileMetadata, setFileMetadata] = useState<ModuleMetadata | null>(null);
  const [selectedMetadata, setSelectedMetadata] = useState<ModuleMetadata | null>(null);
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const formRef = useRef<HTMLFormElement>(null);

  const filterSpecializations = professionFilter === "全部"
    ? []
    : wowClassSpecializations[professionFilter as keyof typeof wowClassSpecializations] ?? [];
  const visibleShares = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return shares.filter((item) => {
      const professionMatches = professionFilter === "全部" || item.profession === professionFilter;
      const specializationMatches = specializationFilter === "全部专精" || item.specialization === specializationFilter;
      const searchMatches =
        !keyword ||
        [item.filename, item.author, item.profession, item.specialization, item.description]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      return professionMatches && specializationMatches && searchMatches;
    });
  }, [professionFilter, query, shares, specializationFilter]);

  const selected = shares.find((item) => item.id === selectedId) ?? null;

  async function loadShares(preferredId?: string) {
    const response = await fetch("/api/shares", { cache: "no-store" });
    if (!response.ok) throw new Error("无法读取分享内容");
    const payload = (await response.json()) as { shares: Share[] };
    setShares(payload.shares);
    setSelectedId((current) => {
      const candidate = preferredId ?? current;
      return payload.shares.some((share) => share.id === candidate)
        ? candidate
        : payload.shares[0]?.id ?? null;
    });
  }

  useEffect(() => {
    loadShares()
      .catch(() => setNotice("暂时无法载入分享内容，请稍后重试。"))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("无法读取管理员状态");
        setSessionStatus((await response.json()) as SessionStatus);
      })
      .catch(() => setSessionStatus({ authenticated: false, isAdmin: false, username: null, displayName: null }));
  }, []);

  useEffect(() => {
    const initialPreference = document.documentElement.dataset.themePreference;
    const preference: ThemePreference =
      initialPreference === "light" || initialPreference === "dark" || initialPreference === "system"
        ? initialPreference
        : "system";
    setThemePreference(preference);
    applyTheme(preference);

    if (typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleSystemThemeChange = () => {
      if (document.documentElement.dataset.themePreference === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener?.("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener?.("change", handleSystemThemeChange);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setJsonText("");
      setRecommendedTalent(null);
      setSelectedMetadata(null);
      return;
    }
    const controller = new AbortController();
    setIsJsonLoading(true);
    setRecommendedTalent(null);
    setSelectedMetadata(null);
    setTalentCopied(false);
    fetch(`/api/shares/${selectedId}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("读取失败");
        const payload = (await response.json()) as { content: unknown };
        setJsonText(JSON.stringify(payload.content, null, 2));
        setRecommendedTalent(getRecommendedTalent(payload.content));
        setSelectedMetadata(
          payload.content && typeof payload.content === "object" && !Array.isArray(payload.content)
            ? getModuleMetadata(payload.content as Record<string, unknown>)
            : null,
        );
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setJsonText("无法读取这个 JSON 文件。\n请稍后再试。");
          setRecommendedTalent(null);
          setSelectedMetadata(null);
        }
      })
      .finally(() => setIsJsonLoading(false));
    return () => controller.abort();
  }, [selectedId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setNotice("");
    if (!file) {
      setNotice("请选择一个 JSON 文件。");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".json")) {
      setNotice("仅支持 .json 文件。" );
      return;
    }
    if (file.size > 200 * 1024) {
      setNotice("文件大小不能超过 200 KB。" );
      return;
    }
    const validation = validateModuleJson(await file.text());
    if (!validation.ok) {
      setNotice(validation.error);
      return;
    }
    const metadata = getModuleMetadata(validation.content);
    if (metadata.classSpecializationError) {
      setNotice(`${metadata.classSpecializationError}。`);
      return;
    }

    setUploading(true);
    try {
      const data = new FormData(form);
      data.set("file", file);
      const response = await fetch("/api/shares", { method: "POST", body: data });
      const payload = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !payload.id) throw new Error(payload.error || "分享失败");
      await loadShares(payload.id);
      setProfessionFilter("全部");
      setSpecializationFilter("全部专精");
      setQuery("");
      setIsModalOpen(false);
      setFile(null);
      setFileHeader(null);
      setFileMetadata(null);
      formRef.current?.reset();
      setNotice("分享成功，已出现在列表顶部。" );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "分享失败，请稍后重试。" );
    } finally {
      setUploading(false);
    }
  }

  async function handleFileSelection(candidate: File | null) {
    setNotice("");
    setFile(candidate);
    setFileHeader(null);
    setFileMetadata(null);
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith(".json")) {
      setNotice("仅支持 .json 文件。");
      return;
    }
    if (candidate.size > 200 * 1024) {
      setNotice("文件大小不能超过 200 KB。");
      return;
    }
    const validation = validateModuleJson(await candidate.text());
    if (!validation.ok) {
      setNotice(validation.error);
      return;
    }
    setFileHeader(validation.header);
    const metadata = getModuleMetadata(validation.content);
    setFileMetadata(metadata);
    if (metadata.classSpecializationError) {
      setNotice(`${metadata.classSpecializationError}。`);
    }
  }

  async function handleDelete() {
    if (!pendingDelete || !sessionStatus?.isAdmin) return;
    setIsDeleting(true);
    setNotice("");
    try {
      const response = await fetch(`/api/shares/${pendingDelete.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { deleted?: boolean; error?: string };
      if (!response.ok || !payload.deleted) throw new Error(payload.error || "删除失败");
      setPendingDelete(null);
      await loadShares();
      setNotice(`已删除 ${pendingDelete.filename}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "删除失败，请稍后重试。");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCopyTalent() {
    if (!recommendedTalent) return;
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(recommendedTalent);
      setTalentCopied(true);
      setNotice("推荐天赋已复制。");
    } catch {
      setTalentCopied(false);
      setNotice("无法自动复制，请手动选择天赋字符串。");
    }
  }

  function handleThemeChange(preference: ThemePreference) {
    setThemePreference(preference);
    applyTheme(preference);
    try {
      localStorage.setItem("shigure-theme", preference);
    } catch {
      // The choice still applies for this page when storage is unavailable.
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Shigure 首页">
          <span className="brand-mark" aria-hidden="true">
            <img src="/brand/arasaka-icon-64.png" width={64} height={64} alt="" />
          </span>
          <span>SHIGURE</span>
        </a>
        <div className="header-actions">
          <span className="format-note"><i /> Arasaka Corporation Sharing platform</span>
          <div className="theme-switcher" role="group" aria-label="外观主题">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={themePreference === option.value}
                title={`${option.label}主题`}
                onClick={() => handleThemeChange(option.value)}
              >
                <span aria-hidden="true">{option.symbol}</span>
                <small>{option.label}</small>
              </button>
            ))}
          </div>
          {sessionStatus?.authenticated ? (
            <div className="account-session">
              {sessionStatus.isAdmin && <span>管理员</span>}
              <a className="account-link" href="/profile" title={sessionStatus.username ?? undefined}>
                {sessionStatus.displayName ?? "个人中心"}
              </a>
              <form action="/api/auth/logout" method="post">
                <button type="submit">退出</button>
              </form>
            </div>
          ) : (
            <nav className="auth-links" aria-label="用户账户">
              <a href="/login">登录</a>
              <a href="/register">注册</a>
            </nav>
          )}
        </div>
      </header>

      <section className="library" id="top" aria-label="模型库">
        <div className="section-heading library-toolbar">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">搜索分享</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文件、作者或专精" />
          </label>
          <div className="library-actions">
            <a
              className="get-shigure"
              href="https://github.com/waynebian01/Shigure"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>01</span>
              <strong>获取 Shigure</strong>
              <i aria-hidden="true">↗</i>
            </a>
            <button className="primary-button" type="button" onClick={() => {
              setNotice("");
              setIsModalOpen(true);
            }}>
              <span aria-hidden="true">＋</span>
              <span>分享 JSON</span>
            </button>
          </div>
        </div>

        <div className="taxonomy-filters">
          <div className="filter-row profession-row">
            <div className="category-tabs" role="tablist" aria-label="按职业筛选">
              {["全部", ...wowClasses].map((item) => {
                const icon = wowClassIcons[item];
                return (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={professionFilter === item}
                    onClick={() => {
                      setProfessionFilter(item);
                      setSpecializationFilter("全部专精");
                    }}
                  >
                    <span className="class-tab-icon" aria-hidden="true">
                      {icon ? <img src={icon} alt="" /> : <span>{item === "全部" ? "✦" : "?"}</span>}
                    </span>
                    <span className="class-tab-label">{item}</span>
                    <sup>{item === "全部" ? shares.length : shares.filter((share) => share.profession === item).length}</sup>
                  </button>
                );
              })}
            </div>
          </div>

          {professionFilter !== "全部" && (
            <div className="filter-row specialization-row">
              <span className="filter-label">专精</span>
              <div className="specialization-tabs" role="tablist" aria-label={`按${professionFilter}专精筛选`}>
                {["全部专精", ...filterSpecializations].map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={specializationFilter === item}
                    onClick={() => setSpecializationFilter(item)}
                  >
                    {item}
                    <sup>
                      {item === "全部专精"
                        ? shares.filter((share) => share.profession === professionFilter).length
                        : shares.filter((share) => share.profession === professionFilter && share.specialization === item).length}
                    </sup>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="explorer-shell">
          <div className="share-tabs" role="tablist" aria-label="分享内容">
            {isLoading ? (
              <div className="empty-state">正在整理分享库…</div>
            ) : visibleShares.length === 0 ? (
              <div className="empty-state">没有匹配的分享<br /><small>试试其他关键词或分类</small></div>
            ) : visibleShares.map((item) => (
              <button
                className="share-tab"
                data-active={selectedId === item.id}
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selectedId === item.id}
                onClick={() => setSelectedId(item.id)}
              >
                <span className="tab-copy">
                  <strong>{item.filename}</strong>
                  <small>
                    <span>作者: {item.author || "未知"}</span>
                    <span>下载次数: {item.downloadCount ?? 0}</span>
                  </small>
                </span>
              </button>
            ))}
          </div>

          <article className="preview-pane" aria-live="polite">
            {selected ? (
              <>
                <div className="preview-header">
                  <div>
                    <span className="preview-kicker">JSON 预览</span>
                    <h3>{selected.filename}</h3>
                  </div>
                  <div className="preview-actions">
                    <a
                      className="download-button"
                      href={`/api/shares/${selected.id}/download`}
                      download
                      onClick={() => {
                        setShares((prev) =>
                          prev.map((share) =>
                            share.id === selected.id
                              ? { ...share, downloadCount: (share.downloadCount ?? 0) + 1 }
                              : share,
                          ),
                        );
                      }}
                    >
                      下载 <span aria-hidden="true">↓</span>
                    </a>
                    {sessionStatus?.isAdmin && (
                      <button className="delete-button" type="button" onClick={() => setPendingDelete(selected)}>
                        删除
                      </button>
                    )}
                  </div>
                </div>
                <div className="file-details">
                  <dl><dt>分享者</dt><dd>{selected.sharer || "未知"}</dd></dl>
                  <dl><dt>作者</dt><dd>{selected.author}</dd></dl>
                  <dl><dt>版本</dt><dd>{selected.version}</dd></dl>
                  <dl><dt>职业</dt><dd>{selected.profession}</dd></dl>
                  <dl><dt>专精</dt><dd>{selected.specialization}</dd></dl>
                  <dl><dt>队伍类型</dt><dd>{selectedMetadata?.partyType ?? "读取中…"}</dd></dl>
                  <dl><dt>英雄天赋</dt><dd>{selectedMetadata?.heroTalent ?? "读取中…"}</dd></dl>
                </div>
                <p className="description">{selected.description}</p>
                {recommendedTalent && (
                  <section className="talent-card" aria-labelledby="talent-title">
                    <div className="talent-heading">
                      <div>
                        <span id="talent-title">推荐天赋</span>
                        <small>复制后可在游戏天赋界面导入</small>
                      </div>
                      <button type="button" onClick={() => void handleCopyTalent()}>
                        {talentCopied ? "✓ 已复制" : "复制天赋"}
                      </button>
                    </div>
                    <code>{recommendedTalent}</code>
                  </section>
                )}
                <div className="code-window">
                  <div className="code-toolbar"><span>RAW · JSON</span><span>{formatDate(selected.createdAt)}</span></div>
                  <pre>{isJsonLoading ? "正在读取…" : jsonText}</pre>
                </div>
              </>
            ) : (
              <div className="preview-empty">选择左侧选项卡<br /><small>即可查看 JSON 内容</small></div>
            )}
          </article>
        </div>
      </section>

      <footer>
        <div>
          <span className="brand-mark small" aria-hidden="true">
            <img src="/brand/arasaka-icon-32.png" width={32} height={32} alt="" />
          </span>
          <strong>Shigure</strong>
        </div>
        <p>轻量 JSON 分享，让灵感持续流动。</p>
        <span>© 2026 SHIGURE</span>
      </footer>

      {notice && !isModalOpen && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="关闭提示">×</button></div>}

      {pendingDelete && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isDeleting) setPendingDelete(null); }}>
          <section className="delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <span className="preview-kicker">ADMIN ACTION</span>
            <h2 id="delete-title">删除这个模块？</h2>
            <p><strong>{pendingDelete.filename}</strong></p>
            <p>模块记录和对应的 JSON 文件都会被删除，此操作无法撤销。</p>
            <div className="delete-actions">
              <button type="button" onClick={() => setPendingDelete(null)} disabled={isDeleting}>取消</button>
              <button className="confirm-delete" type="button" onClick={() => void handleDelete()} disabled={isDeleting}>
                {isDeleting ? "正在删除…" : "确认删除"}
              </button>
            </div>
          </section>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !uploading) setIsModalOpen(false); }}>
          <section className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
            <div className="modal-header">
              <div><span className="preview-kicker">NEW SHARE</span><h2 id="share-title">分享一个 JSON</h2></div>
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={uploading} aria-label="关闭">×</button>
            </div>
            <p className="share-retention-note">
              未登录用户（包括未注册用户）分享的 JSON 仅保存 90 天；登录后分享会长期保存并进入个人中心。
            </p>
            <form ref={formRef} onSubmit={handleSubmit}>
              <div className="module-metadata" data-valid={Boolean(fileMetadata?.hasClassSpecialization)}>
                <dl><dt>作者</dt><dd>{fileMetadata?.author ?? "等待解析"}</dd></dl>
                <dl><dt>版本</dt><dd>{fileMetadata?.version ?? "等待解析"}</dd></dl>
                <dl><dt>职业</dt><dd>{fileMetadata?.profession ?? "等待解析"}</dd></dl>
                <dl><dt>专精</dt><dd>{fileMetadata?.specialization ?? "等待解析"}</dd></dl>
                <dl><dt>队伍类型</dt><dd>{fileMetadata?.partyType ?? "等待解析"}</dd></dl>
                <dl><dt>英雄天赋</dt><dd>{fileMetadata?.heroTalent ?? "等待解析"}</dd></dl>
              </div>
              <div className="form-grid">
                <label className="full-width">描述<textarea name="description" required maxLength={240} rows={3} placeholder="简单说说这个文件能做什么" /></label>
              </div>
              <label className="file-drop" data-has-file={Boolean(file)}>
                <input type="file" name="file" accept="application/json,.json" required onChange={(event) => void handleFileSelection(event.target.files?.[0] ?? null)} />
                <span className="upload-symbol" aria-hidden="true">↥</span>
                <strong>{file ? file.name : "选择 JSON 文件"}</strong>
                <small>{file ? `${formatSize(file.size)} / 200 KB` : "仅支持 .json · 最大 200 KB"}</small>
              </label>
              <div className="standard-card" data-valid={Boolean(fileMetadata?.hasClassSpecialization)}>
                <div>
                  <span>{fileHeader ? "✓ 已读取 JSON 文件" : "JSON 文件要求"}</span>
                  {fileHeader && <strong>{fileMetadata?.hasClassSpecialization ? "职业与专精识别完成" : "需要有效的职业与专精"}</strong>}
                </div>
                <code>Id · Name · Enabled<br />PartyType · HeroTalent 仅识别</code>
              </div>
              {notice && <p className="form-notice" role="alert">{notice}</p>}
              <button className="submit-button" type="submit" disabled={uploading || !fileMetadata?.hasClassSpecialization}>{uploading ? "正在分享…" : "确认分享"}<span>→</span></button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
