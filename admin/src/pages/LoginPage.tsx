import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage({ onLogin }: { onLogin: (s: any) => void }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) { setError('Supabase not configured'); return }
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError(err.message); return }

    // Check the user has a brand badge — gate admin access
    const { data: profile } = await supabase.from('profiles').select('badges').eq('id', data.user!.id).single()
    const allowedBadges = ['dev', 'founder', 'yamaha', 'honda', 'kawasaki', 'suzuki', 'ktm', 'bmw', 'ducati', 'triumph', 'brand', 'verified']
    const hasBadge = profile?.badges?.some((b: string) => allowedBadges.includes(b))
    if (!hasBadge) {
      await supabase.auth.signOut()
      setError('Your account does not have admin access. Contact MotoTrack to get brand verification.')
      return
    }

    onLogin(data.session)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-3xl mb-2">🏍️</p>
          <h1 className="text-white font-bold text-2xl">
            <span>Moto</span><span className="text-orange-500">Track</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Brand & Organizer CMS</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-gray-900 rounded-2xl p-6 border border-white/5">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-xl px-3 py-2">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-4">
          Need access? Contact <span className="text-orange-400">admin@mototrack.app</span>
        </p>
      </div>
    </div>
  )
}
