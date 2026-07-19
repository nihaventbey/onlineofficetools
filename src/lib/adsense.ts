/**
 * AdSense configuration types + pure helpers.
 * No Supabase/server imports here — safe to use from client components.
 * CMS-backed values are resolved server-side in `@/lib/cms` (getAdSenseConfig)
 * and merged with these defaults via `resolveAdSenseConfig`.
 */

export type AdPlacementKey = "top" | "sidebar" | "bottom" | "toolInline";

export const adPlacementKeys: AdPlacementKey[] = [
  "top",
  "sidebar",
  "bottom",
  "toolInline",
];

export type AdSenseConfig = {
  enabled: boolean;
  clientId: string;
  slots: Record<AdPlacementKey, string>;
  placements: Record<AdPlacementKey, boolean>;
};

/** Fallback publisher ID used when no env var and no CMS value are set. */
const DEFAULT_CLIENT = "ca-pub-3156607388655691";

/** Obvious placeholder slot IDs — never treated as configured. */
const PLACEHOLDER_SLOTS: Record<AdPlacementKey, string> = {
  top: "1234567890",
  sidebar: "2345678901",
  bottom: "3456789012",
  toolInline: "4567890123",
};

/** site_settings keys used to persist AdSense config from the admin panel. */
export const ADSENSE_SETTING_KEYS = {
  enabled: "adsense_enabled",
  clientId: "adsense_client_id",
  slotTop: "adsense_slot_top",
  slotSidebar: "adsense_slot_sidebar",
  slotBottom: "adsense_slot_bottom",
  slotToolInline: "adsense_slot_tool_inline",
  placementTop: "adsense_placement_top",
  placementSidebar: "adsense_placement_sidebar",
  placementBottom: "adsense_placement_bottom",
  placementToolInline: "adsense_placement_tool_inline",
} as const;

export const SLOT_SETTING_KEY_BY_PLACEMENT: Record<AdPlacementKey, string> = {
  top: ADSENSE_SETTING_KEYS.slotTop,
  sidebar: ADSENSE_SETTING_KEYS.slotSidebar,
  bottom: ADSENSE_SETTING_KEYS.slotBottom,
  toolInline: ADSENSE_SETTING_KEYS.slotToolInline,
};

export const PLACEMENT_SETTING_KEY_BY_PLACEMENT: Record<AdPlacementKey, string> = {
  top: ADSENSE_SETTING_KEYS.placementTop,
  sidebar: ADSENSE_SETTING_KEYS.placementSidebar,
  bottom: ADSENSE_SETTING_KEYS.placementBottom,
  toolInline: ADSENSE_SETTING_KEYS.placementToolInline,
};

/** Consent banner storage key + the event it dispatches on choice. */
export const CONSENT_STORAGE_KEY = "oot-ads-consent";
export const CONSENT_CHANGE_EVENT = "oot-consent-change";

export type ConsentChangeDetail = { accepted: boolean };

function envClient(): string {
  return process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || DEFAULT_CLIENT;
}

/** True when the publisher ID looks like a real AdSense client (not a placeholder). */
export function isValidClient(client: string | null | undefined): boolean {
  if (!client) return false;
  const c = client.trim();
  if (!c.startsWith("ca-pub-")) return false;
  if (c.includes("XXXXXXXX")) return false;
  return /^ca-pub-\d{10,}$/.test(c);
}

/** True when a slot id is numeric and not one of the bundled placeholders. */
export function isValidSlot(slot: string | null | undefined): boolean {
  if (!slot) return false;
  const s = slot.trim();
  if (!s) return false;
  if ((Object.values(PLACEHOLDER_SLOTS) as string[]).includes(s)) return false;
  return /^\d+$/.test(s);
}

export const DEFAULT_ADSENSE_CONFIG: AdSenseConfig = {
  enabled: true,
  clientId: DEFAULT_CLIENT,
  slots: { ...PLACEHOLDER_SLOTS },
  placements: { top: true, sidebar: true, bottom: true, toolInline: true },
};

export type PartialAdSenseValues = {
  enabled?: boolean | null;
  clientId?: string | null;
  slots?: Partial<Record<AdPlacementKey, string | null>>;
  placements?: Partial<Record<AdPlacementKey, boolean | null>>;
};

export type AdSenseEnvOverrides = {
  adsenseClient?: string | null;
};

/**
 * Merge CMS-provided AdSense values with env/defaults.
 * - `enabled` defaults to true (ads work out of the box) unless explicitly
 *   turned off in the CMS, and always requires a valid client id.
 * - Slot/placement values fall back to disabled placeholders/enabled toggles
 *   when missing or invalid.
 */
export function resolveAdSenseConfig(
  cmsValues?: PartialAdSenseValues | null,
  env?: AdSenseEnvOverrides,
): AdSenseConfig {
  const fallbackClient = env?.adsenseClient?.trim() || envClient();
  const cmsClient = cmsValues?.clientId?.trim();
  const clientId =
    cmsClient && isValidClient(cmsClient)
      ? cmsClient
      : isValidClient(fallbackClient)
        ? fallbackClient
        : DEFAULT_CLIENT;

  const slots: Record<AdPlacementKey, string> = { ...PLACEHOLDER_SLOTS };
  const placements: Record<AdPlacementKey, boolean> = {
    top: true,
    sidebar: true,
    bottom: true,
    toolInline: true,
  };

  for (const key of adPlacementKeys) {
    const slotValue = cmsValues?.slots?.[key];
    if (slotValue && isValidSlot(slotValue)) {
      slots[key] = slotValue.trim();
    }
    const placementValue = cmsValues?.placements?.[key];
    if (typeof placementValue === "boolean") {
      placements[key] = placementValue;
    }
  }

  const enabledFlag =
    cmsValues?.enabled === undefined || cmsValues?.enabled === null
      ? true
      : cmsValues.enabled;
  const enabled = enabledFlag && isValidClient(clientId);

  return { enabled, clientId, slots, placements };
}

/** True when a specific placement should actually render an ad unit. */
export function isAdSlotEnabled(
  config: AdSenseConfig,
  placement: AdPlacementKey,
  slotOverride?: string,
): boolean {
  const slot = slotOverride ?? config.slots[placement];
  return config.enabled && config.placements[placement] && isValidSlot(slot);
}
