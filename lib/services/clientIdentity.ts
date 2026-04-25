import { createHash } from "crypto";
import { headers } from "next/headers";

export async function getClientHash(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for") ?? "0.0.0.0";
  const userAgent = requestHeaders.get("user-agent") ?? "unknown";
  const language = requestHeaders.get("accept-language") ?? "unknown";

  return createHash("sha256")
    .update(`${forwardedFor}|${userAgent}|${language}`)
    .digest("hex");
}
