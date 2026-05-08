import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Users, Plus, ChevronRight, MapPin, Navigation, X } from 'lucide-react'
import type { Group } from '../../types'
import { MOCK_RIDERS, MOCK_BIKES } from '../../data/mockData'

function MemberRow({ riderId }: { riderId: string }) {
  const rider = MOCK_RIDERS.find(r => r.id === riderId)
  const bike = MOCK_BIKES.find(b => b.riderId === riderId)
  if (!rider) return null
  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
        style={{ backgroundColor: rider.color + '22', border: `2px solid ${rider.color}` }}
      >
        {rider.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{rider.name}</p>
        <p className="text-gray-500 text-xs truncate">{bike?.brand} {bike?.model}</p>
      </div>
      <div className="text-right">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          rider.status === 'riding' ? 'bg-moto-green/20 text-moto-green' :
          rider.status === 'stopped' ? 'bg-accent-amber/20 text-accent-amber' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {rider.status === 'riding' ? `${rider.speed} km/h` : rider.status}
        </span>
      </div>
    </div>
  )
}

function GroupCard({ group, isActive, onSelect }: { group: Group; isActive: boolean; onSelect: () => void }) {
  const riders = MOCK_RIDERS.filter(r => group.members.includes(r.id))
  const ridingCount = riders.filter(r => r.status === 'riding').length

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-bg-card rounded-2xl p-4 border transition-all ${
        isActive ? 'border-accent' : 'border-white/5 hover:border-white/15'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${isActive ? 'bg-accent/20' : 'bg-bg-surface'}`}>
            {group.emoji}
          </div>
          <div>
            <p className="text-white font-semibold">{group.name}</p>
            <p className="text-gray-500 text-xs">{group.members.length} members · {ridingCount} riding</p>
          </div>
        </div>
        {isActive && (
          <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full font-semibold">Active</span>
        )}
      </div>

      {group.destinationName && (
        <div className="flex items-center gap-2 bg-bg-surface rounded-xl px-3 py-2">
          <MapPin size={12} className="text-accent flex-shrink-0" />
          <p className="text-gray-300 text-xs truncate">{group.destinationName}</p>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        {riders.slice(0, 5).map(rider => (
          <div
            key={rider.id}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{ backgroundColor: rider.color + '33', border: `1.5px solid ${rider.color}` }}
            title={rider.name}
          >
            {rider.avatar}
          </div>
        ))}
      </div>
    </button>
  )
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const createGroup = useStore(s => s.createGroup)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏍️')
  const [desc, setDesc] = useState('')
  const emojis = ['🏍️', '🌊', '🌋', '⚡', '🔥', '🎯', '🚀', '🌴', '💨', '🏆']

  const handle = () => {
    if (!name.trim()) return
    createGroup(name, emoji, desc)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl p-6 w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">New Group</h3>
          <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {emojis.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`w-10 h-10 rounded-xl text-xl flex-shrink-0 transition-all ${emoji === e ? 'bg-accent/20 ring-2 ring-accent' : 'bg-bg-card'}`}
            >
              {e}
            </button>
          ))}
        </div>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Group name"
          className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm mb-3"
        />
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm mb-4 resize-none"
        />

        <button
          onClick={handle}
          disabled={!name.trim()}
          className="w-full bg-accent text-white font-semibold py-3 rounded-xl disabled:opacity-40"
        >
          Create Group
        </button>
      </div>
    </div>
  )
}

export default function GroupPanel() {
  const groups = useStore(s => s.groups)
  const activeGroupId = useStore(s => s.activeGroupId)
  const setActiveGroup = useStore(s => s.setActiveGroup)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const group = selectedGroup ?? groups.find(g => g.id === activeGroupId)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-white font-bold text-xl">Groups</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-accent text-white text-sm font-semibold px-3 py-2 rounded-xl"
        >
          <Plus size={14} />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* Group list */}
        <div className="space-y-3">
          {groups.map(g => (
            <GroupCard
              key={g.id}
              group={g}
              isActive={g.id === activeGroupId}
              onSelect={() => {
                setActiveGroup(g.id)
                setSelectedGroup(g)
              }}
            />
          ))}
        </div>

        {/* Selected group detail */}
        {group && (
          <div className="bg-bg-card rounded-2xl border border-white/5">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <Users size={14} className="text-accent" />
              <span className="text-white font-semibold text-sm">{group.emoji} {group.name} — Members</span>
            </div>
            <div className="px-4 divide-y divide-white/5">
              {group.members.map(id => <MemberRow key={id} riderId={id} />)}
            </div>
            {group.destinationName && (
              <div className="px-4 py-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-sm">
                  <Navigation size={14} className="text-accent" />
                  <span className="text-gray-300">{group.destinationName}</span>
                </div>
                <p className="text-gray-500 text-xs mt-1 ml-5">
                  {group.destination ? `${group.destination.lat.toFixed(4)}, ${group.destination.lng.toFixed(4)}` : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Invite link */}
        {group && (
          <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4">
            <p className="text-white font-semibold text-sm mb-1">Invite Friends</p>
            <p className="text-gray-400 text-xs mb-3">Share this code with friends to join the group</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-bg-card rounded-xl px-3 py-2.5 text-accent font-mono text-sm font-bold tracking-widest">
                MOTO-{group.id.split('-')[1].toUpperCase()}7X
              </div>
              <button className="bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
