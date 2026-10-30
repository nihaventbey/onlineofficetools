# auth.md

You are an agent. This service (**Online Office Tools** — `https://onlineofficetools.com`) supports **agentic registration**: discover → register → (claim if needed) → exchange for an `access_token` → call API / execute tools → handle revocation. Follow the steps in order.

Online Office Tools is a privacy-first web application providing 65+ in-browser office utilities (PDF Studio, image editors, video/audio converters, calculators, and developer utilities). All public tools execute 100% client-side in the browser with zero file uploads and no mandatory authentication, while authenticated/registered agents can provision scoped credentials via the endpoints below.

## Step 1 — Discover

### 1a. Fetch Protected Resource Metadata (RFC 9728)

```http
GET https://onlineofficetools.com/.well-known/oauth-protected-resource
Accept: application/json
```

Response:

```json
{
  "resource": "https://onlineofficetools.com",
  "resource_name": "Online Office Tools",
  "resource_logo_uri": "https://onlineofficetools.com/logo.png",
  "authorization_servers": ["https://onlineofficetools.com"],
  "scopes_supported": ["public:read", "tools:execute", "admin:write"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://onlineofficetools.com/auth.md"
}
```

### 1b. Fetch Authorization Server Metadata (RFC 8414)

```http
GET https://onlineofficetools.com/.well-known/oauth-authorization-server
Accept: application/json
```

Response:

```json
{
  "issuer": "https://onlineofficetools.com",
  "authorization_endpoint": "https://onlineofficetools.com/api/auth/authorize",
  "token_endpoint": "https://onlineofficetools.com/api/auth/token",
  "revocation_endpoint": "https://onlineofficetools.com/api/auth/revoke",
  "device_authorization_endpoint": "https://onlineofficetools.com/api/auth/device",
  "jwks_uri": "https://onlineofficetools.com/.well-known/jwks.json",
  "grant_types_supported": [
    "authorization_code",
    "refresh_token",
    "client_credentials",
    "urn:ietf:params:oauth:grant-type:device_code",
    "urn:ietf:params:oauth:grant-type:jwt-bearer",
    "urn:workos:agent-auth:grant-type:claim"
  ],
  "agent_auth": {
    "skill": "https://onlineofficetools.com/auth.md",
    "register_uri": "https://onlineofficetools.com/api/auth/identity",
    "identity_endpoint": "https://onlineofficetools.com/api/auth/identity",
    "claim_uri": "https://onlineofficetools.com/api/auth/claim",
    "claim_endpoint": "https://onlineofficetools.com/api/auth/claim",
    "revocation_uri": "https://onlineofficetools.com/api/auth/revoke",
    "events_endpoint": "https://onlineofficetools.com/api/auth/events",
    "policy_uri": "https://onlineofficetools.com/en/privacy",
    "identity_types_supported": ["identity_assertion", "anonymous"],
    "credential_types_supported": ["bearer_token", "jwt-bearer"],
    "identity_assertion": {
      "assertion_types_supported": [
        "urn:ietf:params:oauth:token-type:id-jag",
        "verified_email"
      ],
      "credential_types_supported": ["bearer_token", "jwt-bearer"],
      "claim_uri": "https://onlineofficetools.com/api/auth/claim",
      "revocation_uri": "https://onlineofficetools.com/api/auth/revoke"
    },
    "anonymous": {
      "credential_types_supported": ["bearer_token", "jwt-bearer", "anonymous"],
      "claim_uri": "https://onlineofficetools.com/api/auth/claim"
    },
    "events_supported": [
      "https://schemas.workos.com/events/agent/auth/identity/assertion/revoked"
    ]
  }
}
```

## Step 2 — Pick a Registration Method

1. **Identity Assertion (`identity_assertion` + ID-JAG `urn:ietf:params:oauth:token-type:id-jag`)**: Use when you have an upstream user session and can mint an audience-bound ID-JAG JWT.
2. **Verified Email (`identity_assertion` + `verified_email`)**: Use when you have a verified user email and require a claim ceremony (`claim_uri`).
3. **Anonymous (`anonymous`)**: Use when acting without a user identity. Returns an immediate `identity_assertion` and optional `claim_token` for deferred user ownership.

## Step 3 — Register (`POST /api/auth/identity`)

### Option A: `identity_assertion` (ID-JAG or `verified_email`)

```http
POST https://onlineofficetools.com/api/auth/identity
Content-Type: application/json

{
  "type": "identity_assertion",
  "assertion_type": "urn:ietf:params:oauth:token-type:id-jag",
  "assertion": "<your ID-JAG JWT>"
}
```

### Option B: `anonymous`

```http
POST https://onlineofficetools.com/api/auth/identity
Content-Type: application/json

{
  "type": "anonymous"
}
```

Response (`200 OK`):

```json
{
  "registration_id": "reg_oot_public_agent",
  "registration_type": "anonymous",
  "identity_assertion": "<service-signed JWT>",
  "claim_url": "https://onlineofficetools.com/api/auth/claim",
  "claim_token": "clm_oot_public_agent",
  "scopes": ["public:read", "tools:execute"]
}
```

## Step 4 — Claim Ceremony (Optional / When Required)

```http
POST https://onlineofficetools.com/api/auth/claim
Content-Type: application/json

{
  "claim_token": "clm_oot_public_agent",
  "email": "user@example.com"
}
```

Surface `verification_uri` and `user_code` from `claim_attempt` to the user and poll `POST https://onlineofficetools.com/api/auth/token` with `grant_type=urn:workos:agent-auth:grant-type:claim`.

## Step 5 — Exchange the Assertion for an Access Token

```http
POST https://onlineofficetools.com/api/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<identity_assertion>
```

Response (`200 OK`):

```json
{
  "access_token": "public_agent_anonymous",
  "token_type": "Bearer",
  "expires_in": 86400,
  "scope": "public:read tools:execute"
}
```

## Step 6 — Use the Credential

Send the token in the `Authorization` HTTP header using the `Bearer` scheme:

```http
GET https://onlineofficetools.com/en
Authorization: Bearer public_agent_anonymous
Accept: text/markdown
```

## Step 7 — Revocation

To revoke an issued `access_token` per RFC 7009:

```http
POST https://onlineofficetools.com/api/auth/revoke
Content-Type: application/x-www-form-urlencoded

token=public_agent_anonymous&token_type_hint=access_token
```

Upstream identity providers may also deliver Security Event Tokens (RFC 8417 / RFC 8935) to `POST https://onlineofficetools.com/api/auth/events` for `https://schemas.workos.com/events/agent/auth/identity/assertion/revoked`.

## Discovery Endpoints Summary
- **A2A Agent Card**: `/.well-known/agent-card.json`
- **Personal Agent Protocol (Poppy)**: `/.well-known/poppy.json`
- **OAuth Authorization Server (RFC 8414)**: `/.well-known/oauth-authorization-server`
- **OAuth Protected Resource (RFC 9728)**: `/.well-known/oauth-protected-resource`
- **API Catalog (RFC 9727)**: `/.well-known/api-catalog`
- **Agent Resource Discovery (ARD)**: `/.well-known/ai-catalog.json`
- **MCP Server Card (SEP-1649)**: `/.well-known/mcp/server-card.json`
- **Agent Skills (RFC v0.2.0)**: `/.well-known/agent-skills/index.json`

## Claims
- `public:read`: Read-only access to site pages, metadata, markdown negotiation endpoints, and skill manifests.
- `tools:execute`: Execution of in-browser client-side WebAssembly tools via WebMCP or DOM automation.
- `admin:write`: Administrative CMS access (restricted to authorized administrators).
