# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest | Yes |
| < latest | No |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please **do not** open a public issue.

Instead, send a private report to the repository maintainer via one of these channels:

1. **GitHub Security Advisory** — Use the "Report a vulnerability" link in the repository's Security tab
2. **Email** — Contact the repository owner directly (check commit history for contact)

We will acknowledge receipt within 48 hours and provide an estimated timeline for a fix.

### What to include

- Description of the vulnerability
- Steps to reproduce (proof of concept if possible)
- Potential impact
- Suggested fix (optional)

## Security Architecture

### Authentication

- **Password-based auth** managed by PocketBase (bcrypt hashing)
- **Session tokens** stored in PocketBase's auth store (memory, not localStorage)
- **Rate limiting** configurable via PocketBase admin UI or JS hooks

### Authorization (RBAC)

Three roles with granular collection-level rules enforced server-side by PocketBase:

| Role | Scope |
|------|-------|
| **Admin** | Full access to all collections and user management |
| **Staff** | Create/update on records, documents, residents; limited delete |
| **Viewer** | Read-only access to most collections |

Server-side rules in PocketBase migration files (`pocketbase/pb_migrations/`) use `@request.auth.role` expressions to enforce access. Example:

```javascript
// Only admins can delete records
"deleteRule": "@request.auth.role = \"admin\""
```

### Network Security

- **Cloudflare Tunnel** — No open inbound ports. Outbound-only connection from the server to Cloudflare's edge network
- **WAF** — Cloudflare Web Application Firewall protects against common exploits (SQL injection, XSS, etc.)
- **HTTPS** — All traffic through the tunnel is encrypted with TLS
- **Local Network** — LAN users can access the server directly (HTTP only, internal network assumed trusted)

### Data Security

- **Database** — SQLite file in `pb_data/`, access restricted to the PocketBase process
- **Backups** — Litestream replicates to Cloudflare R2 (S3-compatible, encrypted in transit)
- **Environment Files** — `.env.production` and `.env.local` are gitignored, never committed
- **No secrets in code** — API keys, tokens, and passwords are always in environment variables or gitignored files

### Frontend Security

- **Input validation** — Client-side validation before sending to API
- **Error handling** — Generic error messages prevent information leakage
- **Content Security** — Vite builds with proper Content-Type headers

## Best Practices for Deployment

1. **Use HTTPS only** — Always access the app through the Cloudflare Tunnel (HTTPS). Do not expose PocketBase directly to the internet.

2. **Strong admin passwords** — Use unique, complex passwords for the PocketBase admin account.

3. **Regular updates** — Keep PocketBase binaries updated to the latest version for security patches.

4. **Review user accounts** — Periodically audit user accounts and remove inactive ones.

5. **Database backups** — Enable Litestream replication and verify backups periodically.

6. **Monitor logs** — Check PocketBase logs regularly for unusual activity.
7. **Audit trail** — The finance module has a dedicated audit trail (`finance_audit_logs`) that records every financial create/update/delete operation with user attribution. Review it periodically for unauthorized changes.

## Dependency Security

We use `npm audit` in CI to check for known vulnerabilities in dependencies:

```bash
npm audit --audit-level=high
```

If a critical vulnerability is found in a dependency, an issue will be opened and patched as soon as possible.
