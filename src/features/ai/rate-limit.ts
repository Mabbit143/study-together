const sessions = new Map<string, { count: number; expires: number }>();
export function consumeRateLimit(id: string, now = Date.now()): boolean {
 for (const [key, value] of sessions) if (value.expires <= now) sessions.delete(key);
 const entry = sessions.get(id) ?? { count: 0, expires: now + 60 * 60 * 1000 };
 if (entry.count >= 30) return false;
 entry.count++; sessions.set(id, entry); return true;
}
export function resetRateLimits() { sessions.clear(); }
