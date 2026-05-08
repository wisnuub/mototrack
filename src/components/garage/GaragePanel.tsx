import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Plus, Wrench, Gauge, X, AlertTriangle, Star, ChevronRight, Trash2, ExternalLink, Share2 } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import type { MaintenanceType, MaintenanceRecord, Bike, ModCategory, BikeModification, GarageShareData } from '../../types'
import AddBikeModal, { BikePlaceholder, BrandLogo } from './AddBikeModal'
import { BIKE_BRANDS } from '../../data/bikeData'
import { ActivityPostCard } from '../profile/ProfileSheet'

// ── Constants ────────────────────────────────────────────────────────────────

const MAINT_LABELS: Record<MaintenanceType, { label: string; icon: string; interval: number }> = {
  oil_change:   { label: 'Oil Change',       icon: '🛢️',  interval: 2500 },
  vbelt:        { label: 'V-Belt (Matic)',    icon: '⚙️',  interval: 8000 },
  tire_front:   { label: 'Front Tire',        icon: '🔵',  interval: 10000 },
  tire_rear:    { label: 'Rear Tire',         icon: '🟠',  interval: 8000 },
  brake_front:  { label: 'Front Brake',       icon: '🔴',  interval: 10000 },
  brake_rear:   { label: 'Rear Brake',        icon: '🔴',  interval: 12000 },
  chain:        { label: 'Chain & Sprocket',  icon: '🔗',  interval: 5000 },
  full_service: { label: 'Full Service',      icon: '🔧',  interval: 5000 },
  other:        { label: 'Other',             icon: '📋',  interval: 0 },
}

const MAINT_TYPES = Object.entries(MAINT_LABELS).map(([k, v]) => ({ value: k as MaintenanceType, ...v }))

const BIKE_TYPE_LABELS: Record<string, string> = {
  matic: 'Automatic (Matic)',
  sport: 'Sport',
  naked: 'Naked / Street',
  cruiser: 'Cruiser',
  adventure: 'Adventure',
  touring: 'Touring',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getHealthColors(pct: number) {
  if (pct >= 60) return { bar: '#30d158', text: 'text-moto-green', label: 'Good' }
  if (pct >= 30) return { bar: '#ffd60a', text: 'text-moto-yellow', label: 'Wear' }
  return { bar: '#ff453a', text: 'text-moto-red', label: 'Critical' }
}

function HealthBar({ label, pct, brand }: { label: string; pct: number; brand?: string }) {
  const c = getHealthColors(pct)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}{brand ? ` · ${brand}` : ''}</span>
        <span className={`font-semibold ${c.text}`}>{pct}% {c.label}</span>
      </div>
      <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.bar }} />
      </div>
    </div>
  )
}

// ── Add Maintenance Modal ────────────────────────────────────────────────────

function AddMaintenanceModal({ bikeId, odometer, onClose }: {
  bikeId: string
  odometer: number
  onClose: () => void
}) {
  const addRecord = useStore(s => s.addMaintenanceRecord)
  const [type, setType] = useState<MaintenanceType>('oil_change')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [odo, setOdo] = useState(String(odometer))
  const [notes, setNotes] = useState('')
  const [cost, setCost] = useState('')

  const handle = () => {
    addRecord({
      bikeId,
      type,
      date: new Date(date),
      odometer: parseInt(odo),
      notes,
      cost: cost ? parseInt(cost) : undefined,
      nextServiceKm: MAINT_LABELS[type].interval > 0
        ? parseInt(odo) + MAINT_LABELS[type].interval
        : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl p-5 w-full max-w-lg animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Log Maintenance</h3>
          <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {MAINT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all ${
                    type === t.value ? 'border-accent bg-accent/10 text-white' : 'border-white/10 text-gray-400 bg-bg-card'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span className="text-xs truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Odometer (km)</label>
              <input type="number" value={odo} onChange={e => setOdo(e.target.value)}
                className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Cost (Rp)</label>
            <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="Optional"
              className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Parts replaced, shop name…" rows={2}
              className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent resize-none" />
          </div>

          <button onClick={handle} className="w-full bg-accent text-white font-semibold py-3 rounded-xl">
            Save Record
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Maintenance history card ─────────────────────────────────────────────────

function MaintenanceCard({ record, odometer }: { record: MaintenanceRecord; odometer: number }) {
  const meta = MAINT_LABELS[record.type]
  const kmSince = odometer - record.odometer
  const health = meta.interval > 0 ? Math.max(0, 1 - kmSince / meta.interval) : 1
  const c = getHealthColors(health * 100)
  const kmLeft = meta.interval > 0 ? Math.max(0, meta.interval - kmSince) : null
  const isOverdue = kmLeft === 0

  return (
    <div className={`bg-bg-card rounded-2xl p-4 border ${isOverdue ? 'border-moto-red/40' : 'border-white/5'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <p className="text-white font-semibold text-sm">{meta.label}</p>
            <p className="text-gray-500 text-xs">
              {format(new Date(record.date), 'dd MMM yyyy')} · {record.odometer.toLocaleString()} km
            </p>
          </div>
        </div>
        {isOverdue && (
          <div className="flex items-center gap-1 bg-moto-red/20 rounded-full px-2 py-0.5">
            <AlertTriangle size={10} className="text-moto-red" />
            <span className="text-moto-red text-xs font-semibold">Due!</span>
          </div>
        )}
      </div>

      {meta.interval > 0 && (
        <>
          <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden mb-1">
            <div className="h-full rounded-full" style={{ width: `${health * 100}%`, backgroundColor: c.bar }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{kmSince.toLocaleString()} km since</span>
            <span className={c.text}>{kmLeft !== null ? (kmLeft > 0 ? `${kmLeft.toLocaleString()} km left` : 'Overdue') : '—'}</span>
          </div>
        </>
      )}

      {record.notes && <p className="text-gray-400 text-xs mt-2 italic">"{record.notes}"</p>}
      {record.cost && <p className="text-gray-500 text-xs mt-0.5">Rp {record.cost.toLocaleString()}</p>}
    </div>
  )
}

// ── Modifications ────────────────────────────────────────────────────────────

const MOD_CATEGORIES: { value: ModCategory; label: string }[] = [
  { value: 'rims',         label: 'Rims' },
  { value: 'lamp',         label: 'Lamp' },
  { value: 'exhaust',      label: 'Exhaust' },
  { value: 'shockbreaker', label: 'Shockbreaker' },
  { value: 'stabilizer',   label: 'Stabilizer' },
  { value: 'handle_bar',   label: 'Handle Bar' },
  { value: 'seat',         label: 'Seat' },
  { value: 'ecu_cdi',      label: 'ECU / CDI' },
  { value: 'spark_plug',   label: 'Spark Plug' },
  { value: 'air_filter',   label: 'Air Filter' },
  { value: 'brake',        label: 'Brake' },
  { value: 'phone_holder', label: 'Phone Holder' },
  { value: 'windshield',   label: 'Windshield' },
  { value: 'body_kit',     label: 'Body Kit' },
  { value: 'other',        label: 'Other' },
]

function shopPlatform(url: string): { label: string; color: string } {
  if (url.includes('shopee'))    return { label: 'Shopee',   color: 'text-orange-400' }
  if (url.includes('tokopedia')) return { label: 'Tokopedia',color: 'text-green-400' }
  if (url.includes('tiktok'))    return { label: 'TikTok',   color: 'text-pink-400' }
  return { label: 'Shop', color: 'text-gray-400' }
}

function AddModModal({ bikeId, onClose }: { bikeId: string; onClose: () => void }) {
  const addMod = useStore(s => s.addMod)
  const [category, setCategory] = useState<ModCategory>('exhaust')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [notes, setNotes] = useState('')
  const [shopUrl, setShopUrl] = useState('')
  const [price, setPrice] = useState('')

  const handle = async () => {
    if (!name.trim()) return
    await addMod(bikeId, {
      category,
      name: name.trim(),
      brand: brand.trim() || undefined,
      notes: notes.trim() || undefined,
      shopUrl: shopUrl.trim() || undefined,
      price: price ? parseInt(price) : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl p-5 w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Add Modification</h3>
          <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {MOD_CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    category === c.value
                      ? 'bg-accent border-accent text-white'
                      : 'border-white/15 text-gray-400 bg-bg-card hover:border-white/30'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Yoshimura R-77"
                className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="e.g. Yoshimura"
                className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Shop Link (Shopee / Tokopedia / TikTok)</label>
            <input
              type="url"
              value={shopUrl}
              onChange={e => setShopUrl(e.target.value)}
              placeholder="Paste product URL"
              className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Price (Rp)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Optional"
              className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Install date, shop name, experience…"
              rows={2}
              className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <button
            onClick={handle}
            disabled={!name.trim()}
            className="w-full bg-accent text-white font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            Save Modification
          </button>
        </div>
      </div>
    </div>
  )
}

function ModificationsSection({ bike, onShareMod }: { bike: Bike; onShareMod: (mod: BikeModification) => void }) {
  const mods = useStore(s => s.mods.filter(m => m.bikeId === bike.id))
  const removeMod = useStore(s => s.removeMod)
  const [showAdd, setShowAdd] = useState(false)

  const grouped = MOD_CATEGORIES
    .map(c => ({ ...c, items: mods.filter(m => m.category === c.value) }))
    .filter(g => g.items.length > 0)

  return (
    <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Modifications</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 bg-accent text-white text-xs font-semibold px-3 py-1.5 rounded-full"
        >
          <Plus size={11} />Add
        </button>
      </div>

      {grouped.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No modifications logged yet</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.value}>
              <p className="text-gray-500 text-xs font-semibold mb-2">{group.label}</p>
              <div className="space-y-2">
                {group.items.map(mod => (
                  <div key={mod.id} className="flex items-start gap-3 bg-bg-surface rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{mod.name}</p>
                      {mod.brand && <p className="text-gray-500 text-xs">{mod.brand}</p>}
                      {mod.price && (
                        <p className="text-gray-500 text-xs">Rp {mod.price.toLocaleString()}</p>
                      )}
                      {mod.notes && (
                        <p className="text-gray-500 text-xs mt-0.5 italic">"{mod.notes}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {mod.shopUrl && (() => {
                        const p = shopPlatform(mod.shopUrl)
                        return (
                          <a
                            href={mod.shopUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs font-semibold flex items-center gap-1 ${p.color}`}
                          >
                            {p.label} <ExternalLink size={10} />
                          </a>
                        )
                      })()}
                      <button
                        onClick={() => onShareMod(mod)}
                        className="text-gray-600 hover:text-accent transition-colors"
                      >
                        <Share2 size={14} />
                      </button>
                      <button
                        onClick={() => removeMod(mod.id)}
                        className="text-gray-600 hover:text-moto-red transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModModal bikeId={bike.id} onClose={() => setShowAdd(false)} />}
    </div>
  )
}

// ── Conversation Picker ───────────────────────────────────────────

function ConversationPicker({ onSelect, onClose }: {
  onSelect: (convId: string) => void
  onClose: () => void
}) {
  const conversations = useStore(s => s.conversations)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl p-5 w-full max-w-lg animate-slide-up max-h-[60vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Share to Chat</h3>
          <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        </div>
        <div className="space-y-2">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => { onSelect(conv.id); onClose() }}
              className="w-full flex items-center gap-3 bg-bg-card rounded-xl px-3 py-3 hover:bg-bg-surface transition-all text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-xl flex-shrink-0">
                {conv.emoji ?? (conv.type === 'group' ? '👥' : '💬')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{conv.name}</p>
                <p className="text-gray-500 text-xs capitalize">{conv.type}</p>
              </div>
              <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-6">No conversations yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Activity section ──────────────────────────────────────────────

function GarageActivitySection() {
  const user = useStore(s => s.user)
  const activityPosts = useStore(s => s.activityPosts.filter(p => p.userId === (user?.id ?? 'local')))
  const filtered = activityPosts.filter(p => p.activityType === 'service')
  if (filtered.length === 0) return null
  return (
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Service History</p>
      <div className="space-y-3">
        {filtered.slice(0, 3).map(p => <ActivityPostCard key={p.id} post={p} />)}
      </div>
    </div>
  )
}

// ── Bike detail view ──────────────────────────────────────────────────────────

function BikeDetail({ bike }: { bike: Bike }) {
  const maintenance = useStore(s => s.maintenance.filter(m => m.bikeId === bike.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  const sendMessage = useStore(s => s.sendMessage)
  const [showAddMaint, setShowAddMaint] = useState(false)
  const [showSharePicker, setShowSharePicker] = useState(false)
  const [shareMod, setShareMod] = useState<BikeModification | null>(null)

  const shareGarage = (convId: string, mod?: BikeModification) => {
    const garageData: GarageShareData = {
      bikeId: bike.id,
      bikeName: `${bike.year} ${bike.brand} ${bike.model}`,
      bikeImage: bike.photo ?? bike.imageUrl,
      brandColor: bike.color,
      mod: mod ? { id: mod.id, name: mod.name, brand: mod.brand, category: mod.category } : undefined,
    }
    const content = mod
      ? `Check out my ${mod.name} on my ${bike.brand} ${bike.model}!`
      : `Check out my ${bike.brand} ${bike.model}!`
    sendMessage(convId, content, 'garage_share', { garageData })
  }

  const lastOil  = maintenance.find(m => m.type === 'oil_change')
  const lastBelt = maintenance.find(m => m.type === 'vbelt')

  const driveIcon = bike.driveType === 'vbelt' ? '⚙️' : bike.driveType === 'shaft' ? '🔩' : '🔗'
  const driveLabel = bike.driveType === 'vbelt' ? 'V-Belt' : bike.driveType === 'shaft' ? 'Shaft' : 'Chain'

  // Which health metrics to show based on what's been filled in
  const showDrive = bike.driveType && bike.driveType !== 'shaft' && bike.driveHealth !== undefined

  return (
    <div className="space-y-4">
      {/* Hero image */}
      <div className="relative">
        <BikePlaceholder
          brand={bike.brand}
          model={bike.model}
          color={bike.color}
          imageUrl={bike.photo ?? bike.imageUrl}
          size="lg"
        />
        {bike.isFavorite && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-accent-amber/90 rounded-full px-2.5 py-1">
            <Star size={11} fill="white" className="text-white" />
            <span className="text-white text-xs font-bold">Favorite</span>
          </div>
        )}
        <button
          onClick={() => setShowSharePicker(true)}
          className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-semibold"
        >
          <Share2 size={12} /> Share
        </button>
      </div>

      {/* Bike identity */}
      <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
        <div className="flex items-start gap-3">
          <BrandLogo brand={BIKE_BRANDS.find(b => b.name === bike.brand) ?? BIKE_BRANDS[0]} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg leading-tight">{bike.nickname}</p>
            <p className="text-gray-400 text-sm">{bike.year} {bike.brand} {bike.model}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {BIKE_TYPE_LABELS[bike.type]} · {bike.cc}cc · {bike.plateNumber}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white font-bold text-lg">{bike.odometer.toLocaleString()}</p>
            <p className="text-gray-500 text-xs">km</p>
          </div>
        </div>
        {bike.notes && (
          <p className="text-gray-400 text-xs mt-3 italic border-t border-white/5 pt-3">"{bike.notes}"</p>
        )}
      </div>

      {/* Oil info */}
      {(bike.oilBrand || bike.oilType) && (
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">🛢️ Engine Oil</p>
          <div className="flex gap-2 flex-wrap">
            {bike.oilBrand && (
              <span className="bg-bg-surface text-gray-300 text-xs px-2.5 py-1 rounded-full">{bike.oilBrand}</span>
            )}
            {bike.oilType && (
              <span className="bg-bg-surface text-gray-300 text-xs px-2.5 py-1 rounded-full capitalize">
                {bike.oilType.replace('-', ' ')}
              </span>
            )}
            {bike.oilSAE && (
              <span className="bg-accent/20 text-accent text-xs px-2.5 py-1 rounded-full font-mono font-semibold">{bike.oilSAE}</span>
            )}
          </div>
          {lastOil && (
            <p className="text-gray-500 text-xs mt-2">
              Last changed {formatDistanceToNow(new Date(lastOil.date), { addSuffix: true })}
              {' '}· {lastOil.odometer.toLocaleString()} km
            </p>
          )}
        </div>
      )}

      {/* Component health */}
      {(bike.tireFrontHealth !== undefined || bike.tireRearHealth !== undefined || showDrive) && (
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5 space-y-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Component Health</p>
          {bike.tireFrontHealth !== undefined && (
            <HealthBar label="Front Tire" pct={bike.tireFrontHealth} brand={bike.tireFrontBrand} />
          )}
          {bike.tireRearHealth !== undefined && (
            <HealthBar label="Rear Tire" pct={bike.tireRearHealth} brand={bike.tireRearBrand} />
          )}
          {showDrive && (
            <HealthBar
              label={`${driveIcon} ${driveLabel}`}
              pct={bike.driveHealth!}
              brand={bike.driveBrand}
            />
          )}
        </div>
      )}

      {/* Modifications */}
      <ModificationsSection bike={bike} onShareMod={mod => setShareMod(mod)} />

      {/* Maintenance overview – key items */}
      <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Service Overview</p>
          <button
            onClick={() => setShowAddMaint(true)}
            className="flex items-center gap-1 bg-accent text-white text-xs font-semibold px-3 py-1.5 rounded-full"
          >
            <Plus size={11} />Log
          </button>
        </div>
        <div className="space-y-2">
          {(['oil_change', 'vbelt', 'tire_front', 'tire_rear', 'brake_front', 'chain'] as MaintenanceType[]).map(type => {
            const lastRecord = maintenance.find(m => m.type === type)
            const meta = MAINT_LABELS[type]
            if (!meta.interval) return null
            // Skip vbelt for chain bikes, skip chain for matic bikes
            if (type === 'vbelt' && bike.driveType !== 'vbelt') return null
            if (type === 'chain' && bike.driveType !== 'chain') return null
            const kmSince = lastRecord ? bike.odometer - lastRecord.odometer : meta.interval
            const health = Math.max(0, 1 - kmSince / meta.interval)
            const c = getHealthColors(health * 100)
            const kmLeft = Math.max(0, meta.interval - kmSince)
            return (
              <div key={type} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-white text-xs">{meta.label}</span>
                    <span className={`text-xs font-semibold ${c.text}`}>
                      {kmLeft > 0 ? `${kmLeft.toLocaleString()} km` : 'Overdue!'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${health * 100}%`, backgroundColor: c.bar }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Maintenance history */}
      {maintenance.length > 0 && (
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">
            History ({maintenance.length})
          </p>
          <div className="space-y-3">
            {maintenance.map(r => <MaintenanceCard key={r.id} record={r} odometer={bike.odometer} />)}
          </div>
        </div>
      )}

      {maintenance.length === 0 && (
        <div className="bg-bg-card rounded-2xl p-8 text-center border border-white/5">
          <p className="text-3xl mb-2">🔧</p>
          <p className="text-white font-semibold">No maintenance records</p>
          <p className="text-gray-500 text-sm mt-1">Tap "Log" to add your first record</p>
        </div>
      )}

      {/* Service history posts */}
      <GarageActivitySection />

      {showAddMaint && (
        <AddMaintenanceModal bikeId={bike.id} odometer={bike.odometer} onClose={() => setShowAddMaint(false)} />
      )}

      {showSharePicker && (
        <ConversationPicker
          onSelect={convId => shareGarage(convId)}
          onClose={() => setShowSharePicker(false)}
        />
      )}

      {shareMod && (
        <ConversationPicker
          onSelect={convId => { shareGarage(convId, shareMod); setShareMod(null) }}
          onClose={() => setShareMod(null)}
        />
      )}
    </div>
  )
}

// ── Bike selector tab ─────────────────────────────────────────────────────────

function BikeTab({ bike, isActive, onSelect }: { bike: Bike; isActive: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all ${
        isActive ? 'border-accent bg-accent/10' : 'border-white/8 bg-bg-card'
      }`}
    >
      {/* Mini bike image */}
      <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
        {bike.photo || bike.imageUrl ? (
          <img
            src={bike.photo ?? bike.imageUrl}
            alt={bike.nickname}
            className="w-full h-full object-cover"
            onError={e => {
              // fallback to emoji if image fails
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base"
               style={{ background: bike.color + '30' }}>
            🏍️
          </div>
        )}
      </div>
      <div className="text-left min-w-0">
        <p className={`font-semibold text-xs truncate max-w-[80px] ${isActive ? 'text-accent' : 'text-white'}`}>
          {bike.nickname}
        </p>
        <p className="text-gray-500 text-[10px] truncate">{bike.brand} {bike.model}</p>
      </div>
      {bike.isFavorite && <Star size={10} className="text-accent-amber fill-accent-amber flex-shrink-0" />}
    </button>
  )
}

// ── Main GaragePanel ─────────────────────────────────────────────────────────

export default function GaragePanel() {
  const bikes = useStore(s => s.bikes)
  const activeBikeId = useStore(s => s.activeBikeId)
  const setActiveBike = useStore(s => s.setActiveBike)
  const [showAddBike, setShowAddBike] = useState(false)

  const myBikes = bikes.filter(b => b.riderId === 'rider-1')
  const activeBike = myBikes.find(b => b.id === activeBikeId) ?? myBikes[0]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-xl">Garage</h2>
          <button
            onClick={() => setShowAddBike(true)}
            className="flex items-center gap-2 bg-accent text-white text-sm font-semibold px-3 py-2 rounded-xl"
          >
            <Plus size={14} />
            Add Motorcycle
          </button>
        </div>

        {/* Bike tabs */}
        {myBikes.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {myBikes.map(bike => (
              <BikeTab
                key={bike.id}
                bike={bike}
                isActive={bike.id === activeBike?.id}
                onSelect={() => setActiveBike(bike.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bike detail */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {activeBike ? (
          <BikeDetail bike={activeBike} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <p className="text-6xl mb-4">🏍️</p>
            <p className="text-white font-bold text-lg">No motorcycles yet</p>
            <p className="text-gray-500 text-sm mt-1 text-center">
              Tap "Add Motorcycle" to register your bike
            </p>
            <button
              onClick={() => setShowAddBike(true)}
              className="mt-6 bg-accent text-white font-semibold px-6 py-3 rounded-2xl"
            >
              Add My First Bike
            </button>
          </div>
        )}
      </div>

      {showAddBike && <AddBikeModal onClose={() => setShowAddBike(false)} />}
    </div>
  )
}
