import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Instagram Graph API OAuth flow:
// 1. User clicks "Connect" → redirect to Facebook OAuth
// 2. Facebook redirects back with ?code=...
// 3. Exchange code for short-lived token → exchange for long-lived token (60 days)
// 4. Store in instagram_accounts table

const IG_APP_ID       = import.meta.env.VITE_INSTAGRAM_APP_ID ?? ''
const REDIRECT_URI    = import.meta.env.VITE_INSTAGRAM_REDIRECT_URI ?? `${window.location.origin}/instagram/callback`
const IG_OAUTH_URL    = `https://api.instagram.com/oauth/authorize?client_id=${IG_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=instagram_basic,pages_read_engagement,instagram_manage_insights&response_type=code`

interface IgAccount {
  id: string
  username: string
  display_name: string | null
  follower_count: number
  badge: string | null
  is_active: boolean
  token_expires_at: string | null
  created_at: string
}

interface IgPost {
  id: string
  username: string
  caption: string | null
  media_type: string
  posted_at: string
}

export default function InstagramPage() {
  const [accounts, setAccounts]       = useState<IgAccount[]>([])
  const [posts, setPosts]             = useState<IgPost[]>([])
  const [loading, setLoading]         = useState(true)
  const [syncLoading, setSyncLoading] = useState<string | null>(null)
  const [editBadge, setEditBadge]     = useState<{ id: string; badge: string } | null>(null)

  useEffect(() => {
    loadData()
    // Handle OAuth callback code in URL
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      window.history.replaceState({}, '', '/instagram')
      handleOAuthCallback(code)
    }
  }, [])

  async function loadData() {
    setLoading(true)
    if (!supabase) { setLoading(false); return }

    const [{ data: accs }, { data: ps }] = await Promise.all([
      supabase.from('instagram_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('instagram_posts').select('id,username,caption,media_type,posted_at').order('posted_at', { ascending: false }).limit(20),
    ])

    setAccounts(accs ?? [])
    setPosts(ps ?? [])
    setLoading(false)
  }

  async function handleOAuthCallback(code: string) {
    // Exchange code via your backend/edge function
    // For now: show instructions to complete via Supabase Edge Function
    alert(`OAuth code received: ${code.slice(0, 10)}…\n\nTo complete, call your backend to exchange this code for a token and store it in instagram_accounts. See supabase/functions/fetch-instagram-posts/index.ts for reference.`)
  }

  async function handleSync(accountId: string) {
    setSyncLoading(accountId)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-instagram-posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      })
      const json = await res.json()
      if (json.ok) {
        await loadData()
      } else {
        alert(`Sync failed: ${json.error ?? 'Unknown error'}`)
      }
    } finally {
      setSyncLoading(null)
    }
  }

  async function handleToggleActive(acc: IgAccount) {
    if (!supabase) return
    await supabase.from('instagram_accounts').update({ is_active: !acc.is_active }).eq('id', acc.id)
    setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, is_active: !a.is_active } : a))
  }

  async function handleSaveBadge() {
    if (!editBadge || !supabase) return
    await supabase.from('instagram_accounts').update({ badge: editBadge.badge }).eq('id', editBadge.id)
    setAccounts(prev => prev.map(a => a.id === editBadge.id ? { ...a, badge: editBadge.badge } : a))
    setEditBadge(null)
  }

  async function handleDelete(id: string) {
    if (!supabase) return
    if (!confirm('Remove this Instagram account? All cached posts will also be deleted.')) return
    await supabase.from('instagram_accounts').delete().eq('id', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  const BADGE_OPTIONS = ['yamaha', 'honda', 'kawasaki', 'suzuki', 'ktm', 'bmw', 'ducati', 'triumph', 'verified', 'brand']

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">Instagram Feed</h1>
          <p className="text-gray-400 text-sm mt-1">Connect brand Instagram accounts — posts appear in the app's Brands tab</p>
        </div>
        {IG_APP_ID ? (
          <a
            href={IG_OAUTH_URL}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            <span>📸</span> Connect Instagram Account
          </a>
        ) : (
          <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-xl px-4 py-2.5 text-yellow-400 text-xs max-w-xs">
            Set <code className="font-mono">VITE_INSTAGRAM_APP_ID</code> in <code className="font-mono">.env</code> to enable OAuth
          </div>
        )}
      </div>

      {/* Setup guide */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 mb-6">
        <h2 className="text-white font-semibold mb-3">⚙️ Setup Guide</h2>
        <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
          <li>Create a <strong className="text-white">Facebook App</strong> at developers.facebook.com with <em>Instagram Basic Display</em> product</li>
          <li>Add <code className="font-mono bg-gray-800 px-1 rounded text-orange-400">VITE_INSTAGRAM_APP_ID</code> to <code className="font-mono bg-gray-800 px-1 rounded text-orange-400">admin/.env</code></li>
          <li>Set the OAuth redirect URI to <code className="font-mono bg-gray-800 px-1 rounded text-orange-400">{REDIRECT_URI}</code> in your Facebook App settings</li>
          <li>Add <code className="font-mono bg-gray-800 px-1 rounded text-orange-400">INSTAGRAM_APP_ID</code> and <code className="font-mono bg-gray-800 px-1 rounded text-orange-400">INSTAGRAM_APP_SECRET</code> as Supabase Edge Function secrets</li>
          <li>Click <strong className="text-white">Connect Instagram Account</strong> above and sign in as the brand account</li>
          <li>Click <strong className="text-white">Sync Now</strong> to pull the latest posts, or wait for the hourly cron</li>
        </ol>
        <div className="mt-3 bg-gray-800 rounded-xl p-3 font-mono text-xs text-orange-400">
          supabase secrets set INSTAGRAM_APP_ID=xxx INSTAGRAM_APP_SECRET=yyy<br />
          supabase functions deploy fetch-instagram-posts
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Connected accounts */}
          <h2 className="text-white font-semibold mb-3">Connected Accounts ({accounts.length})</h2>

          {accounts.length === 0 ? (
            <div className="bg-gray-900 border border-white/5 rounded-2xl p-8 text-center text-gray-500 mb-6">
              <p className="text-3xl mb-2">📸</p>
              <p>No Instagram accounts connected yet.</p>
              <p className="text-xs mt-1">Click "Connect Instagram Account" above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {accounts.map(acc => {
                const daysLeft = acc.token_expires_at
                  ? Math.ceil((new Date(acc.token_expires_at).getTime() - Date.now()) / 86400000)
                  : null

                return (
                  <div key={acc.id} className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {acc.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold">@{acc.username}</p>
                        {acc.display_name && (
                          <span className="text-gray-500 text-sm">· {acc.display_name}</span>
                        )}
                        {acc.badge && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{acc.badge}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${acc.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/30 text-gray-500'}`}>
                          {acc.is_active ? '● Active' : '○ Paused'}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {acc.follower_count.toLocaleString()} followers
                        {daysLeft !== null && (
                          <span className={` · Token expires in ${daysLeft}d ${daysLeft < 10 ? '⚠️' : ''}`} />
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setEditBadge({ id: acc.id, badge: acc.badge ?? '' })}
                        className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Badge
                      </button>
                      <button
                        onClick={() => handleSync(acc.id)}
                        disabled={syncLoading === acc.id}
                        className="text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {syncLoading === acc.id ? '⏳ Syncing…' : '🔄 Sync Now'}
                      </button>
                      <button
                        onClick={() => handleToggleActive(acc)}
                        className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {acc.is_active ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Recent fetched posts preview */}
          {posts.length > 0 && (
            <>
              <h2 className="text-white font-semibold mb-3">Recent Fetched Posts ({posts.length} shown)</h2>
              <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">Account</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">Type</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">Caption</th>
                      <th className="px-4 py-3 text-left text-gray-500 font-medium">Posted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(p => (
                      <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                        <td className="px-4 py-3 text-white font-medium">@{p.username}</td>
                        <td className="px-4 py-3 text-gray-400">{p.media_type}</td>
                        <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{p.caption ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {p.posted_at ? new Date(p.posted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Badge edit modal */}
      {editBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-80">
            <h3 className="text-white font-bold mb-4">Set Badge</h3>
            <select
              value={editBadge.badge}
              onChange={e => setEditBadge({ ...editBadge, badge: e.target.value })}
              className="w-full bg-gray-800 text-white border border-white/10 rounded-xl px-3 py-2 mb-4 text-sm"
            >
              <option value="">— No badge —</option>
              {BADGE_OPTIONS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleSaveBadge}
                className="flex-1 bg-orange-500 text-white font-semibold py-2 rounded-xl text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setEditBadge(null)}
                className="flex-1 bg-gray-800 text-gray-300 font-semibold py-2 rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
