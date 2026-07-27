import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const themeScript = `
(() => {
  const root = document.documentElement;
  const valid = new Set(["system", "light", "dark"]);
  let preference = "system";

  try {
    const stored = localStorage.getItem("shigure-theme");
    if (stored && valid.has(stored)) preference = stored;
  } catch {}

  let resolved = preference;
  if (preference === "system") {
    try {
      resolved = typeof window.matchMedia === "function"
        ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
        : "dark";
    } catch {
      resolved = "dark";
    }
  }

  root.dataset.themePreference = preference;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
})();
`;

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "Shigure · JSON 小文件分享站";
  const description = "上传、浏览、查看与下载社区分享的轻量 JSON 文件。";
  return {
    metadataBase: new URL(origin),
    title,
    description,
    icons: {
      icon: [
        { url: "/brand/arasaka-icon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/brand/arasaka-icon-64.png", sizes: "64x64", type: "image/png" },
      ],
      apple: [{ url: "/brand/arasaka-icon-128.png", sizes: "128x128", type: "image/png" }],
    },
    openGraph: { title, description, type: "website", url: origin, images: [{ url: `${origin}/og.png`, width: 1734, height: 907, alt: "Shigure JSON 小文件分享站" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
