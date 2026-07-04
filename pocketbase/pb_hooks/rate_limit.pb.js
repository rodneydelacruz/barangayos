// Rate limiting hook placeholder
// This is a PocketBase JS hook (scripting) that enforces client-awareness of 429s.
// Actual rate limiting is configured via PocketBase's built-in rate limiter or a custom middleware.
//
// To enable client-side 429 handling:
// 1. Configure PocketBase rate limits via the Admin UI or config
// 2. The frontend error handler in src/api/errorHandler.ts already detects 429 and shows a message
//
// Example server-side rate limit check (PocketBase JS hook):
//
// routerUse((c) => {
//   const key = c.remoteAddr()
//   const limit = 100
//   const window = 60000
//   // ... rate limit logic ...
//   if (exceeded) return c.json(429, { message: 'Rate limit exceeded' })
//   return c.next()
// }, 'before')
