// Shared between check-entitlement (client pre-check) and analyze-entry
// (the real, authoritative enforcement point). Crisis-flagged entries never
// count against the limit — blocking someone mid-crisis behind a paywall
// would be actively harmful.
export const FREE_MONTHLY_LIMIT = 5;

export async function getEntitlement(SUPABASE_URL: string, SERVICE_ROLE_KEY: string, userId: string) {
  const subRes = await fetch(
    `${SUPABASE_URL}/rest/v1/subscribers?user_id=eq.${userId}&select=is_premium,premium_expires_at`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  const subRows = await subRes.json();
  const sub = Array.isArray(subRows) && subRows[0] ? subRows[0] : null;
  const isPremium = !!sub?.is_premium && (!sub.premium_expires_at || new Date(sub.premium_expires_at) > new Date());

  if (isPremium) {
    return { is_premium: true, used: 0, limit: FREE_MONTHLY_LIMIT, allowed: true };
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/journal_entries?user_id=eq.${userId}&crisis_flag=eq.false` +
      `&created_at=gte.${monthStart.toISOString()}&select=id`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  const rows = await countRes.json();
  const used = Array.isArray(rows) ? rows.length : 0;

  return { is_premium: false, used, limit: FREE_MONTHLY_LIMIT, allowed: used < FREE_MONTHLY_LIMIT };
}
