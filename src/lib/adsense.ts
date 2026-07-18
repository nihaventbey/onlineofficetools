export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-XXXXXXXXXXXXXXXX";

export const ADSENSE_SLOTS = {
  horizontalTop: "1234567890",
  verticalSidebar: "2345678901",
  horizontalBottom: "3456789012",
} as const;

/** True when publisher ID looks like a real AdSense client (not a placeholder). */
export function isAdSenseConfigured(): boolean {
  const client = ADSENSE_CLIENT.trim();
  if (!client.startsWith("ca-pub-")) return false;
  if (client.includes("XXXXXXXX")) return false;
  return /ca-pub-\d{10,}/.test(client);
}

export function isAdSlotConfigured(slot: string): boolean {
  if (!isAdSenseConfigured()) return false;
  const s = slot.trim();
  if (!s || s.includes("1234567890") || s.includes("2345678901") || s.includes("3456789012")) {
    return false;
  }
  return /^\d+$/.test(s);
}
