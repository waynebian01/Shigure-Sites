"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const username = String(data.get("username") ?? "");
    const password = String(data.get("password") ?? "");
    const passwordConfirmation = String(data.get("passwordConfirmation") ?? "");
    setError("");

    if (isRegister && password !== passwordConfirmation) {
      setError("两次输入的密码不一致");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || (isRegister ? "注册失败" : "登录失败"));
      window.location.href = "/profile";
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "请求失败，请稍后重试");
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/" aria-label="返回 Shigure 首页">
        <span className="brand-mark" aria-hidden="true">
          <img src="/brand/arasaka-icon-64.png" width={64} height={64} alt="" />
        </span>
        <span>SHIGURE</span>
      </Link>
      <section className="auth-card" aria-labelledby="auth-title">
        <span className="auth-eyebrow">{isRegister ? "CREATE ACCOUNT" : "WELCOME BACK"}</span>
        <h1 id="auth-title">{isRegister ? "注册 Shigure" : "登录 Shigure"}</h1>
        <p>
          {isRegister
            ? "创建独立的 Shigure 账号。登录后，你分享的 JSON 会自动归档到个人中心。"
            : "使用你的 Shigure 账号和密码登录，继续管理个人 JSON。"}
        </p>

        <form className="auth-form" onSubmit={submit}>
          <label>
            账号
            <input
              name="username"
              type="text"
              minLength={3}
              maxLength={24}
              autoComplete="username"
              required
              autoFocus
              placeholder="3–24 个字符"
            />
          </label>
          <label>
            密码
            <input
              name="password"
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              placeholder="至少 8 个字符"
            />
          </label>
          {isRegister && (
            <label>
              确认密码
              <input
                name="passwordConfirmation"
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
                placeholder="再次输入密码"
              />
            </label>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-primary" type="submit" disabled={submitting}>
            {submitting ? (isRegister ? "正在创建…" : "正在登录…") : (isRegister ? "创建账号" : "登录")}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <div className="auth-footnote">
          <span>{isRegister ? "已有账号？" : "还没有账号？"}</span>
          <Link href={isRegister ? "/login" : "/register"}>
            {isRegister ? "返回登录" : "立即注册"}
          </Link>
        </div>
      </section>
    </main>
  );
}
