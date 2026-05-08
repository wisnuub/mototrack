import { useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { dbUploadAvatar } from '../../lib/db'
import { isSupabaseReady } from '../../lib/supabase'
import type { Bike } from '../../types'

const AVATARS = ['🤙', '👊', '✊', '🏍️', '⚡', '🔥', '💨', '🎯', '🦅', '🐺', '🦁', '💀', '🚀', '⚔️', '🦊', '🐉']
import type { BikeType } from '../../types'
const BIKE_TYPES: { label: string; value: BikeType }[] = [
  { label: 'Naked', value: 'naked' },
  { label: 'Sport', value: 'sport' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Cruiser', value: 'cruiser' },
  { label: 'Touring', value: 'touring' },
  { label: 'Matic', value: 'matic' },
]

function AvatarPreview({ avatar }: { avatar: string }) {
  if (avatar.startsWith('http')) {
    return <img src={avatar} className="w-20 h-20 rounded-full object-cover mx-auto" referrerPolicy="no-referrer" />
  }
  return (
    <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-4xl mx-auto">
      {avatar}
    </div>
  )
}

export default function OnboardingScreen() {
  const user = useStore(s => s.user)
  const completeSetup = useStore(s => s.completeSetup)

  const googlePhotoUrl = user?.avatar?.startsWith('http') ? user.avatar : null

  const [step, setStep] = useState(1)
  const [name, setName] = useState(user?.name ?? '')
  const [avatar, setAvatar] = useState(googlePhotoUrl ?? '🤙')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      if (isSupabaseReady) {
        const url = await dbUploadAvatar(user.id, file)
        setAvatar(url)
      } else {
        const reader = new FileReader()
        reader.onload = ev => setAvatar(ev.target?.result as string)
        reader.readAsDataURL(file)
      }
    } catch (e) {
      console.warn('Avatar upload failed', e)
    }
    setUploading(false)
  }

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [bikeType, setBikeType] = useState<BikeType>('naked')
  const [cc, setCc] = useState('0')
  const [plate, setPlate] = useState('')

  const handleComplete = async (withBike: boolean) => {
    setLoading(true)
    let firstBike: Omit<Bike, 'id'> | undefined
    if (withBike && brand.trim() && model.trim()) {
      firstBike = {
        riderId: user!.id,
        brand: brand.trim(),
        model: model.trim(),
        year: parseInt(year) || new Date().getFullYear(),
        type: bikeType,
        cc: parseInt(cc) || 0,
        plateNumber: plate.trim(),
        nickname: '',
        color: '#ff6b35',
        odometer: 0,
        isFavorite: true,
      }
    }
    await completeSetup(name.trim(), avatar, location.trim(), firstBike)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Progress */}
      <div className="flex justify-center gap-2 pt-12 pb-6">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-accent w-8' : 'bg-white/20 w-4'}`} />
        <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-accent w-8' : 'bg-white/20 w-4'}`} />
      </div>

      <div className="flex-1 flex flex-col px-6 max-w-sm mx-auto w-full pb-8">
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <AvatarPreview avatar={avatar} />
              <h1 className="text-2xl font-bold text-white mt-3">Your Profile</h1>
              <p className="text-gray-400 text-sm mt-1">How should other riders know you?</p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                placeholder="Your name"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Location (City)</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                placeholder="Bali, Indonesia"
              />
            </div>

            <div className="mb-6">
              <label className="text-xs text-gray-400 mb-2 block">Avatar</label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center gap-3 bg-bg-card border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 mb-2 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm flex-shrink-0">
                  {uploading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                  ) : '📷'}
                </div>
                <span className="text-sm text-white">{uploading ? 'Uploading…' : 'Upload photo from device'}</span>
              </button>

              {googlePhotoUrl && (
                <button
                  onClick={() => setAvatar(googlePhotoUrl)}
                  className={`w-full flex items-center gap-3 bg-bg-card border rounded-xl px-3 py-2 mb-2 transition-all ${
                    avatar === googlePhotoUrl ? 'border-accent' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <img src={googlePhotoUrl} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <span className="text-sm text-white">Use Google photo</span>
                  {avatar === googlePhotoUrl && <span className="ml-auto text-accent text-xs">✓</span>}
                </button>
              )}

              <div className="grid grid-cols-8 gap-2">
                {AVATARS.map(e => (
                  <button
                    key={e}
                    onClick={() => setAvatar(e)}
                    className={`aspect-square text-xl flex items-center justify-center rounded-xl transition-all ${
                      avatar === e ? 'bg-accent scale-110 shadow-lg shadow-accent/30' : 'bg-bg-card hover:bg-bg-surface'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="w-full bg-accent text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-opacity"
            >
              Continue →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🏍️</div>
              <h1 className="text-2xl font-bold text-white">Your Bike</h1>
              <p className="text-gray-400 text-sm mt-1">Add your ride to the garage</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                    placeholder="Yamaha"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                    placeholder="MT-15"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">CC</label>
                  <input
                    type="number"
                    value={cc}
                    onChange={e => setCc(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                    placeholder="155"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type</label>
                  <select
                    value={bikeType}
                    onChange={e => setBikeType(e.target.value as BikeType)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-accent text-sm"
                  >
                    {BIKE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Plate</label>
                  <input
                    type="text"
                    value={plate}
                    onChange={e => setPlate(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                    placeholder="DK 1234 AB"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => handleComplete(true)}
              disabled={loading || !brand.trim() || !model.trim()}
              className="w-full bg-accent text-white font-semibold py-3 rounded-xl disabled:opacity-50 mb-3 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up…
                </span>
              ) : (
                'Add Bike & Start Riding 🏍️'
              )}
            </button>

            <button
              onClick={() => handleComplete(false)}
              disabled={loading}
              className="w-full text-gray-500 text-sm py-2 hover:text-gray-400 transition-colors"
            >
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  )
}
