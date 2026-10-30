#!/usr/bin/env node
/**
 * Automates publishing DNS for AI Discovery (DNS-AID) records (RFC 9460 / draft-mozleywilliams-dnsop-dnsaid)
 * on Cloudflare for onlineofficetools.com.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN="your_token" CLOUDFLARE_ZONE_ID="your_zone_id" node scripts/setup-cloudflare-dns-aid.mjs
 */

const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const domain = process.env.DNS_AID_DOMAIN || "onlineofficetools.com";

if (!token || !zoneId) {
  console.error(
    "Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID environment variables.\n" +
      "Usage: CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ZONE_ID=... node scripts/setup-cloudflare-dns-aid.mjs",
  );
  process.exit(1);
}

const records = [
  {
    type: "SVCB",
    name: `_index._agents.${domain}`,
    data: {
      priority: 1,
      target: `${domain}.`,
      value: 'alpn="h2,h3" port="443" mandatory="alpn,port"',
    },
    ttl: 3600,
  },
  {
    type: "HTTPS",
    name: `_index._agents.${domain}`,
    data: {
      priority: 1,
      target: `${domain}.`,
      value: 'alpn="h2,h3" port="443"',
    },
    ttl: 3600,
  },
  {
    type: "SVCB",
    name: `_a2a._agents.${domain}`,
    data: {
      priority: 1,
      target: `${domain}.`,
      value: 'alpn="h2,h3" port="443" mandatory="alpn,port"',
    },
    ttl: 3600,
  },
  {
    type: "HTTPS",
    name: `_a2a._agents.${domain}`,
    data: {
      priority: 1,
      target: `${domain}.`,
      value: 'alpn="h2,h3" port="443"',
    },
    ttl: 3600,
  },
  {
    type: "SVCB",
    name: `_mcp._agents.${domain}`,
    data: {
      priority: 1,
      target: `${domain}.`,
      value: 'alpn="h2,h3" port="443" mandatory="alpn,port"',
    },
    ttl: 3600,
  },
  {
    type: "HTTPS",
    name: `_mcp._agents.${domain}`,
    data: {
      priority: 1,
      target: `${domain}.`,
      value: 'alpn="h2,h3" port="443"',
    },
    ttl: 3600,
  },
  {
    type: "TXT",
    name: `_index._agents.${domain}`,
    content: `"v=dnsaid1; a2a=_a2a._agents.${domain}; mcp=_mcp._agents.${domain}; card=https://${domain}/.well-known/agent-card.json; mcp_card=https://${domain}/.well-known/mcp/server-card.json"`,
    ttl: 3600,
  },
];

async function run() {
  for (const record of records) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(record),
      },
    );
    const json = await res.json();
    if (json.success) {
      console.log(`Created ${record.type} ${record.name}`);
    } else {
      console.warn(`Warning on ${record.type} ${record.name}:`, json.errors);
    }
  }

  // Enable DNSSEC
  const dnssecRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dnssec`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "active" }),
    },
  );
  const dnssecJson = await dnssecRes.json();
  console.log(
    "DNSSEC status:",
    dnssecJson.result?.status || dnssecJson.errors,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
