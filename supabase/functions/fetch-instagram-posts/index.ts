// Supabase Edge Function — fetch-instagram-posts
// Schedule: every hour via Supabase cron (pg_cron)
// Fetches latest posts from all connected Instagram Business accounts and upserts into instagram_posts.
//
// Deploy:  supabase functions deploy fetch-instagram-posts
// Secrets: SUPABASE_SERVICE_ROLE_KEY (auto-injected), INSTAGRAM_APP_SECRET (for token refresh)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const IG_APP_ID         = Deno.env.get('INSTAGRAM_APP_ID')!
const IG_APP_SECRET     = Deno.env.get('INSTAGRAM_APP_SECRET')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const IG_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
const POSTS_PER_ACCOUNT = 12

Deno.serve(async () => {
  try {
    // 1. Load all active accounts
    const { data: accounts, error: accErr } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('is_active', true)

    if (accErr) throw accErr
    if (!accounts?.length) return new Response('No accounts configured', { status: 200 })

    const results = await Promise.allSettled(accounts.map(acc => fetchAndStore(acc)))

    const summary = results.map((r, i) => ({
      username: accounts[i].username,
      status: r.status,
      reason: r.status === 'rejected' ? String(r.reason) : undefined,
    }))

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function fetchAndStore(account: Record<string, unknown>) {
  let token = account.access_token as string

  // Refresh long-lived token if expiring within 10 days
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at as string) : null
  const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  if (!expiresAt || expiresAt < tenDaysFromNow) {
    token = await refreshToken(token, account.id as string)
  }

  // 2. Fetch media from Instagram Graph API
  const url = `https://graph.instagram.com/${account.ig_user_id}/media?fields=${IG_FIELDS}&limit=${POSTS_PER_ACCOUNT}&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`IG API ${res.status}: ${await res.text()}`)

  const json = await res.json() as { data: IgMedia[] }

  // 3. Upsert posts
  const rows = json.data.map((m: IgMedia) => ({
    ig_media_id:   m.id,
    account_id:    account.id,
    ig_user_id:    account.ig_user_id,
    username:      account.username,
    caption:       m.caption ?? null,
    media_type:    m.media_type,
    media_url:     m.media_url ?? null,
    thumbnail_url: m.thumbnail_url ?? null,
    permalink:     m.permalink,
    like_count:    m.like_count ?? null,
    comment_count: m.comments_count ?? null,
    posted_at:     m.timestamp,
    fetched_at:    new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('instagram_posts')
    .upsert(rows, { onConflict: 'ig_media_id' })

  if (error) throw error
}

async function refreshToken(oldToken: string, accountId: string): Promise<string> {
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${oldToken}`
  const res  = await fetch(url)
  if (!res.ok) return oldToken  // keep old token if refresh fails

  const json = await res.json() as { access_token: string; expires_in: number }
  const expiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString()

  await supabase
    .from('instagram_accounts')
    .update({ access_token: json.access_token, token_expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq('id', accountId)

  return json.access_token
}

interface IgMedia {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp: string
  like_count?: number
  comments_count?: number
}
