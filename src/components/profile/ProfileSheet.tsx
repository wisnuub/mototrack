import { useState, useRef, useEffect } from 'react'
import { X, Plus, Lock, Globe, Trash2, ImageIcon, MapPin, Heart, Clock, Zap, Route, ChevronDown, Shield, CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff, Ticket } from 'lucide-react'
import { format, formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns'
import { useStore } from '../../store/useStore'
import type { ActivityPost, ActivityType, BadgeType, RideSession } from '../../types'
import { isSupabaseReady } from '../../lib/supabase'
import { RIDE_HISTORY } from '../../data/mockData'
import {
  dbApplyForBadge, dbGetBadgeApplications, dbReviewBadgeApplication, dbBanUser,
  dbSetUsername,
  type BadgeApplication,
} from '../../lib/db'

// ── Badge metadata ──────────────────────────────────────────────

const BADGE_META: Record<BadgeType, { label: string; color: string; bg: string; icon: string }> = {
  dev:        { label: 'Dev',        color: 'text-blue-400',   bg: 'bg-blue-400/15',   icon: '⚙️' },
  influencer: { label: 'Influencer', color: 'text-pink-400',   bg: 'bg-pink-400/15',   icon: '⭐' },
  founder:    { label: 'Founder',    color: 'text-accent',     bg: 'bg-accent/15',     icon: '🔥' },
  verified:   { label: 'Verified',   color: 'text-green-400',  bg: 'bg-green-400/15',  icon: '✓' },
  yamaha:     { label: 'Yamaha',     color: 'text-blue-400',   bg: 'bg-blue-400/15',   icon: '🔵' },
  honda:      { label: 'Honda',      color: 'text-red-400',    bg: 'bg-red-400/15',    icon: '🔴' },
  kawasaki:   { label: 'Kawasaki',   color: 'text-green-400',  bg: 'bg-green-400/15',  icon: '🟢' },
  suzuki:     { label: 'Suzuki',     color: 'text-orange-400', bg: 'bg-orange-400/15', icon: '🟠' },
  ktm:        { label: 'KTM',        color: 'text-accent',     bg: 'bg-accent/15',     icon: '🏁' },
  bmw:        { label: 'BMW',        color: 'text-blue-400',   bg: 'bg-blue-400/15',   icon: '🔷' },
  ducati:     { label: 'Ducati',     color: 'text-red-400',    bg: 'bg-red-400/15',    icon: '🏍️' },
  triumph:    { label: 'Triumph',    color: 'text-yellow-400', bg: 'bg-yellow-400/15', icon: '✨' },
  brand:      { label: 'Brand',      color: 'text-purple-400', bg: 'bg-purple-400/15', icon: '🏷️' },
}

export function BadgeChip({ badge }: { badge: BadgeType }) {
  const m = BADGE_META[badge]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${m.bg} ${m.color}`}>
      {m.icon} {m.label}
    </span>
  )
}

// ── Activity type metadata ──────────────────────────────────────

const ACTIVITY_META: Record<ActivityType, { label: string; color: string; bg: string; icon: string; placeholder: string }> = {
  post:     { label: 'Post',    color: 'text-white',     bg: 'bg-white/10',     icon: '📝', placeholder: "What's on your mind?" },
  service:  { label: 'Service', color: 'text-blue-400',  bg: 'bg-blue-400/10',  icon: '🔧', placeholder: 'Oil change at Bengkel Maju...' },
  ride:     { label: 'Ride',    color: 'text-green-400', bg: 'bg-green-400/10', icon: '🏍️', placeholder: 'Morning ride to Kintamani...' },
  story:    { label: 'Story',   color: 'text-yellow-400',bg: 'bg-yellow-400/10',icon: '📸', placeholder: '' },
}

// ── Helpers ─────────────────────────────────────────────────────

async function resizeImage(file: File, maxPx = 800): Promise<string> {
  const image = new Image()
  const src = URL.createObjectURL(file)
  await new Promise<void>((res, rej) => { image.onload = () => res(); image.onerror = rej; image.src = src })
  URL.revokeObjectURL(src)
  const ratio = Math.min(maxPx / image.width, maxPx / image.height, 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * ratio)
  canvas.height = Math.round(image.height * ratio)
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

function fmtDuration(ms: number): string {
  const d = intervalToDuration({ start: 0, end: ms })
  if (d.hours) return `${d.hours}h ${d.minutes ?? 0}m`
  return `${d.minutes ?? 0}m`
}

// ── Create Post Modal ───────────────────────────────────────────

function CreatePostModal({ onClose }: { onClose: () => void }) {
  const user = useStore(s => s.user)
  const bikes = useStore(s => s.bikes.filter(b => b.riderId === (user?.id ?? 'rider-1')))
  const addActivityPost = useStore(s => s.addActivityPost)

  const [step, setStep] = useState<'type' | 'form'>('type')
  const [activityType, setActivityType] = useState<ActivityType>('post')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [bikeId, setBikeId] = useState(bikes[0]?.id ?? '')
  const [displayTime, setDisplayTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageLoading(true)
    try { setImageDataUrl(await resizeImage(file)) }
    finally { setImageLoading(false); e.target.value = '' }
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    const bike = bikes.find(b => b.id === bikeId)
    try {
      await addActivityPost({
        activityType,
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl: imageDataUrl ?? undefined,
        displayTime: new Date(displayTime),
        isPublic,
        location: location.trim() || undefined,
        bikeId: bike?.id,
        bikeName: bike ? `${bike.year} ${bike.brand} ${bike.model}` : undefined,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'type') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        <div className="relative bg-bg-secondary rounded-t-3xl p-5 w-full max-w-lg animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold text-lg">Create</h3>
            <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 pb-safe">
            {(['post', 'service', 'ride'] as ActivityType[]).map(type => {
              const m = ACTIVITY_META[type]
              return (
                <button
                  key={type}
                  onClick={() => { setActivityType(type); setStep('form') }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 ${m.bg} hover:border-white/20 transition-all`}
                >
                  <span className="text-3xl">{m.icon}</span>
                  <span className="text-white font-semibold text-sm">{m.label}</span>
                </button>
              )
            })}
            <button
              disabled
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/5 bg-white/5 opacity-50"
            >
              <span className="text-3xl">📸</span>
              <span className="text-white font-semibold text-sm">Story</span>
              <span className="text-gray-500 text-[10px]">Coming Soon</span>
            </button>
            <button
              disabled
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/5 bg-white/5 opacity-50"
            >
              <span className="text-3xl">🎵</span>
              <span className="text-white font-semibold text-sm">Bike Audio</span>
              <span className="text-gray-500 text-[10px]">Coming Soon</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const meta = ACTIVITY_META[activityType]
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl p-5 w-full max-w-lg animate-slide-up max-h-[92vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setStep('type')} className="text-gray-400">
            <ChevronDown size={20} className="rotate-90" />
          </button>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
            {meta.icon} {meta.label}
          </span>
          <button onClick={onClose} className="ml-auto text-gray-400"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={meta.placeholder}
              className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">When it happened</label>
            <input
              type="datetime-local"
              value={displayTime}
              onChange={e => setDisplayTime(e.target.value)}
              className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent [color-scheme:dark]"
            />
          </div>

          {bikes.length > 1 && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Bike</label>
              <select
                value={bikeId}
                onChange={e => setBikeId(e.target.value)}
                className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
              >
                <option value="">No specific bike</option>
                {bikes.map(b => <option key={b.id} value={b.id}>{b.year} {b.brand} {b.model}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Denpasar, Bali"
              className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Details</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={activityType === 'service' ? 'Parts replaced, cost, mechanic…' : activityType === 'ride' ? 'Route highlights, conditions…' : 'Write something…'}
              rows={3}
              className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
            {imageDataUrl ? (
              <div className="relative">
                <img src={imageDataUrl} alt="preview" className="w-full h-44 object-cover rounded-xl" />
                <button onClick={() => setImageDataUrl(null)} className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={imageLoading}
                className="w-full flex items-center justify-center gap-2 bg-bg-card border border-dashed border-white/20 rounded-xl py-3 text-gray-500 hover:border-white/40 hover:text-gray-400 transition-all text-sm"
              >
                <ImageIcon size={15} />
                {imageLoading ? 'Processing…' : 'Add photo (optional)'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 bg-bg-card rounded-xl px-3 py-3">
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Visibility</p>
              <p className="text-gray-500 text-xs">{isPublic ? 'Visible to other riders' : 'Only you can see this'}</p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isPublic ? 'bg-green-400/10 text-green-400' : 'bg-white/10 text-gray-400'
              }`}
            >
              {isPublic ? <><Globe size={12} /> Public</> : <><Lock size={12} /> Private</>}
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="w-full bg-accent text-white font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Badge Application Modal ─────────────────────────────────────

function BadgeApplicationModal({ onClose }: { onClose: () => void }) {
  const user = useStore(s => s.user)
  const [instagram, setInstagram] = useState('')
  const [youtube, setYoutube] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!instagram.trim()) return
    if (!instagram.includes('instagram.com') && !instagram.startsWith('@')) {
      setError('Please enter a valid Instagram URL or @handle')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (isSupabaseReady && user) {
        await dbApplyForBadge(user.id, user.name, user.avatar, instagram.trim(), youtube.trim())
      }
      setDone(true)
    } catch (e: any) {
      setError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl p-5 w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Apply for Influencer Badge</h3>
          <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-white font-bold text-lg">Application Submitted!</p>
            <p className="text-gray-400 text-sm mt-2">We'll review your profile and get back to you soon.</p>
            <button onClick={onClose} className="mt-6 bg-accent text-white font-semibold px-6 py-3 rounded-2xl w-full">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-pink-400/10 border border-pink-400/20 rounded-xl p-3">
              <p className="text-pink-400 text-xs font-semibold mb-1">⭐ Influencer Badge Requirements</p>
              <p className="text-gray-400 text-xs">Active motorcycle content creator on Instagram or YouTube. Will be reviewed manually.</p>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Instagram Profile URL or @handle *</label>
              <input
                type="text"
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                placeholder="@yourusername or https://instagram.com/..."
                className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">YouTube Channel URL (optional)</label>
              <input
                type="text"
                value={youtube}
                onChange={e => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@..."
                className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!instagram.trim() || submitting}
              className="w-full bg-pink-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Admin Panel ─────────────────────────────────────────────────

function AdminPanel({ onClose }: { onClose: () => void }) {
  const [applications, setApplications] = useState<BadgeApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const load = async () => {
    if (!isSupabaseReady) return
    setLoading(true)
    try {
      const apps = await dbGetBadgeApplications()
      setApplications(apps)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const review = async (app: BadgeApplication, status: 'approved' | 'rejected') => {
    setProcessing(app.id)
    try {
      await dbReviewBadgeApplication(app.id, app.userId, status)
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status } : a))
    } finally {
      setProcessing(null)
    }
  }

  const ban = async (userId: string) => {
    if (!confirm('Ban this user? This will restrict their access.')) return
    await dbBanUser(userId)
    alert('User banned.')
  }

  const pending = applications.filter(a => a.status === 'pending')
  const reviewed = applications.filter(a => a.status !== 'pending')

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-safe py-3 border-b border-white/10">
        <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-accent" />
          <h2 className="text-white font-bold">Admin Panel</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">
                Pending Applications ({pending.length})
              </p>
              {pending.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">No pending applications</p>
              ) : (
                <div className="space-y-3">
                  {pending.map(app => (
                    <div key={app.id} className="bg-bg-card rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-xl flex-shrink-0">
                          {app.userAvatar.startsWith('http') || app.userAvatar.startsWith('data:')
                            ? <img src={app.userAvatar} className="w-10 h-10 rounded-full object-cover" />
                            : app.userAvatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm">{app.userName}</p>
                          <p className="text-gray-500 text-xs">{format(app.createdAt, 'dd MMM yyyy')}</p>
                        </div>
                        <button
                          onClick={() => ban(app.userId)}
                          className="text-xs text-moto-red bg-moto-red/10 px-2.5 py-1 rounded-full font-semibold"
                        >
                          Ban
                        </button>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        <a href={app.instagramUrl.startsWith('http') ? app.instagramUrl : `https://instagram.com/${app.instagramUrl.replace('@', '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-pink-400 text-xs hover:text-pink-300"
                        >
                          <ExternalLink size={11} /> Instagram: {app.instagramUrl}
                        </a>
                        {app.youtubeUrl && (
                          <a href={app.youtubeUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-red-400 text-xs hover:text-red-300"
                          >
                            <ExternalLink size={11} /> YouTube
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => review(app, 'approved')}
                          disabled={processing === app.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-green-400/10 text-green-400 font-semibold text-sm py-2.5 rounded-xl disabled:opacity-50"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() => review(app, 'rejected')}
                          disabled={processing === app.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-moto-red/10 text-moto-red font-semibold text-sm py-2.5 rounded-xl disabled:opacity-50"
                        >
                          <AlertCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {reviewed.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">
                  Reviewed ({reviewed.length})
                </p>
                <div className="space-y-2">
                  {reviewed.map(app => (
                    <div key={app.id} className="bg-bg-card rounded-xl px-3 py-2.5 border border-white/5 flex items-center gap-3">
                      <span className="text-base">{app.userAvatar.length <= 2 ? app.userAvatar : '🏍️'}</span>
                      <span className="text-white text-sm flex-1">{app.userName}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        app.status === 'approved' ? 'bg-green-400/10 text-green-400' : 'bg-moto-red/10 text-moto-red'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Activity Post Card ──────────────────────────────────────────

export function ActivityPostCard({ post, showDelete = false }: { post: ActivityPost; showDelete?: boolean }) {
  const user = useStore(s => s.user)
  const deleteActivityPost = useStore(s => s.deleteActivityPost)
  const togglePostLike = useStore(s => s.togglePostLike)
  const meta = ACTIVITY_META[post.activityType]
  const myId = user?.id ?? 'local'
  const liked = post.likedBy.includes(myId)
  const timeDiff = Math.abs(post.createdAt.getTime() - post.displayTime.getTime())

  return (
    <div className="bg-bg-card rounded-2xl overflow-hidden border border-white/5">
      {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover" />}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
            {meta.icon} {meta.label}
          </span>
          {!post.isPublic && (
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5 bg-white/5 rounded-full px-2 py-0.5">
              <Lock size={9} /> Private
            </span>
          )}
          {showDelete && post.userId === myId && (
            <button
              onClick={() => deleteActivityPost(post.id)}
              className="ml-auto text-gray-600 hover:text-moto-red transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <p className="text-white font-semibold text-sm mb-1">{post.title}</p>
        {post.description && <p className="text-gray-400 text-xs mb-2 leading-relaxed">{post.description}</p>}

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
          <span className="font-semibold text-gray-400">{format(post.displayTime, 'dd MMM yyyy, HH:mm')}</span>
          {post.location && <span className="flex items-center gap-1"><MapPin size={10} />{post.location}</span>}
          {post.bikeName && <span>🏍️ {post.bikeName}</span>}
        </div>

        {timeDiff > 30 * 60 * 1000 && (
          <p className="text-gray-600 text-[10px] mb-2">
            Posted {formatDistanceToNow(post.createdAt, { addSuffix: true })}
          </p>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => togglePostLike(post.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              liked ? 'bg-moto-red/15 text-moto-red' : 'bg-white/5 text-gray-500 hover:text-gray-400'
            }`}
          >
            <Heart size={12} fill={liked ? 'currentColor' : 'none'} />
            {post.likes > 0 ? post.likes : 'Like'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Ride Session Card ───────────────────────────────────────────

function RideSessionCard({ session }: { session: RideSession }) {
  const durationStr = session.durationMs ? fmtDuration(session.durationMs) : '—'
  return (
    <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-semibold text-sm">
            {session.startLocation ?? format(session.startTime, 'dd MMM yyyy')}
          </p>
          <p className="text-gray-500 text-xs">{format(session.startTime, 'HH:mm')}
            {session.endTime && ` – ${format(session.endTime, 'HH:mm')}`}
          </p>
        </div>
        {session.bikeName && <span className="text-gray-500 text-xs">🏍️ {session.bikeName}</span>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: <Route size={13} />, label: 'Distance', value: `${session.distanceKm.toFixed(1)} km` },
          { icon: <Clock size={13} />, label: 'Duration', value: durationStr },
          { icon: <Zap size={13} />, label: 'Top Speed', value: `${session.maxSpeedKmh} km/h` },
          { icon: <Zap size={13} />, label: 'Avg Speed', value: `${Math.round(session.avgSpeedKmh)} km/h` },
        ].map(stat => (
          <div key={stat.label} className="bg-bg-surface rounded-xl p-2 text-center">
            <div className="text-gray-500 flex justify-center mb-0.5">{stat.icon}</div>
            <p className="text-white font-bold text-xs">{stat.value}</p>
            <p className="text-gray-600 text-[9px]">{stat.label}</p>
          </div>
        ))}
      </div>
      {session.maxLeanAngle && (
        <p className="text-gray-500 text-xs mt-2 text-center">
          Max lean: {session.maxLeanAngle.toFixed(1)}°
        </p>
      )}
    </div>
  )
}

// ── My Rides tab ────────────────────────────────────────────────

function MyRidesTab({
  myRides, activeRideSession, stopRideSession,
}: {
  myRides: RideSession[]
  activeRideSession: RideSession | null
  stopRideSession: () => void
}) {
  const [ridePrivacy, setRidePrivacy] = useState<Record<string, boolean>>({})
  return (
    <div className="space-y-3">
      {activeRideSession && (
        <div className="bg-green-400/10 border border-green-400/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-green-400 font-bold text-sm">Ride in Progress</p>
            </div>
            <button onClick={stopRideSession} className="bg-moto-red/20 text-moto-red text-xs font-semibold px-3 py-1.5 rounded-full">Stop</button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-white font-bold">{activeRideSession.distanceKm.toFixed(2)}</p><p className="text-gray-500 text-xs">km</p></div>
            <div><p className="text-white font-bold">{activeRideSession.maxSpeedKmh}</p><p className="text-gray-500 text-xs">top km/h</p></div>
            <div><p className="text-white font-bold">{activeRideSession.route.length}</p><p className="text-gray-500 text-xs">waypoints</p></div>
          </div>
        </div>
      )}
      {myRides.map(r => <RideSessionCard key={r.id} session={r} />)}
      {RIDE_HISTORY.map(ride => {
        const isPrivate = ridePrivacy[ride.id] ?? ride.isPrivate
        const dH = Math.floor(ride.durationMin / 60), dM = ride.durationMin % 60
        return (
          <div key={ride.id} className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bg-surface rounded-xl flex items-center justify-center text-2xl">{ride.emoji}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{ride.title}</p>
                    <p className="text-gray-500 text-xs">{formatDistanceToNow(ride.date, { addSuffix: true })}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRidePrivacy(p => ({ ...p, [ride.id]: !isPrivate }))}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${isPrivate ? 'bg-gray-600/20 text-gray-400' : 'bg-moto-green/20 text-moto-green'}`}
                >
                  {isPrivate ? <EyeOff size={11} /> : <Eye size={11} />}
                  {isPrivate ? 'Private' : 'Public'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 px-4 pb-3">
              {[
                { label: 'Distance', val: `${ride.distanceKm} km` },
                { label: 'Time', val: dH > 0 ? `${dH}h ${dM}m` : `${dM}m` },
                { label: 'Avg', val: `${ride.avgSpeedKmh} km/h` },
                { label: 'Top', val: `${ride.maxSpeedKmh} km/h` },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-white font-bold text-sm">{s.val}</p>
                  <p className="text-gray-500 text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="px-4 pb-3 border-t border-white/5 pt-2.5">
              <p className="text-gray-500 text-[10px] truncate">📍 {ride.route}</p>
              {ride.riders.length > 0 && <p className="text-gray-600 text-[10px] mt-0.5">with {ride.riders.join(', ')}</p>}
            </div>
          </div>
        )
      })}
      {myRides.length === 0 && RIDE_HISTORY.length === 0 && (
        <EmptyState icon="🏍️" text="No rides yet" sub="Start a ride to record your stats" />
      )}
    </div>
  )
}

// ── Events tab ───────────────────────────────────────────────────

type EvtFilter = 'going' | 'saved' | 'completed'

function EventsTab({
  eventInteractions, events,
}: {
  eventInteractions: { eventId: string; type: string }[]
  events: import('../../types').MotoEvent[]
}) {
  const [evtFilter, setEvtFilter] = useState<EvtFilter>('going')
  const now = new Date()
  const goingIds  = new Set(eventInteractions.filter(i => i.type === 'attending').map(i => i.eventId))
  const savedIds  = new Set(eventInteractions.filter(i => i.type === 'interested').map(i => i.eventId))
  const goingEvts = events.filter(e => goingIds.has(e.id) && e.date >= now)
  const savedEvts = events.filter(e => savedIds.has(e.id) && !goingIds.has(e.id))
  const doneEvts  = events.filter(e => goingIds.has(e.id) && e.date < now)
  const list = evtFilter === 'going' ? goingEvts : evtFilter === 'saved' ? savedEvts : doneEvts
  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {([
          { id: 'going'     as EvtFilter, label: `Going (${goingEvts.length})`          },
          { id: 'saved'     as EvtFilter, label: `Saved (${savedEvts.length})`          },
          { id: 'completed' as EvtFilter, label: `Completed (${doneEvts.length})`       },
        ]).map(f => (
          <button key={f.id} onClick={() => setEvtFilter(f.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${evtFilter === f.id ? 'bg-accent text-white' : 'bg-bg-card text-gray-400'}`}>
            {f.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={evtFilter === 'going' ? '🎫' : evtFilter === 'saved' ? '🔖' : '✅'}
          text={evtFilter === 'going' ? 'No upcoming events' : evtFilter === 'saved' ? 'No saved events' : 'No completed events'}
          sub={evtFilter === 'going' ? 'Tap "Going" on events in Explore' : evtFilter === 'saved' ? 'Tap "Interested" on events in Explore' : 'Events you attended will show here'}
        />
      ) : (
        <div className="space-y-3">
          {list.map(evt => (
            <div key={evt.id} className={`bg-bg-card rounded-2xl border p-4 ${evtFilter === 'completed' ? 'border-moto-green/20 opacity-70' : 'border-white/5'}`}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-bg-surface rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {'emoji' in evt ? (evt as any).emoji : '🏍️'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{evt.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{format(evt.date, 'EEE, d MMM yyyy · HH:mm')}</p>
                  <p className="text-gray-600 text-xs mt-0.5 truncate">{evt.location}</p>
                </div>
                {evtFilter === 'completed' && <span className="flex-shrink-0 text-moto-green text-lg">✅</span>}
                {evtFilter === 'going' && <span className="flex-shrink-0 bg-accent/20 text-accent text-[10px] font-bold px-2 py-1 rounded-full">Going</span>}
                {evtFilter === 'saved' && <span className="flex-shrink-0 bg-accent-amber/20 text-accent-amber text-[10px] font-bold px-2 py-1 rounded-full">Saved</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Profile Sheet ───────────────────────────────────────────────

type ProfileTab = 'posts' | 'myrides' | 'service' | 'events'

export default function ProfileSheet({ onClose }: { onClose: () => void }) {
  const user = useStore(s => s.user)
  const signOut = useStore(s => s.signOut)
  const activityPosts = useStore(s => s.activityPosts)
  const rideSessions = useStore(s => s.rideSessions)
  const activeRideSession = useStore(s => s.activeRideSession)
  const startRideSession = useStore(s => s.startRideSession)
  const stopRideSession = useStore(s => s.stopRideSession)

  const [tab, setTab] = useState<ProfileTab>('posts')
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const eventInteractions = useStore(s => s.eventInteractions)
  const events = useStore(s => s.events)

  const isStandalone = ('standalone' in navigator && (navigator as any).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent)
  const deferredPrompt = (window as any).__pwaPrompt ?? null

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
    } else if (isIOS) {
      setShowInstallGuide(true)
    }
  }
  const [showCreate, setShowCreate] = useState(false)
  const [showBadgeApply, setShowBadgeApply] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  const handleSignOut = async () => {
    onClose()
    await signOut()
  }

  const myId = user?.id ?? 'local'
  const isAdmin = (user as any)?.isAdmin ?? false

  const myPosts = activityPosts.filter(p => p.userId === myId)
  const myRides = rideSessions.filter(r => r.userId === myId)
  const myServices = myPosts.filter(p => p.activityType === 'service')
  const totalKm = myRides.reduce((sum, r) => sum + r.distanceKm, 0)

  const hasInfluencer = user?.badges?.includes('influencer')
  const hasDev = user?.badges?.includes('dev')

  return (
    <div className="fixed inset-0 z-40 bg-bg-primary flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-safe py-3 border-b border-white/10">
        <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        <p className="text-white font-bold">Profile</p>
        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAdmin(true)}
              className="flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              <Shield size={12} /> Admin
            </button>
          )}
          {!isStandalone && (deferredPrompt || isIOS) && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              📲 Install App
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 bg-moto-red/10 text-moto-red text-xs font-semibold px-3 py-1.5 rounded-full"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* iOS install guide */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInstallGuide(false)} />
          <div className="relative bg-bg-secondary rounded-t-3xl w-full max-w-lg animate-slide-up p-6 pb-safe">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Add to Home Screen</h3>
              <button onClick={() => setShowInstallGuide(false)} className="text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { icon: '⬆️', text: 'Tap the Share button at the bottom of Safari' },
                { icon: '➕', text: 'Scroll down and tap "Add to Home Screen"' },
                { icon: '✅', text: 'Tap "Add" — MotoTrack will appear on your home screen' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 bg-bg-card rounded-2xl px-4 py-3 border border-white/5">
                  <span className="text-2xl flex-shrink-0">{step.icon}</span>
                  <p className="text-gray-300 text-sm">{step.text}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs text-center mt-4">Once installed, the app works like a native app with offline support</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Profile hero */}
        <div className="px-4 py-5 border-b border-white/5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-accent/20 flex items-center justify-center text-4xl border-2 border-accent/30">
              {user?.avatar?.startsWith('http') || user?.avatar?.startsWith('data:')
                ? <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                : <span>{user?.avatar ?? '🤙'}</span>}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-white font-bold text-xl leading-tight">{user?.name ?? 'Rider'}</p>
              {user?.username
                ? <p className="text-accent text-sm font-semibold mt-0.5">@{user.username}</p>
                : <UsernameSetup />
              }
              {user?.location && <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5"><MapPin size={11} />{user.location}</p>}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {user?.badges?.map(b => <BadgeChip key={b} badge={b} />)}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Posts', value: myPosts.length },
              { label: 'Rides', value: myRides.length },
              { label: 'km Total', value: totalKm.toFixed(0) },
            ].map(stat => (
              <div key={stat.label} className="bg-bg-card rounded-xl p-3 text-center">
                <p className="text-white font-bold text-lg">{stat.value}</p>
                <p className="text-gray-500 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Badge apply CTA */}
          {!hasInfluencer && !hasDev && (
            <button
              onClick={() => setShowBadgeApply(true)}
              className="w-full flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-xl px-3 py-2.5 text-pink-400 text-sm hover:bg-pink-500/15 transition-all"
            >
              <span className="text-base">⭐</span>
              <span className="font-medium">Apply for Influencer badge</span>
              <ChevronDown className="ml-auto rotate-[-90deg]" size={14} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-2 overflow-x-auto no-scrollbar">
          {([
            { id: 'posts',   label: 'Posts'    },
            { id: 'myrides', label: 'My Rides' },
            { id: 'service', label: 'Service'  },
            { id: 'events',  label: 'Events'   },
          ] as { id: ProfileTab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                tab === t.id ? 'text-white border-b-2 border-accent' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 py-4 space-y-4">
          {tab === 'posts' && (
            myPosts.filter(p => p.activityType !== 'service').length === 0
              ? <EmptyState icon="📝" text="No posts yet" sub='Tap "+" to share something' />
              : myPosts.filter(p => p.activityType !== 'service').map(p => (
                  <ActivityPostCard key={p.id} post={p} showDelete />
                ))
          )}

          {tab === 'service' && (
            myServices.length === 0
              ? <EmptyState icon="🔧" text="No service history" sub='Log your bike maintenance' />
              : myServices.map(p => <ActivityPostCard key={p.id} post={p} showDelete />)
          )}

          {tab === 'myrides' && (
            <MyRidesTab
              myRides={myRides}
              activeRideSession={activeRideSession}
              stopRideSession={stopRideSession}
            />
          )}

          {tab === 'events' && (
            <EventsTab eventInteractions={eventInteractions} events={events} />
          )}

        </div>
      </div>

      {/* FAB */}
      <div className="absolute bottom-8 right-4">
        <button
          onClick={() => setShowCreate(true)}
          className="w-14 h-14 bg-accent rounded-full shadow-lg shadow-accent/30 flex items-center justify-center"
        >
          <Plus size={24} className="text-white" />
        </button>
      </div>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
      {showBadgeApply && <BadgeApplicationModal onClose={() => setShowBadgeApply(false)} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  )
}

function UsernameSetup() {
  const user = useStore(s => s.user)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!user || !value.trim()) return
    setSaving(true); setError(null)
    const { error: err } = await dbSetUsername(user.id, value.trim())
    if (err) { setError(err); setSaving(false); return }
    useStore.setState(s => ({ user: s.user ? { ...s.user, username: value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') } : s.user }))
    setEditing(false); setSaving(false)
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-accent/70 text-xs mt-0.5 underline underline-offset-2">
        Set @username
      </button>
    )
  }
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-gray-500 text-sm">@</span>
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        onKeyDown={e => e.key === 'Enter' && save()}
        placeholder="username"
        className="flex-1 bg-bg-card border border-accent/40 rounded-lg px-2 py-1 text-white text-sm focus:outline-none"
        maxLength={30}
      />
      <button onClick={save} disabled={saving || !value.trim()} className="text-accent text-xs font-bold px-2 py-1 bg-accent/15 rounded-lg disabled:opacity-40">
        {saving ? '…' : 'Save'}
      </button>
      <button onClick={() => { setEditing(false); setError(null) }} className="text-gray-500 text-xs">✕</button>
      {error && <p className="text-moto-red text-xs absolute mt-8">{error}</p>}
    </div>
  )
}

function EmptyState({ icon, text, sub }: { icon: string; text: string; sub: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-4xl mb-2">{icon}</p>
      <p className="text-white font-semibold">{text}</p>
      <p className="text-gray-500 text-sm mt-1">{sub}</p>
    </div>
  )
}
