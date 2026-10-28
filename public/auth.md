# Authentication & Agent Access for Online Office Tools

Welcome to **Online Office Tools** (https://onlineofficetools.com).

## Public Web Tools Architecture (Zero-Auth)
All office utilities (PDF, documents, spreadsheets, images, video, audio, text, and developer tools) run **100% in the user's browser (client-side)**:
- **No API keys or registration required** for web and agent access to public tools.
- **Privacy Guarantee**: Document contents, images, and files never leave the browser. No uploads occur to our servers.
- **Autonomous Agents**: AI agents (OpenAI, Anthropic, Google Gemini, Perplexity) may freely inspect, scrape, and interact with all public tool pages (`/[lang]/tools/[slug]`).

## Agent Registration & Protocols
- **API Catalog**: `/.well-known/api-catalog` (RFC 9727)
- **Agent Resource Discovery (ARD)**: `/.well-known/ai-catalog.json`
- **MCP Server Card**: `/.well-known/mcp/server-card.json` (SEP-1649)
- **Agent Skills**: `/.well-known/agent-skills/index.json`
- **Content Signals**: `robots.txt` declares `Content-Signal: ai-train=no, search=yes, ai-input=yes`

## Administrative CMS API
Administrative routes under `/api/admin/*` and `/admin/*` require authorization:
- **Provider**: Supabase Auth (OAuth 2.0 / OpenID Connect)
- **Issuer**: `https://<supabase-project-id>.supabase.co/auth/v1`
- **Token Type**: Bearer (JWT)
