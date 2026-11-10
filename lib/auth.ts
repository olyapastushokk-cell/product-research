// Shared by proxy.ts and server actions. Cookie holds a hash of APP_PASSWORD,
// never the password itself.
export const AUTH_COOKIE = "pr_auth";

export async function authToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`product-research:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
