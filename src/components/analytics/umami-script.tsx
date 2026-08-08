import Script from "next/script";
import { UMAMI_SCRIPT_PATH, resolveUmamiWebsiteId } from "@/lib/umami";

/** Self-hosted Umami — injects only when UMAMI_WEBSITE_ID is set. */
export function UmamiScript() {
  const websiteId = resolveUmamiWebsiteId();
  if (!websiteId) return null;

  return (
    <Script
      defer
      src={UMAMI_SCRIPT_PATH}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}
