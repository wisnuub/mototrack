import { useState, useRef } from 'react'
import { X, ChevronLeft, Star, Camera, Check, ChevronDown } from 'lucide-react'
import { BIKE_BRANDS, OIL_BRANDS, OIL_SAE_GRADES, TIRE_BRANDS, DRIVE_BRANDS } from '../../data/bikeData'
import type { BrandInfo, ModelInfo } from '../../data/bikeData'
import type { OilType, DriveType, Bike } from '../../types'
import { useStore } from '../../store/useStore'

// ── Brand logo with text fallback ─────────────────────────────────────────────

export function BrandLogo({ brand, size = 'md' }: { brand: BrandInfo; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false)
  const dims = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' }
  const imgDims = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-11 h-11' }
  return (
    <div
      className={`${dims[size]} rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden`}
      style={{ backgroundColor: brand.color + '18', border: `1.5px solid ${brand.color}30` }}
    >
      {!failed ? (
        <img
          src={brand.logoUrl}
          alt={brand.name}
          className={`${imgDims[size]} object-contain`}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-bold" style={{ color: brand.color }}>{brand.logoFallback}</span>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function healthColor(pct: number) {
  if (pct >= 60) return '#30d158'
  if (pct >= 30) return '#ffd60a'
  return '#ff453a'
}

function HealthSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const pct = value
  const color = healthColor(pct)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="font-bold text-sm" style={{ color }}>
          {pct}% {pct >= 60 ? '✅' : pct >= 30 ? '⚠️' : '🔴'}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pct}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #2a2a32 ${pct}%, #2a2a32 100%)`,
            WebkitAppearance: 'none',
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>0% worn</span>
        <span>50%</span>
        <span>100% new</span>
      </div>
    </div>
  )
}

function SearchableList({
  items,
  value,
  onSelect,
  placeholder,
}: {
  items: string[]
  value: string
  onSelect: (v: string) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const filtered = items.filter(i => i.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="space-y-2">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        className="w-full bg-bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
      />
      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
        {filtered.map(item => (
          <button
            key={item}
            onClick={() => { onSelect(item); setQuery('') }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
              value === item
                ? 'bg-accent text-white font-semibold'
                : 'bg-bg-surface text-gray-300 hover:bg-bg-card'
            }`}
          >
            {item}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-xs text-center py-3">No results</p>
        )}
      </div>
    </div>
  )
}

// ── Bike Photo / Placeholder ───────────────────────────────────────────────

function PlaceholderBg({
  brand, model, color, size,
}: { brand: string; model: string; color: string; size: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-24', md: 'h-40', lg: 'h-56' }
  const textSizes = { sm: 'text-4xl', md: 'text-6xl', lg: 'text-8xl' }
  return (
    <div
      className={`w-full ${sizes[size]} rounded-2xl flex flex-col items-center justify-center relative overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${color}18 0%, ${color}35 100%)` }}
    >
      <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full opacity-10" style={{ border: `3px solid ${color}` }} />
      <div className="absolute -right-3 -bottom-3 w-20 h-20 rounded-full opacity-10" style={{ border: `3px solid ${color}` }} />
      <span className={textSizes[size]}>🏍️</span>
      <p className="text-white font-bold text-sm mt-1">{brand}</p>
      <p style={{ color }} className="text-xs font-semibold">{model}</p>
    </div>
  )
}

export function BikePlaceholder({
  brand,
  model,
  color,
  imageUrl,
  size = 'md',
}: {
  brand: string
  model: string
  color: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const sizes = { sm: 'h-24', md: 'h-40', lg: 'h-56' }

  // If a manufacturer URL is provided (and hasn't failed), try it first.
  // Many manufacturer sites set CORS headers that allow <img> loads even
  // when fetch() would be blocked — so this works more often than not.
  if (imageUrl && !imgFailed) {
    return (
      <div className={`w-full ${sizes[size]} rounded-2xl overflow-hidden bg-bg-surface relative`}>
        <img
          src={imageUrl}
          alt={`${brand} ${model}`}
          className="w-full h-full object-contain"
          style={{ background: `linear-gradient(135deg, ${color}10 0%, ${color}20 100%)` }}
          onError={() => setImgFailed(true)}
        />
      </div>
    )
  }

  return <PlaceholderBg brand={brand} model={model} color={color} size={size} />
}

// ── Step definitions ───────────────────────────────────────────────────────

type Step = 'brand' | 'model' | 'details' | 'oil' | 'tires' | 'drive'

const OIL_TYPE_OPTIONS: { value: OilType; label: string; sub: string }[] = [
  { value: 'mineral',        label: 'Mineral',         sub: 'Basic protection, budget-friendly' },
  { value: 'semi-synthetic', label: 'Semi-Synthetic',  sub: 'Balanced performance & price' },
  { value: 'fully-synthetic', label: 'Fully Synthetic', sub: 'Max protection, high performance' },
]

// ── Main component ─────────────────────────────────────────────────────────

interface AddBikeModalProps {
  onClose: () => void
}

export default function AddBikeModal({ onClose }: AddBikeModalProps) {
  const addBike = useStore(s => s.addBike)

  // Navigation
  const [step, setStep] = useState<Step>('brand')
  const STEPS: Step[] = ['brand', 'model', 'details', 'oil', 'tires', 'drive']
  const stepIndex = STEPS.indexOf(step)

  // Step 1 — brand
  const [brand, setBrand] = useState<BrandInfo | null>(null)

  // Step 2 — model
  const [model, setModel] = useState<ModelInfo | null>(null)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [plateNumber, setPlateNumber] = useState('')
  const [odometer, setOdometer] = useState('0')

  // Step 3 — details
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [isFavorite, setIsFavorite] = useState(false)
  const [nickname, setNickname] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState('#1a1a1a')
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 4 — oil
  const [oilBrand, setOilBrand] = useState('')
  const [oilType, setOilType] = useState<OilType>('semi-synthetic')
  const [oilSAE, setOilSAE] = useState('10W-40')

  // Step 5 — tires
  const [tireFrontBrand, setTireFrontBrand] = useState('')
  const [tireFrontHealth, setTireFrontHealth] = useState(80)
  const [tireRearBrand, setTireRearBrand] = useState('')
  const [tireRearHealth, setTireRearHealth] = useState(80)

  // Step 6 — drive
  const [driveBrand, setDriveBrand] = useState('')
  const [driveHealth, setDriveHealth] = useState(80)

  const driveType: DriveType = model?.driveType ?? 'chain'
  const brandColor = model?.color ?? brand?.models[0]?.color ?? '#ff6b35'

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const canProceed = () => {
    if (step === 'brand')   return brand !== null
    if (step === 'model')   return model !== null && plateNumber.trim().length > 0
    if (step === 'details') return nickname.trim().length > 0
    return true // optional steps always passable
  }

  const next = () => {
    const idx = STEPS.indexOf(step)
    // Skip 'drive' step header text if shaft drive (nothing to configure)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
    else finish()
  }

  const back = () => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
    else onClose()
  }

  const finish = () => {
    if (!brand || !model) return
    addBike({
      riderId: 'rider-1',
      nickname: nickname || `${brand.name} ${model.name}`,
      brand: brand.name,
      model: model.name,
      year,
      type: model.type,
      cc: model.cc,
      color,
      plateNumber,
      odometer: parseInt(odometer) || 0,
      isFavorite,
      photo,
      notes: notes || undefined,
      oilBrand: oilBrand || undefined,
      oilType,
      oilSAE,
      tireFrontBrand: tireFrontBrand || undefined,
      tireFrontHealth,
      tireRearBrand: tireRearBrand || undefined,
      tireRearHealth,
      driveType,
      driveBrand: driveBrand || undefined,
      driveHealth,
    })
    onClose()
  }

  // ── Step labels ────────────────────────────────────────────────────────────

  const STEP_LABELS: Record<Step, string> = {
    brand:   'Select Brand',
    model:   'Select Model',
    details: 'Bike Details',
    oil:     'Oil Setup',
    tires:   'Tires',
    drive:   driveType === 'vbelt' ? 'V-Belt' : driveType === 'shaft' ? 'Shaft Drive' : 'Chain',
  }

  const isOptional = (s: Step) => ['oil', 'tires', 'drive'].includes(s)
  const isLastStep = stepIndex === STEPS.length - 1

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg-secondary w-full max-w-lg rounded-t-3xl flex flex-col animate-slide-up"
           style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className="rounded-full transition-all"
                style={{
                  width:  i === stepIndex ? 20 : 6,
                  height: 6,
                  backgroundColor: i < stepIndex ? '#30d158' : i === stepIndex ? '#ff6b35' : '#2a2a32',
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={back} className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-card text-gray-400">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <p className="text-white font-bold text-base">{STEP_LABELS[step]}</p>
              {isOptional(step) && (
                <p className="text-gray-500 text-xs">Optional — tap Skip to continue</p>
              )}
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-card text-gray-400">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0">

          {/* ── Step 1: Brand ── */}
          {step === 'brand' && (
            <div className="grid grid-cols-2 gap-3">
              {BIKE_BRANDS.map(b => (
                <button
                  key={b.name}
                  onClick={() => { setBrand(b); setModel(null) }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    brand?.name === b.name
                      ? 'border-accent bg-accent/10'
                      : 'border-white/8 bg-bg-card hover:border-white/20'
                  }`}
                >
                  <BrandLogo brand={b} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">{b.name}</p>
                    <p className="text-gray-500 text-xs">{b.country}</p>
                  </div>
                  {brand?.name === b.name && (
                    <Check size={14} className="text-accent flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Step 2: Model ── */}
          {step === 'model' && brand && (
            <div className="space-y-4">
              {/* Header with brand logo */}
              <div className="flex items-center gap-3 bg-bg-card rounded-2xl p-3 border border-white/5">
                <BrandLogo brand={brand} size="md" />
                <div>
                  <p className="text-white font-bold">{brand.name}</p>
                  <p className="text-gray-500 text-xs">{brand.models.length} models · {brand.country}</p>
                </div>
              </div>

              <div className="space-y-2">
                {brand.models.map(m => (
                  <button
                    key={m.name}
                    onClick={() => { setModel(m); setColor(m.color); setYear(m.yearTo) }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      model?.name === m.name
                        ? 'border-accent bg-accent/10'
                        : 'border-white/8 bg-bg-card hover:border-white/20'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: m.color + '20' }}
                    >
                      🏍️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{m.name}</p>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="text-gray-400 text-xs font-medium">{m.cc}cc</span>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-400 text-xs capitalize">{m.stroke}</span>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-400 text-xs capitalize">{m.cylinders}</span>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-500 text-xs">{m.yearFrom}–{m.yearTo === new Date().getFullYear() ? 'present' : m.yearTo}</span>
                      </div>
                    </div>
                    {model?.name === m.name && (
                      <Check size={14} className="text-accent flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {model && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Your bike info</p>

                  {/* Year — free-form number input covering full production range */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">
                      Production Year
                      <span className="text-gray-600 ml-1">({model.yearFrom}–{model.yearTo === new Date().getFullYear() ? 'present' : model.yearTo})</span>
                    </label>
                    <input
                      type="number"
                      value={year}
                      min={model.yearFrom}
                      max={new Date().getFullYear()}
                      onChange={e => setYear(Number(e.target.value))}
                      className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent font-mono"
                    />
                    {year < model.yearFrom || year > new Date().getFullYear() + 1 ? (
                      <p className="text-moto-yellow text-xs mt-1">⚠️ Year outside known production range</p>
                    ) : null}
                  </div>

                  {/* Engine spec badge */}
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { icon: model.stroke === '2-stroke' ? '⚡' : '🔄', label: model.stroke },
                      { icon: '🔩', label: model.cylinders },
                      { icon: '⛓️', label: model.driveType },
                      { icon: '🏷️', label: model.type },
                    ].map(b => (
                      <span key={b.label} className="flex items-center gap-1 text-xs bg-bg-surface text-gray-300 px-2.5 py-1 rounded-full">
                        <span>{b.icon}</span>
                        <span className="capitalize">{b.label}</span>
                      </span>
                    ))}
                  </div>

                  {/* Plate */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Plate Number</label>
                    <input
                      value={plateNumber}
                      onChange={e => setPlateNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. DK 4251 AB"
                      className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm font-mono uppercase focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Odometer */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Current Odometer (km)</label>
                    <input
                      type="number"
                      value={odometer}
                      onChange={e => setOdometer(e.target.value)}
                      placeholder="0"
                      min={0}
                      className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Details ── */}
          {step === 'details' && model && brand && (
            <div className="space-y-4">
              {/* Photo */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Bike Photo</label>
                <div
                  className="relative cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  {photo ? (
                    <div className="relative">
                      <img
                        src={photo}
                        alt="Bike"
                        className="w-full h-44 object-cover rounded-2xl"
                      />
                      <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
                          <Camera size={16} className="text-white" />
                          <span className="text-white text-sm font-medium">Change photo</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <BikePlaceholder
                        brand={brand.name}
                        model={model.name}
                        color={brandColor}
                        imageUrl={model.imageUrl}
                        size="md"
                      />
                      <div className="absolute inset-0 rounded-2xl flex items-end justify-center pb-3">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                          <Camera size={14} className="text-white" />
                          <span className="text-white text-xs font-semibold">Upload your own photo</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhoto}
                />
                {!photo && (
                  <p className="text-gray-600 text-xs text-center mt-1">
                    {model.imageUrl
                      ? 'Showing manufacturer image · tap to use your own'
                      : 'Tap to upload from camera or gallery'}
                  </p>
                )}
              </div>

              {/* Favorite */}
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  isFavorite ? 'border-accent-amber bg-accent-amber/10' : 'border-white/8 bg-bg-card'
                }`}
              >
                <Star
                  size={20}
                  className={isFavorite ? 'text-accent-amber' : 'text-gray-500'}
                  fill={isFavorite ? 'currentColor' : 'none'}
                />
                <div className="text-left">
                  <p className={`font-semibold text-sm ${isFavorite ? 'text-accent-amber' : 'text-white'}`}>
                    {isFavorite ? 'Set as Favorite ★' : 'Set as Favorite'}
                  </p>
                  <p className="text-gray-500 text-xs">This will be your default bike for rides</p>
                </div>
              </button>

              {/* Nickname */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Nickname <span className="text-accent">*</span></label>
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder={`e.g. Black Panther, Thunder Beast…`}
                  className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
                />
              </div>

              {/* Bike color */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Bike Color</label>
                <div className="flex gap-3 items-center">
                  <div className="flex gap-2 flex-wrap flex-1">
                    {[
                      { label: 'Black',  hex: '#1a1a1a' },
                      { label: 'White',  hex: '#f0f0f0' },
                      { label: 'Red',    hex: '#cc0000' },
                      { label: 'Blue',   hex: '#003087' },
                      { label: 'Green',  hex: '#009900' },
                      { label: 'Orange', hex: '#ff6600' },
                      { label: 'Yellow', hex: '#ffc107' },
                      { label: 'Silver', hex: '#c0c0c0' },
                    ].map(c => (
                      <button
                        key={c.hex}
                        title={c.label}
                        onClick={() => setColor(c.hex)}
                        className="w-8 h-8 rounded-full transition-all"
                        style={{
                          backgroundColor: c.hex,
                          border: color === c.hex ? '3px solid #ff6b35' : '2px solid rgba(255,255,255,0.15)',
                          transform: color === c.hex ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Mods, special parts, history…"
                  rows={3}
                  className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent resize-none"
                />
              </div>
            </div>
          )}

          {/* ── Step 4: Oil ── */}
          {step === 'oil' && (
            <div className="space-y-4">
              {/* Type pills */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Oil Type</label>
                <div className="space-y-2">
                  {OIL_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setOilType(opt.value)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                        oilType === opt.value ? 'border-accent bg-accent/10' : 'border-white/8 bg-bg-card'
                      }`}
                    >
                      <span className="text-2xl">{opt.value === 'mineral' ? '🟤' : opt.value === 'semi-synthetic' ? '🟡' : '🔵'}</span>
                      <div>
                        <p className={`font-semibold text-sm ${oilType === opt.value ? 'text-accent' : 'text-white'}`}>{opt.label}</p>
                        <p className="text-gray-500 text-xs">{opt.sub}</p>
                      </div>
                      {oilType === opt.value && <Check size={14} className="text-accent ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* SAE Grade */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">SAE Grade</label>
                <div className="flex gap-2 flex-wrap">
                  {OIL_SAE_GRADES.map(g => (
                    <button
                      key={g}
                      onClick={() => setOilSAE(g)}
                      className={`px-3 py-2 rounded-xl text-sm font-mono font-medium transition-all ${
                        oilSAE === g ? 'bg-accent text-white' : 'bg-bg-card text-gray-400'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Brand</label>
                <SearchableList
                  items={OIL_BRANDS}
                  value={oilBrand}
                  onSelect={setOilBrand}
                  placeholder="Search oil brand…"
                />
              </div>
            </div>
          )}

          {/* ── Step 5: Tires ── */}
          {step === 'tires' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">🔵 Front Tire</p>
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Brand</label>
                  <SearchableList
                    items={TIRE_BRANDS}
                    value={tireFrontBrand}
                    onSelect={setTireFrontBrand}
                    placeholder="Search tire brand…"
                  />
                </div>
                <HealthSlider
                  label="Front Tire Health"
                  value={tireFrontHealth}
                  onChange={setTireFrontHealth}
                />
              </div>

              <div className="border-t border-white/5 pt-4 space-y-3">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">🟠 Rear Tire</p>
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Brand</label>
                  <SearchableList
                    items={TIRE_BRANDS}
                    value={tireRearBrand}
                    onSelect={setTireRearBrand}
                    placeholder="Search tire brand…"
                  />
                </div>
                <HealthSlider
                  label="Rear Tire Health"
                  value={tireRearHealth}
                  onChange={setTireRearHealth}
                />
              </div>
            </div>
          )}

          {/* ── Step 6: Drive ── */}
          {step === 'drive' && (
            <div className="space-y-5">
              {driveType === 'shaft' ? (
                <div className="bg-bg-card rounded-2xl p-6 text-center border border-white/5">
                  <p className="text-4xl mb-3">⚙️</p>
                  <p className="text-white font-semibold">Shaft Drive</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Shaft drives are maintenance-free for the most part. No chain or belt to replace — just regular oil changes.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-bg-card rounded-xl px-4 py-3 border border-white/8 flex items-center gap-3">
                    <span className="text-2xl">{driveType === 'vbelt' ? '⚙️' : '🔗'}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {driveType === 'vbelt' ? 'V-Belt Drive (Matic)' : 'Chain Drive'}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {driveType === 'vbelt'
                          ? 'Detected: automatic transmission belt drive'
                          : 'Detected: manual chain & sprocket'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Brand</label>
                    <SearchableList
                      items={DRIVE_BRANDS[driveType]}
                      value={driveBrand}
                      onSelect={setDriveBrand}
                      placeholder={`Search ${driveType === 'vbelt' ? 'belt' : 'chain'} brand…`}
                    />
                  </div>

                  <HealthSlider
                    label={driveType === 'vbelt' ? 'V-Belt Health' : 'Chain Health'}
                    value={driveHealth}
                    onChange={setDriveHealth}
                  />

                  <div className="bg-bg-card rounded-xl p-3 border border-white/5">
                    <p className="text-gray-400 text-xs">
                      {driveType === 'vbelt'
                        ? '💡 V-belt replacement is typically needed every 8,000–12,000 km for matic bikes.'
                        : '💡 Chain lubrication every 500–700 km. Replace when stretched or worn beyond spec.'}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Footer buttons */}
        <div className="flex-shrink-0 px-5 pb-6 pt-3 border-t border-white/5 space-y-2">
          <button
            onClick={next}
            disabled={!canProceed()}
            className="w-full bg-accent text-white font-bold py-3.5 rounded-2xl disabled:opacity-40 text-base transition-all active:scale-95"
          >
            {isLastStep ? '✅ Add Motorcycle' : 'Continue →'}
          </button>

          {isOptional(step) && !isLastStep && (
            <button
              onClick={next}
              className="w-full text-gray-500 text-sm py-2"
            >
              Skip this step
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
