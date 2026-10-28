# Auth.md

Agent registration and authentication metadata for Online Office Tools (https://onlineofficetools.com).

## Overview
Online Office Tools is a privacy-first web application providing 60+ in-browser office utilities (PDF converters, image editors, text utilities, and document processors). All document processing executes 100% client-side in the user's browser via WebAssembly and JavaScript.

## Public Tools & Zero-Auth Access
- **Access Level**: Public / Unauthenticated
- **Requirement**: No API keys, credentials, or pre-registration are needed to use public tools or inspect site metadata.
- **Privacy Guarantee**: Zero file uploads to servers. All operations execute in-memory locally within the browser context.
- **Agent Policy**: AI agents (OpenAI GPT, Anthropic Claude, Google Gemini, Perplexity, autonomous agent frameworks) are permitted and encouraged to crawl, parse, and execute tools.

## Agent Registration & Protocols
- **Registration URI**: `https://onlineofficetools.com/auth.md`
- **Supported Identity Types**: `agent`, `user`, `service`
- **Supported Credential Types**: `bearer_token`, `anonymous`
- **Token Endpoint**: `https://onlineofficetools.com/api/auth/token`
- **Revocation Endpoint**: `https://onlineofficetools.com/api/auth/revoke`
- **Claim URI**: `https://onlineofficetools.com/auth.md#claims`
- **Policy URI**: `https://onlineofficetools.com/en/privacy`

## Discovery Endpoints
- **Personal Agent Protocol (Poppy)**: `/.well-known/poppy.json`
- **OAuth Authorization Server (RFC 8414)**: `/.well-known/oauth-authorization-server`
- **OAuth Protected Resource (RFC 9728)**: `/.well-known/oauth-protected-resource`
- **API Catalog (RFC 9727)**: `/.well-known/api-catalog`
- **Agent Resource Discovery (ARD)**: `/.well-known/ai-catalog.json`
- **MCP Server Card (SEP-1649)**: `/.well-known/mcp/server-card.json`
- **Agent Skills (RFC v0.2.0)**: `/.well-known/agent-skills/index.json`
- **Robots & Content Signals**: `/robots.txt` (`Content-Signal: ai-train=no, search=yes, ai-input=yes`)

## DNS for AI Discovery (DNS-AID)
DNS-AID discovery records (draft-mozleywilliams-dnsop-dnsaid / RFC 9460) configured for `onlineofficetools.com`:
- `_index._agents.onlineofficetools.com. IN HTTPS 1 onlineofficetools.com. alpn="h2,h3" port="443"`
- `_a2a._agents.onlineofficetools.com. IN HTTPS 1 onlineofficetools.com. alpn="h2,h3" port="443"`
- Public discovery zones are signed with DNSSEC.

## Claims
Agents and clients operate under the following permission scopes:
- `public:read`: Read-only access to site pages, metadata, markdown negotiation endpoints, and skill manifests (granted to all agents by default).
- `tools:execute`: Execution of in-browser client-side WebAssembly tools via WebMCP or DOM automation.
- `admin:write`: Administrative CMS access (restricted to authorized administrators via Supabase OAuth).
