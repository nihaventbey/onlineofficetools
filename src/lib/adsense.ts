export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-XXXXXXXXXXXXXXXX";

export const ADSENSE_SLOTS = {
  horizontalTop: "1234567890",
  verticalSidebar: "2345678901",
  horizontalBottom: "3456789012",
} as const;
