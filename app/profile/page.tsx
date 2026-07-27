import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { listSharesByOwner, type ShareRecord } from "../../lib/shares";
import { ensureUser } from "../../lib/users";
import ProfileShares from "./profile-shares";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const authenticatedUser = await requireChatGPTUser("/profile");
  const profile = await ensureUser(authenticatedUser);
  const shares = await listSharesByOwner(profile.id);
  const totalBytes = shares.reduce(
    (sum: number, share: ShareRecord) => sum + share.size,
    0,
  );

  return (
    <main className="profile-page">
      <header className="profile-topbar">
        <Link className="brand" href="/" aria-label="返回 Shigure 首页">
          <span className="brand-mark" aria-hidden="true">
            <img src="/brand/arasaka-icon-64.png" width={64} height={64} alt="" />
          </span>
          <span>Shigure</span>
        </Link>
        <nav aria-label="个人中心导航">
          <Link href="/">公共分享库</Link>
          <a href={chatGPTSignOutPath("/")}>退出</a>
        </nav>
      </header>

      <section className="profile-hero" aria-labelledby="profile-title">
        <div className="profile-identity">
          <span className="profile-avatar" aria-hidden="true">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <span className="auth-eyebrow">PERSONAL ARCHIVE</span>
            <h1 id="profile-title">{profile.displayName}</h1>
            <p>{profile.email}</p>
          </div>
        </div>
        <div className="profile-stats">
          <dl><dt>个人分享</dt><dd>{shares.length}</dd></dl>
          <dl><dt>文件总量</dt><dd>{totalBytes < 1024 ? `${totalBytes} B` : `${(totalBytes / 1024).toFixed(1)} KB`}</dd></dl>
          <dl><dt>加入时间</dt><dd>{new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "short" }).format(new Date(profile.createdAt))}</dd></dl>
        </div>
      </section>

      <ProfileShares initialShares={shares.map((share: ShareRecord) => ({
        id: share.id,
        filename: share.filename,
        author: share.author,
        profession: share.profession,
        specialization: share.specialization,
        description: share.description,
        size: share.size,
        createdAt: share.createdAt,
      }))} />
    </main>
  );
}
