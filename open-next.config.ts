import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No R2 incremental cache for now — avoids extra Cloudflare product setup.
// Pages are mostly static (revalidate = false); deploy refreshes content.
export default defineCloudflareConfig({});
