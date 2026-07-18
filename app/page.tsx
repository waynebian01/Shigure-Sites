"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ModuleHeader, validateModuleJson } from "../lib/module-json";

type Share = {
  id: string;
  filename: string;
  author: string;
  version: string;
  profession: string;
  specialization: string;
  description: string;
  size: number;
  createdAt: string;
};

const professions = ["战士", "圣骑士", "猎人", "潜行者", "牧师", "死亡骑士", "萨满祭司", "法师", "术士", "武僧", "德鲁伊", "恶魔猎手", "唤魔师"];

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

export default function Home() {
  const [shares, setShares] = useState<Share[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isJsonLoading, setIsJsonLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileHeader, setFileHeader] = useState<ModuleHeader | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const categories = useMemo(
    () => ["全部", ...Array.from(new Set(shares.map((item) => item.profession)))],
    [shares],
  );

  const visibleShares = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return shares.filter((item) => {
      const categoryMatches = category === "全部" || item.profession === category;
      const searchMatches =
        !keyword ||
        [item.filename, item.author, item.profession, item.specialization, item.description]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      return categoryMatches && searchMatches;
    });
  }, [category, query, shares]);

  const selected = shares.find((item) => item.id === selectedId) ?? null;

  async function loadShares(preferredId?: string) {
    const response = await fetch("/api/shares", { cache: "no-store" });
    if (!response.ok) throw new Error("无法读取分享内容");
    const payload = (await response.json()) as { shares: Share[] };
    setShares(payload.shares);
    setSelectedId((current) => preferredId ?? current ?? payload.shares[0]?.id ?? null);
  }

  useEffect(() => {
    loadShares()
      .catch(() => setNotice("暂时无法载入分享内容，请稍后重试。"))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setJsonText("");
      return;
    }
    const controller = new AbortController();
    setIsJsonLoading(true);
    fetch(`/api/shares/${selectedId}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("读取失败");
        const payload = (await response.json()) as { content: unknown };
        setJsonText(JSON.stringify(payload.content, null, 2));
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setJsonText("无法读取这个 JSON 文件。\n请稍后再试。");
      })
      .finally(() => setIsJsonLoading(false));
    return () => controller.abort();
  }, [selectedId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    setUploading(true);
    const data = new FormData(event.currentTarget);
    data.set("file", file);
    try {
      const response = await fetch("/api/shares", { method: "POST", body: data });
      const payload = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !payload.id) throw new Error(payload.error || "分享失败");
      await loadShares(payload.id);
      setCategory("全部");
      setQuery("");
      setIsModalOpen(false);
      setFile(null);
      setFileHeader(null);
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
    const authorInput = formRef.current?.elements.namedItem("author") as HTMLInputElement | null;
    const versionInput = formRef.current?.elements.namedItem("version") as HTMLInputElement | null;
    if (authorInput && typeof validation.header.Author === "string") authorInput.value = validation.header.Author;
    if (versionInput && typeof validation.header.Version === "string") versionInput.value = validation.header.Version;
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Shigure 首页">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Shigure</span>
        </a>
        <div className="header-actions">
          <span className="format-note"><i /> JSON ONLY · MAX 200 KB</span>
          <button className="primary-button" type="button" onClick={() => { setNotice(""); setIsModalOpen(true); }}>
            <span aria-hidden="true">＋</span> 分享 JSON
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span>01</span> 小文件分享站</div>
        <h1>让好用的配置，<br /><em>被更多人发现。</em></h1>
        <p>上传、浏览、查看与下载社区分享的 JSON 文件。轻量、清晰，不让有价值的配置藏在聊天记录里。</p>
        <div className="hero-meta">
          <span>{shares.length.toString().padStart(2, "0")} 份公开分享</span>
          <span>即时查看</span>
          <span>无需解压</span>
        </div>
      </section>

      <section className="library" aria-labelledby="library-title">
        <div className="section-heading">
          <div>
            <span className="section-index">02</span>
            <h2 id="library-title">分享库</h2>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">搜索分享</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文件、作者或专精" />
          </label>
        </div>

        <div className="category-tabs" role="tablist" aria-label="按职业筛选">
          {categories.map((item) => (
            <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => setCategory(item)}>
              {item}<sup>{item === "全部" ? shares.length : shares.filter((share) => share.profession === item).length}</sup>
            </button>
          ))}
        </div>

        <div className="explorer-shell">
          <div className="share-tabs" role="tablist" aria-label="分享内容">
            <div className="list-label"><span>文件 / 分享者</span><span>大小</span></div>
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
                <span className="file-icon">{'{ }'}</span>
                <span className="tab-copy">
                  <strong>{item.filename}</strong>
                  <small>{item.author} · {item.specialization}</small>
                </span>
                <span className="tab-size">{formatSize(item.size)}</span>
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
                  <a className="download-button" href={`/api/shares/${selected.id}/download`} download>
                    下载 <span aria-hidden="true">↓</span>
                  </a>
                </div>
                <div className="file-details">
                  <dl><dt>作者</dt><dd>{selected.author}</dd></dl>
                  <dl><dt>版本</dt><dd>{selected.version}</dd></dl>
                  <dl><dt>职业</dt><dd>{selected.profession}</dd></dl>
                  <dl><dt>专精</dt><dd>{selected.specialization}</dd></dl>
                </div>
                <p className="description">{selected.description}</p>
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
        <div><span className="brand-mark small">S</span><strong>Shigure</strong></div>
        <p>轻量 JSON 分享，让灵感持续流动。</p>
        <span>© 2026 SHIGURE</span>
      </footer>

      {notice && !isModalOpen && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="关闭提示">×</button></div>}

      {isModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !uploading) setIsModalOpen(false); }}>
          <section className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
            <div className="modal-header">
              <div><span className="preview-kicker">NEW SHARE</span><h2 id="share-title">分享一个 JSON</h2></div>
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={uploading} aria-label="关闭">×</button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>作者<input name="author" required maxLength={40} placeholder="填写分享作者" /></label>
                <label>版本<input name="version" required maxLength={20} placeholder="例如 1.2.0" /></label>
                <label>职业<select name="profession" required defaultValue=""><option value="" disabled>选择职业</option>{professions.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>专精<input name="specialization" required maxLength={40} placeholder="例如 戒律" /></label>
                <label className="full-width">描述<textarea name="description" required maxLength={240} rows={3} placeholder="简单说说这个文件能做什么" /></label>
              </div>
              <label className="file-drop" data-has-file={Boolean(file)}>
                <input type="file" name="file" accept="application/json,.json" required onChange={(event) => void handleFileSelection(event.target.files?.[0] ?? null)} />
                <span className="upload-symbol" aria-hidden="true">↥</span>
                <strong>{file ? file.name : "选择 JSON 文件"}</strong>
                <small>{file ? `${formatSize(file.size)} / 200 KB` : "仅支持 .json · 最大 200 KB"}</small>
              </label>
              <div className="standard-card" data-valid={Boolean(fileHeader)}>
                <div>
                  <span>{fileHeader ? "✓ 格式符合标准" : "文件开头标准"}</span>
                  {fileHeader && <strong>已识别全部 5 个必需字段</strong>}
                </div>
                <code>Id · Name · Author · Version · Enabled<br />顺序与值不限</code>
              </div>
              {notice && <p className="form-notice" role="alert">{notice}</p>}
              <button className="submit-button" type="submit" disabled={uploading}>{uploading ? "正在分享…" : "确认分享"}<span>→</span></button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
