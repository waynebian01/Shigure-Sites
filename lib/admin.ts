import { getChatGPTUser } from "../app/chatgpt-auth";

const ADMIN_EMAILS = new Set(["bian.wayne@gmail.com"]);

export function isAdminEmail(email: string) {
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}

export async function getAdminStatus() {
  const user = await getChatGPTUser();
  return {
    authenticated: Boolean(user),
    isAdmin: Boolean(user && isAdminEmail(user.email)),
    email: user?.email ?? null,
    displayName: user?.displayName ?? null,
  };
}
