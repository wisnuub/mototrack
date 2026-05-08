import { useState, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { useStore } from '../../store/useStore'
import { dbUploadAvatar } from '../../lib/db'
import { isSupabaseReady } from '../../lib/supabase'
import type { Bike, BikeType } from '../../types'

const AVATARS = ['🤙', '👊', '✊', '🏍️', '⚡', '🔥', '💨', '🎯', '🦅', '🐺', '🦁', '💀', '🚀', '⚔️', '🦊', '🐉']
const BIKE_TYPES: { label: string; value: BikeType }[] = [
  { label: 'Naked', value: 'naked' },
  { label: 'Sport', value: 'sport' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Cruiser', value: 'cruiser' },
  { label: 'Touring', value: 'touring' },
  { label: 'Matic', value: 'matic' },
]

type Area = { x: number; y: number; width: number; height: number }

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
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size)
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9))
}

function AvatarPreview({ avatar }: { avatar: string }) {
  if (avatar.startsWith('http') || avatar.startsWith('data:')) {
    return <img src={avatar} className="w-20 h-20 rounded-full object-cover mx-auto" referrerPolicy="no-referrer" />
  }
  return (
    <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-4xl mx-auto">
      {avatar}
    </div>
  )
}

function ImageCropper({ imageSrc, onDone, onCancel }: {
  imageSrc: string
  onDone: (blob: Blob) => void
  onCancel: () => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [applying, setApplying] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedArea(pixels)
  }, [])

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
        <button
          onClick={handleApply}
          disabled={applying}
          className="text-accent font-semibold text-sm disabled:opacity-50"
        >
          {applying ? 'Applying…' : 'Apply'}
        </button>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="px-6 py-4 bg-black/80">
        <p className="text-gray-500 text-xs text-center mb-2">Pinch or scroll to zoom</p>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
      </div>
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
  const [uploadError, setUploadError] = useState('')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCropSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = e => res(e.target!.result as string)
      reader.onerror = rej
      reader.readAsDataURL(blob)
    })

  const handleCropDone = async (blob: Blob) => {
    setCropSrc(null)
    setUploading(true)
    setUploadError('')
    try {
      if (isSupabaseReady && user) {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000))
        try {
          const url = await Promise.race([dbUploadAvatar(user.id, file), timeout])
          setAvatar(url)
          return
        } catch {
          // Fall through to data URL
        }
      }
      // Fallback: store as base64 data URL (persists in local state)
      const dataUrl = await blobToDataUrl(blob)
      setAvatar(dataUrl)
    } catch (e: any) {
      setUploadError('Could not process image. Please try again.')
    } finally {
      setUploading(false)
    }
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

  if (cropSrc) {
    return (
      <ImageCropper
        imageSrc={cropSrc}
        onDone={handleCropDone}
        onCancel={() => setCropSrc(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
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

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center gap-3 bg-bg-card border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 mb-2 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm flex-shrink-0">
                  {uploading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                    : '📷'}
                </div>
                <span className="text-sm text-white">{uploading ? 'Uploading…' : 'Upload photo from device'}</span>
              </button>

              {uploadError && (
                <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2 mb-2">{uploadError}</p>
              )}

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
                  <input type="text" value={brand} onChange={e => setBrand(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                    placeholder="Yamaha" autoFocus />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Model</label>
                  <input type="text" value={model} onChange={e => setModel(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                    placeholder="MT-15" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Year</label>
                  <input type="number" value={year} onChange={e => setYear(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">CC</label>
                  <input type="number" value={cc} onChange={e => setCc(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                    placeholder="155" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type</label>
                  <select value={bikeType} onChange={e => setBikeType(e.target.value as BikeType)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-accent text-sm">
                    {BIKE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Plate</label>
                  <input type="text" value={plate} onChange={e => setPlate(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                    placeholder="DK 1234 AB" />
                </div>
              </div>
            </div>

            <button onClick={() => handleComplete(true)} disabled={loading || !brand.trim() || !model.trim()}
              className="w-full bg-accent text-white font-semibold py-3 rounded-xl disabled:opacity-50 mb-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up…
                </span>
              ) : 'Add Bike & Start Riding 🏍️'}
            </button>

            <button onClick={() => handleComplete(false)} disabled={loading}
              className="w-full text-gray-500 text-sm py-2 hover:text-gray-400 transition-colors">
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  )
}
