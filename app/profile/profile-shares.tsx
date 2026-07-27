"use client";

import { useState } from "react";
import Link from "next/link";

export type ProfileShare = {
  id: string;
  filename: string;
  author: string;
  profession: string;
  specialization: string;
  description: string;
  size: number;
  createdAt: number;
};

function formatSize(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ProfileShares({ initialShares }: { initialShares: ProfileShare[] }) {
  const [shares, setShares] = useState(initialShares);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function deleteShare(share: ProfileShare) {
    if (!window.confirm(`确认删除 ${share.filename}？此操作无法撤销。`)) return;
    setDeletingId(share.id);
    setNotice("");
    try {
      const response = await fetch(`/api/shares/${share.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { deleted?: boolean; error?: string };
      if (!response.ok || !payload.deleted) throw new Error(payload.error || "删除失败");
      setShares((current) => current.filter((item) => item.id !== share.id));
      setNotice(`已删除 ${share.filename}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "删除失败，请稍后重试。");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="profile-content" aria-labelledby="my-shares-title">
      <div className="profile-section-heading">
        <div>
          <span className="section-index">02</span>
          <h2 id="my-shares-title">我的 JSON</h2>
        </div>
        <span>{shares.length} 份分享</span>
      </div>
      {notice && <p className="profile-notice" role="status">{notice}</p>}
      {shares.length === 0 ? (
        <div className="profile-empty">
          <span>{'{ }'}</span>
          <h3>还没有个人分享</h3>
          <p>从首页上传第一份 JSON，它会自动出现在这里。</p>
          <Link className="auth-primary" href="/#top">去分享 JSON <span>→</span></Link>
        </div>
      ) : (
        <div className="profile-share-grid">
          {shares.map((share, index) => (
            <article className="profile-share-card" key={share.id}>
              <div className="profile-share-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="profile-share-copy">
                <span>{share.profession} · {share.specialization}</span>
                <h3>{share.filename}</h3>
                <p>{share.description}</p>
                <small>{share.author} · {formatSize(share.size)} · {formatDate(share.createdAt)}</small>
              </div>
              <div className="profile-share-actions">
                <a href={`/api/shares/${share.id}/download`} download>下载</a>
                <button
                  type="button"
                  disabled={deletingId === share.id}
                  onClick={() => void deleteShare(share)}
                >
                  {deletingId === share.id ? "删除中…" : "删除"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
