import { useState, useRef, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { useStore } from '../../store/useStore'
import { dbUploadAvatar } from '../../lib/db'
import { isSupabaseReady } from '../../lib/supabase'
import { BIKE_BRANDS } from '../../data/bikeData'
import type { Bike, BikeType } from '../../types'

// ── Types ──────────────────────────────────────────────────────

type Area = { x: number; y: number; width: number; height: number }

// ── Bike type visual cards ──────────────────────────────────────

const BIKE_TYPES: { label: string; value: BikeType; emoji: string; desc: string }[] = [
  { label: 'Naked',     value: 'naked',     emoji: '🔥', desc: 'Street fighter' },
  { label: 'Sport',     value: 'sport',     emoji: '⚡', desc: 'Track-ready' },
  { label: 'Matic',     value: 'matic',     emoji: '💨', desc: 'Urban cruiser' },
  { label: 'Adventure', value: 'adventure', emoji: '🌄', desc: 'Go anywhere' },
  { label: 'Cruiser',   value: 'cruiser',   emoji: '🛣️', desc: 'Born to roam' },
  { label: 'Touring',   value: 'touring',   emoji: '🗺️', desc: 'Long hauler' },
]

const AVATARS = ['🤙', '👊', '✊', '🏍️', '⚡', '🔥', '💨', '🎯', '🦅', '🐺', '🦁', '💀', '🚀', '⚔️', '🦊', '🐉']

// ── Image utilities ─────────────────────────────────────────────

async function cropImageToBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = reject
    image.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  const size = Math.min(pixelCrop.width, pixelCrop.height, 512)
  canvas.width = size
  canvas.height = size
  canvas.getContext('2d')!.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size)
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9))
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = e => res(e.target!.result as string)
    reader.onerror = rej
    reader.readAsDataURL(blob)
  })

// ── Image Cropper ───────────────────────────────────────────────

function ImageCropper({ imageSrc, onDone, onCancel }: {
  imageSrc: string
  onDone: (blob: Blob) => void
  onCancel: () => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [applying, setApplying] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedArea(pixels), [])

  const handleApply = async () => {
    if (!croppedArea) return
    setApplying(true)
    const blob = await cropImageToBlob(imageSrc, croppedArea)
    onDone(blob)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 pt-safe py-3 bg-black/80">
        <button onClick={onCancel} className="text-gray-400 text-sm">Cancel</button>
        <p className="text-white text-sm font-semibold">Crop Photo</p>
        <button onClick={handleApply} disabled={applying}
          className="text-accent font-semibold text-sm disabled:opacity-50">
          {applying ? 'Applying…' : 'Apply'}
        </button>
      </div>
      <div className="relative flex-1">
        <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1}
          cropShape="round" showGrid={false}
          onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
      </div>
      <div className="px-6 py-4 bg-black/80">
        <p className="text-gray-500 text-xs text-center mb-2">Pinch or scroll to zoom</p>
        <input type="range" min={1} max={3} step={0.01} value={zoom}
          onChange={e => setZoom(Number(e.target.value))} className="w-full accent-orange-500" />
      </div>
    </div>
  )
}

// ── Avatar preview ──────────────────────────────────────────────

function AvatarPreview({ avatar, size = 'lg' }: { avatar: string; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg'
    ? 'w-28 h-28 text-6xl rounded-full border-4 border-accent/40'
    : 'w-16 h-16 text-3xl rounded-full border-2 border-accent/30'
  if (avatar.startsWith('http') || avatar.startsWith('data:')) {
    return <img src={avatar} className={`${cls} object-cover`} referrerPolicy="no-referrer" />
  }
  return (
    <div className={`${cls} bg-accent/10 flex items-center justify-center shadow-2xl shadow-accent/20`}>
      {avatar}
    </div>
  )
}

// ── Screen wrapper with slide animation ────────────────────────

function Screen({ children, visible }: { children: React.ReactNode; visible: boolean }) {
  return (
    <div className={`absolute inset-0 flex flex-col transition-all duration-400 ease-out
      ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
      {children}
    </div>
  )
}

// ── Shared continue button ──────────────────────────────────────

function ContinueBtn({ onClick, disabled = false, loading = false, label = 'Continue' }: {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full bg-accent text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40 transition-all active:scale-95 shadow-lg shadow-accent/25"
    >
      {loading
        ? <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Setting up…
          </span>
        : label}
    </button>
  )
}

// ── Main Onboarding ─────────────────────────────────────────────

export default function OnboardingScreen() {
  const user = useStore(s => s.user)
  const completeSetup = useStore(s => s.completeSetup)

  const googlePhotoUrl = user?.avatar?.startsWith('http') ? user.avatar : null

  // Navigation
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')

  // Profile fields
  const [name, setName] = useState(user?.name ?? '')
  const [avatar, setAvatar] = useState(googlePhotoUrl ?? '🤙')
  const [location, setLocation] = useState('')
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Bike fields
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [bikeType, setBikeType] = useState<BikeType>('naked')
  const [cc, setCc] = useState('')
  const [plate, setPlate] = useState('')

  const [loading, setLoading] = useState(false)

  const TOTAL_STEPS = 6  // 0: name, 1: avatar, 2: location, 3: brand, 4: model+year, 5: type+cc+plate

  const next = () => { setDir('fwd'); setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)) }
  const back = () => { setDir('back'); setStep(s => Math.max(s - 1, 0)) }

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCropSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropDone = async (blob: Blob) => {
    setCropSrc(null)
    setUploading(true)
    try {
      if (isSupabaseReady && user) {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000))
        try {
          const url = await Promise.race([dbUploadAvatar(user.id, file), timeout])
          setAvatar(url)
          return
        } catch { /* fall through */ }
      }
      setAvatar(await blobToDataUrl(blob))
    } finally {
      setUploading(false)
    }
  }

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
        nickname: `${brand.trim()} ${model.trim()}`,
        color: '#ff6b35',
        odometer: 0,
        isFavorite: true,
      }
    }
    await completeSetup(name.trim(), avatar, location.trim(), firstBike)
    setLoading(false)
  }

  if (cropSrc) {
    return <ImageCropper imageSrc={cropSrc} onDone={handleCropDone} onCancel={() => setCropSrc(null)} />
  }

  // Popular brands for picker
  const popularBrands = BIKE_BRANDS.slice(0, 10)

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col overflow-hidden">
      {/* Very subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-accent/5 via-bg-primary to-bg-primary pointer-events-none" />

      {/* Back button */}
      {step > 0 && (
        <button
          onClick={back}
          className="absolute top-safe left-4 mt-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-gray-400 text-lg"
        >
          ←
        </button>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Screens container */}
      <div className="relative flex-1">

        {/* ── Step 0: Name ─────────────────────────────────────── */}
        <Screen visible={step === 0}>
          <div className="flex flex-col items-center justify-center flex-1 px-8 pt-safe min-h-screen">
            <img src="/logo.png" className="w-20 h-20 rounded-2xl mb-10 shadow-2xl shadow-accent/20" />

            <div className="text-center mb-12 w-full">
              <h1 className="text-4xl font-black text-white mb-3 leading-tight">
                Welcome to<br /><span className="text-accent">MotoTrack</span>
              </h1>
              <p className="text-gray-400 text-base">What should your crew call you?</p>
            </div>

            <div className="w-full max-w-xs">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && next()}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-lg text-center font-semibold mb-6"
                placeholder="Your name"
                autoFocus
              />
              <ContinueBtn onClick={next} disabled={!name.trim()} label="Let's Go →" />
            </div>
          </div>
        </Screen>

        {/* ── Step 1: Avatar ────────────────────────────────────── */}
        <Screen visible={step === 1}>
          <div className="flex flex-col items-center px-6 pt-safe min-h-screen">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="mb-8">
                <AvatarPreview avatar={avatar} size="lg" />
                {uploading && (
                  <p className="text-gray-500 text-xs text-center mt-3 flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin inline-block" />
                    Uploading…
                  </p>
                )}
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white mb-2">Pick your identity</h2>
                <p className="text-gray-400 text-sm">How other riders will see you</p>
              </div>

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm font-medium mb-5 hover:bg-white/12 transition-all disabled:opacity-50"
              >
                <span>📷</span> Upload a photo
              </button>

              {/* Google photo option */}
              {googlePhotoUrl && (
                <button
                  onClick={() => setAvatar(googlePhotoUrl)}
                  className={`flex items-center gap-2 border rounded-2xl px-5 py-3 text-sm font-medium mb-5 transition-all ${
                    avatar === googlePhotoUrl ? 'border-accent bg-accent/10 text-white' : 'border-white/10 bg-white/5 text-gray-300'
                  }`}
                >
                  <img src={googlePhotoUrl} className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  Use Google photo
                  {avatar === googlePhotoUrl && <span className="text-accent ml-1">✓</span>}
                </button>
              )}

              {/* Emoji grid */}
              <div className="grid grid-cols-8 gap-2 w-full max-w-xs">
                {AVATARS.map(e => (
                  <button
                    key={e}
                    onClick={() => setAvatar(e)}
                    className={`aspect-square text-xl flex items-center justify-center rounded-xl transition-all duration-150 ${
                      avatar === e
                        ? 'bg-accent shadow-lg shadow-accent/40 scale-110'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full max-w-xs pb-8 pt-6">
              <ContinueBtn onClick={next} />
            </div>
          </div>
        </Screen>

        {/* ── Step 2: Location ─────────────────────────────────── */}
        <Screen visible={step === 2}>
          <div className="flex flex-col items-center justify-center flex-1 px-8 pt-safe min-h-screen">
            <div className="text-7xl mb-8">📍</div>

            <div className="text-center mb-12 w-full">
              <h2 className="text-3xl font-black text-white mb-3">Where do you ride?</h2>
              <p className="text-gray-400 text-sm">Helps connect you with local riders</p>
            </div>

            <div className="w-full max-w-xs">
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && next()}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-lg text-center font-semibold mb-4"
                placeholder="Bali, Indonesia"
                autoFocus
              />
              <ContinueBtn onClick={next} label="Continue" />
              <button onClick={next} className="w-full text-gray-600 text-sm py-3 mt-2 hover:text-gray-400 transition-colors">
                Skip for now
              </button>
            </div>
          </div>
        </Screen>

        {/* ── Step 3: Bike brand ───────────────────────────────── */}
        <Screen visible={step === 3}>
          <div className="flex flex-col px-6 pt-safe min-h-screen">
            <div className="text-center pt-16 mb-8">
              <h2 className="text-3xl font-black text-white mb-2">What do you ride?</h2>
              <p className="text-gray-400 text-sm">Pick your motorcycle brand</p>
            </div>

            <div className="grid grid-cols-3 gap-3 flex-1 pb-4">
              {popularBrands.map(b => (
                <button
                  key={b.name}
                  onClick={() => { setBrand(b.name); next() }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    brand === b.name
                      ? 'border-accent bg-accent/10'
                      : 'border-white/8 bg-white/4 hover:bg-white/8'
                  }`}
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img
                      src={b.logoUrl}
                      alt={b.name}
                      className="w-10 h-10 object-contain"
                      style={{ filter: 'brightness(0) invert(1)' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                  <span className="text-white text-xs font-semibold">{b.name}</span>
                </button>
              ))}

              {/* Other brand */}
              <button
                onClick={() => { setBrand(''); next() }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/8 bg-white/4 hover:bg-white/8 transition-all"
              >
                <span className="text-3xl">🏍️</span>
                <span className="text-gray-400 text-xs font-semibold">Other</span>
              </button>
            </div>
          </div>
        </Screen>

        {/* ── Step 4: Model + Year ─────────────────────────────── */}
        <Screen visible={step === 4}>
          <div className="flex flex-col items-center justify-center flex-1 px-8 pt-safe min-h-screen">
            {brand && (
              <div className="mb-6 opacity-60">
                <img
                  src={popularBrands.find(b => b.name === brand)?.logoUrl}
                  className="h-10 object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }}
                  onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                />
              </div>
            )}

            <div className="text-center mb-10 w-full">
              <h2 className="text-3xl font-black text-white mb-2">
                {brand ? `Which ${brand}?` : 'Your bike'}
              </h2>
              <p className="text-gray-400 text-sm">Model name and year</p>
            </div>

            <div className="w-full max-w-xs space-y-3">
              {!brand && (
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-base text-center"
                  placeholder="Brand (e.g. Yamaha)"
                />
              )}
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-base text-center"
                placeholder="Model (e.g. MT-15)"
                autoFocus
              />
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-base text-center"
                placeholder="Year"
              />
              <ContinueBtn onClick={next} disabled={!model.trim()} />
            </div>
          </div>
        </Screen>

        {/* ── Step 5: Type + CC + Plate ────────────────────────── */}
        <Screen visible={step === 5}>
          <div className="flex flex-col px-6 pt-safe min-h-screen">
            <div className="text-center pt-14 mb-6">
              <h2 className="text-3xl font-black text-white mb-2">Style & details</h2>
              <p className="text-gray-400 text-sm">What kind of bike is it?</p>
            </div>

            {/* Bike type grid */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {BIKE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setBikeType(t.value)}
                  className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border transition-all ${
                    bikeType === t.value
                      ? 'border-accent bg-accent/15 scale-105'
                      : 'border-white/8 bg-white/4 hover:bg-white/8'
                  }`}
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span className={`text-xs font-bold ${bikeType === t.value ? 'text-white' : 'text-gray-400'}`}>
                    {t.label}
                  </span>
                  <span className="text-[10px] text-gray-600">{t.desc}</span>
                </button>
              ))}
            </div>

            {/* CC + Plate */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block text-center">Engine CC</label>
                <input
                  type="number"
                  value={cc}
                  onChange={e => setCc(e.target.value)}
                  placeholder="155"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-sm text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block text-center">Plate (optional)</label>
                <input
                  type="text"
                  value={plate}
                  onChange={e => setPlate(e.target.value)}
                  placeholder="DK 1234 AB"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-sm text-center"
                />
              </div>
            </div>

            <div className="mt-auto pb-8">
              <ContinueBtn
                onClick={() => handleComplete(true)}
                disabled={loading}
                loading={loading}
                label={`Start Riding 🏍️`}
              />
              <button
                onClick={() => handleComplete(false)}
                disabled={loading}
                className="w-full text-gray-600 text-sm py-3 mt-2 hover:text-gray-400 transition-colors"
              >
                Skip bike for now
              </button>
            </div>
          </div>
        </Screen>

      </div>
    </div>
  )
}
