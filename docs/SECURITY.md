# Security Policy

## Supported Versions

Only the latest release receives security updates. We do not maintain backports for older versions.

| Version | Supported |
|---------|-----------|
| latest | ✅ Yes |
| < latest | ❌ No |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, **please do not** open a public issue.

### Private disclosure channels

1. **GitHub Security Advisory** — Navigate to the repository's **Security** tab and click **"Report a vulnerability"**. This creates a private advisory visible only to maintainers.

2. **Email** — Contact the repository maintainer directly. The maintainer's email can be found through the commit history on the repository's main branch.

### What to expect

| Step | Timeline |
|------|----------|
| Acknowledgment | Within 48 hours of your report |
| Initial assessment | Within 5 business days |
| Fix timeline communicated | Within 10 business days |
| Public disclosure | After a fix is released |

### What to include

- **Description** — A clear overview of the vulnerability
- **Steps to reproduce** — Detailed reproduction steps or proof of concept
- **Potential impact** — What an attacker could achieve by exploiting this
- **Suggested fix** — Optional, but appreciated

## Security Architecture

### Authentication

- **Password-based auth** managed by PocketBase with bcrypt password hashing
- **Session tokens** stored in PocketBase's in-memory auth store (not localStorage, reducing XSS exposure)
- **Rate limiting** configurable via PocketBase admin UI or JS hooks to prevent brute-force attacks
- **Session expiry** — Tokens expire and users are redirected to login automatically

### Authorization (RBAC)

Three roles with granular collection-level rules enforced **server-side** by PocketBase:

| Role | Scope |
|------|-------|
| **Admin** | Full access to all collections and user management |
| **Staff** | Create/update on records, documents, residents; limited delete |
| **Viewer** | Read-only access to most collections |

Server-side rules in PocketBase migration files (`backend/pb_migrations/`) use `@request.auth.role` expressions to enforce access:

```javascript
// Only admins can delete records
"deleteRule": "@request.auth.role = \"admin\""
```

> **Important:** Client-side route guards are for UX convenience only. All authorization is enforced server-side by PocketBase's collection rules. Modifying the frontend code cannot bypass access controls.

### Network Security

- **Cloudflare Tunnel** — No open inbound ports on the server. An outbound-only connection is established from the server to Cloudflare's edge network.
- **WAF** — Cloudflare Web Application Firewall protects against common web exploits (SQL injection, XSS, CSRF, etc.)
- **HTTPS** — All traffic through the tunnel is encrypted with TLS. Non-HTTPS connections are rejected by Cloudflare.
- **Local Network** — LAN users access the server directly over HTTP. The internal network is assumed to be trusted. PocketBase admin port (8090) should remain LAN-only.

### Data Security

- **Database** — SQLite file stored in `backend/pb_data/`, access restricted to the PocketBase process
- **Backups** — Database backups are encrypted in transit to S3-compatible storage (Cloudflare R2)
- **Environment Files** — `.env.production` and `.env.local` are gitignored, never committed to version control
- **No secrets in code** — API keys, tokens, and passwords are always in environment variables or gitignored files
- **PB_ENCRYPTION_KEY** — This key encrypts session data and must be kept secret. Generate with `openssl rand -hex 16` and store securely.

### Frontend Security

- **Input validation** — Client-side validation before sending data to the API (first line of defense; server-side validation in PocketBase is the authoritative check)
- **Error handling** — Generic error messages prevent information leakage about system internals
- **Content Security** — Vite builds with proper Content-Type headers and cache-control directives
- **Dependency auditing** — `npm audit` runs in CI to detect known vulnerabilities in dependencies

## Best Practices for Deployment

1. **Use HTTPS only** — Always access the app through the Cloudflare Tunnel (HTTPS). Do not expose PocketBase directly to the internet.

2. **Strong admin passwords** — Use unique, complex passwords for the PocketBase admin account. Consider a password manager.

3. **Regular updates** — Keep PocketBase binaries updated to the latest version. Check [PocketBase releases](https://github.com/pocketbase/pocketbase/releases) periodically.

4. **Review user accounts** — Periodically audit user accounts. Remove inactive or unnecessary accounts.

5. **Database backups** — Enable automatic backups in PocketBase Admin UI and verify backup files appear in your storage bucket.

6. **Monitor logs** — Check PocketBase logs regularly for unusual activity (failed login attempts, unauthorized access patterns, etc.).

7. **Review audit trail** — The finance module has a dedicated audit log (`finance_audit_logs`) that records every financial create/update/delete operation with user attribution. Review it periodically for unauthorized changes.

## Dependency Security

We use `npm audit` in CI to check for known vulnerabilities in dependencies:

```bash
cd frontend && npm audit --audit-level=high
```

- If a **critical** vulnerability is found, CI will flag it and work will begin on patching it
- If a **high** vulnerability is found in a direct dependency, an issue will be opened and prioritized
- **Moderate/low** vulnerabilities are tracked but may not be immediately patched

We encourage contributors to run `npm audit` locally before submitting pull requests.
